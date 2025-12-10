import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import criarPix from './api/criar-pix.js';
import checarStatus from './api/checar-status.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));
app.use(express.static(join(__dirname, 'public'))); // Fallback for static files not in dist if needed

// API Routes
// In-memory store for transaction statuses (for demo purposes)
// In production, use a database (Redis, Postgres, etc.)
const transactions = {};

// API Routes
app.post('/api/criar-pix', criarPix);

// Updated check status: Check local memory first, then fallback to API (or just local)
app.get('/api/checar-status', async (req, res) => {
    const { txid } = req.query;
    if (!txid) return res.status(400).json({ error: 'Transaction ID required' });

    const status = transactions[txid];
    console.log(`[STATUS CHECK] TXID: ${txid} | Local Memory Status: ${status}`);

    if (status) {
        return res.status(200).json({ status: status, full_data: {} });
    }

    // Fallback: Try to query the API directly as per user suggestion
    // User suggested: https://api.ironpay.com/payment/{id}
    // Existing known domain: https://api.ironpayapp.com.br
    // We will try the existing domain with the /payment/ path first, as domains usually match
    try {
        const directCheckUrl = `https://api.ironpayapp.com.br/payment/${txid}`; // Hypothesis: path was wrong before
        // Also valid: https://api.ironpayapp.com.br/api/public/v1/payments/${txid} ?
        
        console.log(`[STATUS CHECK] Polling External API: ${directCheckUrl}`);
        const response = await fetch(directCheckUrl, {
             headers: {
                'Authorization': `Bearer ${process.env.IRONPAY_API_TOKEN}`,
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`[STATUS CHECK] External API Response:`, data);
            const externalStatus = data.status || data.payment_status;
            
            // Update local memory if found
            if (externalStatus) {
                transactions[txid] = externalStatus;
            }
             
            return res.status(200).json({ status: externalStatus || 'pending', full_data: data });
        } else {
             console.log(`[STATUS CHECK] External API Failed: ${response.status} ${response.statusText}`);
        }
    } catch (e) {
        console.error('[STATUS CHECK] External Fetch Error:', e);
    }

    return res.status(200).json({ status: 'pending' });
});

// Webhook Handler - Receives status updates from IronPay/Mercado Pago
app.post('/api/webhook', (req, res) => {
    console.log('[WEBHOOK] Received Raw:', JSON.stringify(req.body, null, 2));
    
    let txid, newStatus;

    // Format 1: User description (IronPay)
    // { "event": "payment_approved", "payment": { "id": "...", "status": "approved" } }
    if (req.body.payment && req.body.payment.id) {
        txid = req.body.payment.id;
        newStatus = req.body.payment.status;
    }
    // Format 2: Old assumption / Mercado Pago style
    // { "action": "...", "data": { "id": "..." } }
    else if (req.body.data && req.body.data.id) {
        txid = req.body.data.id;
        newStatus = req.body.status || 'approved'; // Mercado Pago might need a fetch, but assume approved for now if webhook hits
    }
    // Format 3: Flat
    else if (req.body.id) {
        txid = req.body.id;
        newStatus = req.body.status || req.body.current_status;
    }

    if (txid) {
        // Simplify status to 'approved' for frontend logic if it matches known success states
        if (['paid', 'approved', 'completed', 'succeeded'].includes(newStatus)) {
            newStatus = 'approved';
        }

        transactions[txid] = newStatus;
        console.log(`[WEBHOOK] ✅ PROCESSED | TXID: ${txid} | NewStatus: ${newStatus}`);
    } else {
        console.log('[WEBHOOK] ⚠️ Could not extract Transaction ID from payload');
    }

    res.status(200).send('OK');
});

app.post('/api/log', (req, res) => {
    const { type, message, data } = req.body;
    console.log(`[CLIENT-LOG] [${type.toUpperCase()}] ${message}`, data || '');
    res.status(200).send('Logged');
});

// SPA Fallback - Serve index.html for any unknown route
app.get(/(.*)/, (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
