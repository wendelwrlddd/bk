import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));
app.use(express.static(join(__dirname, 'public')));

// GLOBAL MEMORY STORE
global.pagamentos = {}; // User requested global variable for stability

// === API ROUTES ===

// 1. CRIAR PIX (Merged Logic)
app.post('/api/criar-pix', async (req, res) => {
    try {
        console.log('[API] CRIAR PIX INICIADO');
        const { customer, order = { total: 29.90, product: 'Combo BK', quantity: 1 }, address } = req.body;
        
        const OFFER_HASH = 'dqrtzjkszk_ouiojpb4p1'; 
        const PRODUCT_HASH = 'dqrtzjkszk';
        const amountInCents = Math.round(order.total * 100);

        const payload = {
            api_token: process.env.IRONPAY_API_TOKEN,
            offer_hash: OFFER_HASH,
            payment_method: 'pix',
            installments: 1,
            amount: amountInCents,
            notification_url: 'https://deliveryagora-backend.fly.dev/api/webhook',
            cart: [
                {
                    product_hash: PRODUCT_HASH,
                    title: order.product,
                    quantity: order.quantity,
                    price: amountInCents,
                    tangible: false,
                    operation_type: 1
                }
            ],
            customer: {
                name: customer?.name || 'Cliente',
                email: customer?.email || 'email@teste.com',
                document: customer?.cpf?.replace(/\D/g, '') || '00000000000',
                phone: customer?.phone?.replace(/\D/g, '') || '00000000000',
                phone_number: customer?.phone?.replace(/\D/g, '').slice(2) || '900000000',
                phone_country_code: '55',
                zip_code: address?.cep?.replace(/\D/g, '') || '00000000',
                street_name: address?.street || 'Rua',
                number: address?.number || '0',
                complement: address?.complement || '',
                neighborhood: address?.neighborhood || 'Bairro',
                city: address?.city || 'Cidade',
                state: address?.state || 'SP',
                country: 'br'
            }
        };

        console.log('[API] Sending to IronPay...');
        const response = await fetch('https://api.ironpayapp.com.br/api/public/v1/transactions', { 
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.IRONPAY_API_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('[API] IronPay Response:', JSON.stringify(data, null, 2));

        if (data.payment_status === 'refused' || data.error) {
            return res.status(400).json({ success: false, message: 'Pagamento recusado', data });
        }

        // Extract ID and QR Code
        const txid = data.id || data.txid; // IronPay response: { "id": 12345, ... } based on user provided ex
        const pixData = data.pix || data;
        let qrCodeImage = pixData.qrcode_image || pixData.qr_code_image || pixData.pix_qr_code || data.qrcode_image;
        const qrCodeText = pixData.qrcode || pixData.qr_code_text || pixData.pix_qr_code || data.qrcode;

        if (qrCodeText && (!qrCodeImage || !qrCodeImage.startsWith('http'))) {
            try {
                qrCodeImage = await QRCode.toDataURL(qrCodeText);
            } catch (e) { console.error('QR Gen Error:', e); }
        }

        // SAVE TO GLOBAL MEMORY
        if (txid) {
            global.pagamentos[txid] = { 
                status: 'pending', 
                createdAt: Date.now(),
                rawData: data
            };
            console.log(`[MEMORY] Saved TXID: ${txid} | Status: pending`);
        }

        res.status(200).json({
            success: true,
            transactionId: txid,
            qrCodeImage: qrCodeImage,
            qrCodeText: qrCodeText,
            full_data: data
        });

    } catch (error) {
        console.error('[API] Create Error:', error);
        res.status(500).json({ success: false, message: 'Erro interno' });
    }
});

// 2. CHECK STATUS
app.get('/api/checar-status', async (req, res) => {
    const { txid } = req.query;
    if (!txid) return res.status(400).json({ error: 'Transaction ID required' });

    // 1. Check Memory
    const memoryData = global.pagamentos[txid];
    console.log(`[STATUS CHECK] TXID: ${txid} | Memory: ${memoryData?.status}`);

    const validStatuses = ['paid', 'approved', 'completed', 'succeeded', 'confirmed', 'settled'];
    if (memoryData && validStatuses.includes(memoryData.status?.toLowerCase())) {
        return res.status(200).json({ status: memoryData.status });
    }

    // 2. Poll API (Fallback)
    try {
        console.log(`[STATUS CHECK] Polling External API for ${txid}...`);
        // User suggested endpoint structure
        const response = await fetch(`https://api.ironpayapp.com.br/payment/${txid}`, {
             headers: {
                'Authorization': `Bearer ${process.env.IRONPAY_API_TOKEN}`,
                'Accept': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const externalStatus = data.status || data.payment_status;
            console.log(`[STATUS CHECK] External Outcome: ${externalStatus}`);
            
            if (externalStatus) {
                // Update memory
                if (!global.pagamentos[txid]) global.pagamentos[txid] = {};
                global.pagamentos[txid].status = externalStatus;
                
                return res.status(200).json({ status: externalStatus });
            }
        } else {
            console.log(`[STATUS CHECK] External HTTP ${response.status}`);
        }
    } catch (e) {
        console.error('[STATUS CHECK] External Error:', e.message);
    }

    // Default
    res.status(200).json({ status: 'pending' });
});

// 3. WEBHOOK
app.post('/api/webhook', (req, res) => {
    console.log('[WEBHOOK] Received:', JSON.stringify(req.body));
    
    // Parse Payload
    let txid, newStatus;
    
    if (req.body.payment) { // User Format
        txid = req.body.payment.id;
        newStatus = req.body.payment.status;
    } else if (req.body.data) { // Standard Format?
        txid = req.body.data.id;
        newStatus = 'approved'; 
    } else if (req.body.id) { // Flat
        txid = req.body.id;
        newStatus = req.body.status;
    }

    if (txid && newStatus) {
         // Normalize status
         const validStatuses = ['paid', 'approved', 'completed', 'succeeded', 'confirmed', 'settled'];
         if (validStatuses.includes(newStatus.toLowerCase())) {
             newStatus = 'approved';
         }

        if (!global.pagamentos[txid]) global.pagamentos[txid] = {};
        global.pagamentos[txid].status = newStatus;
        console.log(`[WEBHOOK] Updated ${txid} -> ${newStatus}`);
    }

    res.status(200).send('OK');
});

app.post('/api/log', (req, res) => {
    console.log(`[CLIENT] ${req.body.message}`);
    res.send('ok');
});

// Fallback
app.get('*', (req, res) => {
    // Only serve index for html requests, avoid swallowing API errors
    if (req.headers.accept && req.headers.accept.includes('html')) {
        res.sendFile(join(__dirname, 'dist', 'index.html'));
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on ${PORT}`));

process.on('uncaughtException', (err) => {
    console.error('[CRASH] Uncaught Exception:', err);
    // Keep alive if possible, or exit gracefully
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[CRASH] Unhandled Rejection at:', promise, 'reason:', reason);
});
