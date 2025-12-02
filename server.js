const express = require('express');
const cors = require('cors');
const axios = require('axios');
const QRCode = require('qrcode');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Configuration
const IRONPAY_API_URL = 'https://api.ironpayapp.com.br/api/public/v1/transactions';
const API_TOKEN = 'kqi8TszG7xxIcMcOuVb5yQHUGsDLoqzg8zOHsr5LEKwT8icEixQAoMPNVixO';
const OFFER_HASH = 'dqrtzjkszk_ouiojpb4p1'; // Correct offer hash for R$ 39,90
const PRODUCT_HASH = 'dqrtzjkszk'; // New product hash

app.post('/api/create-pix', async (req, res) => {
    console.log('Received Pix creation request:', req.body);

    const { customer, order, address } = req.body;

    // Convert amount to cents (IronPay expects values in centavos)
    const amountInCents = Math.round(order.total * 100);

    // Payload structure based on IronPay documentation
    const payload = {
        api_token: API_TOKEN,
        offer_hash: OFFER_HASH,
        payment_method: 'pix',
        installments: 1,
        amount: amountInCents,
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
            name: customer.name,
            email: customer.email,
            document: customer.cpf.replace(/\D/g, ''), // IronPay uses 'document' for CPF
            phone: customer.phone.replace(/\D/g, ''), // Ensure only numbers
            phone_number: customer.phone.replace(/\D/g, '').slice(2), // Without country code (assuming BR)
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

    try {
        console.log('Calling IronPay API at:', IRONPAY_API_URL);
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        const response = await axios.post(IRONPAY_API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 30000
        });

        console.log('IronPay API Response:', response.data);

        // Check payment status
        if (response.data.payment_status === 'refused') {
            console.error('Payment refused by IronPay');
            console.error('Full IronPay Response:', JSON.stringify(response.data, null, 2));
            return res.status(400).json({
                success: false,
                message: 'Pagamento recusado pela IronPay',
                status_reason: response.data.status_reason || null,
                payment_status: response.data.payment_status,
                transaction_hash: response.data.hash,
                transaction_id: response.data.id,
                full_response: response.data // Send complete response for debugging
            });
        }

        console.log('IronPay Payment Approved:', response.data);

        // Extract QR Code data handling multiple possible structures
        const pixData = response.data.pix || response.data;
        const qrCodeImage = pixData.qrcode_image || pixData.qr_code_image || pixData.pix_qr_code || response.data.qrcode_image;
        const qrCodeText = pixData.qrcode || pixData.qr_code_text || pixData.pix_qr_code || response.data.qrcode;

        // If we have text but no image, we can generate one (optional, but good fallback)
        // For now, let's just send what we have
        
        res.json({
            success: true,
            transactionHash: response.data.hash || response.data.transaction_hash,
            qrCodeImage: qrCodeImage,
            qrCodeText: qrCodeText,
            message: 'Pix gerado com sucesso!',
            full_data: response.data
        });

    } catch (error) {
        console.error('IronPay API Error:', error.message);
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            
            res.status(error.response.status).json({
                success: false,
                message: error.response.data.message || 'Erro ao processar pagamento',
                errors: error.response.data.errors || {}
            });
        } else {
            console.error('Network Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro de conexão com o servidor de pagamentos'
            });
        }
    }
});

app.post('/api/log', (req, res) => {
    const { type, message, data } = req.body;
    const timestamp = new Date().toISOString();
    console.log(`[FRONTEND-LOG] [${timestamp}] [${type.toUpperCase()}]: ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('IronPay integration configured');
});
