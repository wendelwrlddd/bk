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
const OFFER_HASH = 'ej35tjf1qc'; // Just the code part
const PRODUCT_HASH = 'gwpe1wnoov';

app.post('/api/create-pix', async (req, res) => {
    console.log('Received Pix creation request:', req.body);

    const { customer, order } = req.body;

    // Convert amount to cents (IronPay expects values in centavos)
    const amountInCents = Math.round(order.total * 100);

    // Payload structure based on IronPay documentation
    const payload = {
        api_token: API_TOKEN,
        offer_hash: OFFER_HASH,
        product_hash: PRODUCT_HASH,
        payment_method: 'pix',
        installments: 1,
        amount: amountInCents,
        cart: [
            {
                product_hash: PRODUCT_HASH,
                title: order.product,
                quantity: order.quantity,
                price: amountInCents,
                tangible: true,
                operation_type: 1 // 1 = Payment/Sale
            }
        ],
        customer: {
            name: customer.name,
            email: customer.email,
            cpf: customer.cpf,
            phone: customer.phone
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
            return res.status(400).json({
                success: false,
                message: 'Pagamento recusado pela IronPay. Verifique se o offer_hash e product_hash estão corretos para sua conta.',
                details: response.data.status_reason || 'Sem detalhes adicionais'
            });
        }

        const qrCodeData = response.data.pix || response.data.qrcode || response.data;
        
        // Check if QR code was generated
        if (!qrCodeData.pix_qr_code && !qrCodeData.qr_code_text && !qrCodeData.qrcode) {
            console.error('No QR code in response:', response.data);
            return res.status(400).json({
                success: false,
                message: 'IronPay não gerou o QR Code. Status: ' + response.data.payment_status,
                transactionHash: response.data.hash,
                details: 'Verifique se o offer_hash e product_hash correspondem à mesma conta do token'
            });
        }
        
        res.json({
            success: true,
            transactionHash: response.data.hash || response.data.transaction_hash,
            qrCodeImage: qrCodeData.pix_qr_code || qrCodeData.qr_code_image || qrCodeData.qrcode_image || qrCodeData.image_base64,
            qrCodeText: qrCodeData.pix_qr_code || qrCodeData.qr_code_text || qrCodeData.qrcode || qrCodeData.emv || qrCodeData.payload,
            message: 'Pix gerado com sucesso!'
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('IronPay integration configured');
});
