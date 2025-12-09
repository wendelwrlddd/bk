import QRCode from 'qrcode';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { customer, order = { total: 29.90, product: 'Combo BK', quantity: 1 }, address } = req.body;
  
  // Hardcoded for safety/demo, should match env vars ideally
  const OFFER_HASH = 'dqrtzjkszk_ouiojpb4p1'; 
  const PRODUCT_HASH = 'dqrtzjkszk';
  
  const amountInCents = Math.round(order.total * 100);

  const payload = {
    api_token: process.env.IRONPAY_API_TOKEN,
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

  try {
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
    
    // Check for IronPay specific error structure
    if (data.payment_status === 'refused' || data.error) {
       return res.status(400).json({ success: false, message: 'Pagamento recusado', data });
    }

    // Extract QR Code data
    const pixData = data.pix || data;
    // Handle different possible response fields from IronPay
    let qrCodeImage = pixData.qrcode_image || pixData.qr_code_image || pixData.pix_qr_code || data.qrcode_image;
    const qrCodeText = pixData.qrcode || pixData.qr_code_text || pixData.pix_qr_code || data.qrcode;

    // Generate QR Code Image locally if API didn't return one
    if (qrCodeText && (!qrCodeImage || !qrCodeImage.startsWith('http'))) {
        try {
            qrCodeImage = await QRCode.toDataURL(qrCodeText);
        } catch (e) {
            console.error('Failed to generate local QR Code:', e);
        }
    }

    res.status(200).json({
        success: true,
        transactionId: data.id || data.txid, // We need this for polling
        qrCodeImage: qrCodeImage,
        qrCodeText: qrCodeText,
        full_data: data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erro interno ao processar pagamento' });
  }
}
