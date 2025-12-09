export default async function handler(req, res) {
  const { txid } = req.query; 

  if (!txid) return res.status(400).json({ error: 'Transaction ID required' });

  try {
    const response = await fetch(`https://api.ironpayapp.com.br/api/public/v1/transactions/${txid}`, {
      headers: {
        'Authorization': `Bearer ${process.env.IRONPAY_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
        throw new Error(`IronPay API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Map IronPay status
    // Expected statuses: 'pending', 'paid', 'refused'
    res.status(200).json({ status: data.status || data.payment_status, full_data: data }); 
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
}
