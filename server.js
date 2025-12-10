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
app.get('/api/checar-status', (req, res) => {
    const { txid } = req.query;
    if (!txid) return res.status(400).json({ error: 'Transaction ID required' });

    const status = transactions[txid];
    console.log(`[STATUS CHECK] TXID: ${txid} | Local Memory Status: ${status}`);

    if (status) {
        return res.status(200).json({ status: status, full_data: {} });
    }

    // If not in memory, we could poll IronPay, but it's returning 404.
    // Let's return 'pending' if not found.
    return res.status(200).json({ status: 'pending' });
});

// Webhook Handler - Receives status updates from IronPay/Mercado Pago
app.post('/api/webhook', (req, res) => {
    console.log('[WEBHOOK] Received:', JSON.stringify(req.body, null, 2));
    
    // User provided format: { Action: 'payment.updated', data: { id: '...' }, ... }
    // Or IronPay format. We'll try to extract the ID and status.
    const { id, data, current_status, status } = req.body;
    
    // Adjust logic to extract ID and Status based on the actual payload structure
    // Assuming the user's example:
    const txid = data?.id || id;
    const newStatus = status || current_status || 'approved'; // Default to approved if we get a webhook? verify payload.

    if (txid) {
        transactions[txid] = newStatus;
        console.log(`[WEBHOOK] Updated TXID: ${txid} to Status: ${newStatus}`);
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
