// api/order.js — Vercel Serverless Function
// Receives order data from the frontend and sends an email alert via Resend.
//
// Required environment variable (set in Vercel dashboard):
//   RESEND_API_KEY   — your Resend API key (from resend.com)
//
// Optional environment variables (have sensible defaults):
//   NOTIFY_EMAIL     — email address to receive order alerts (default: same as FROM_EMAIL)
//   FROM_EMAIL       — verified sender address on Resend (default: orders@yourdomain.com)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL   = process.env.NOTIFY_EMAIL   || 'you@yourdomain.com';
  const FROM_EMAIL     = process.env.FROM_EMAIL      || 'orders@yourdomain.com';

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  let order;
  try {
    order = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { customer, items, total, paymentMethod, orderedAt } = order;

  // Build a clean HTML email
  const itemRows = items.map(i => `
    <tr>
      <td style="padding:8px 12px;">${i.emoji} ${i.name}</td>
      <td style="padding:8px 12px;text-align:center;">${i.qty}</td>
      <td style="padding:8px 12px;text-align:right;">₹${i.price * i.qty}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:'Jost',Helvetica,Arial,sans-serif;background:#FAF7F2;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#FFFDF9;border:1px solid #E8DDD0;padding:32px;">

    <div style="font-size:28px;margin-bottom:4px;">🎉 New Order — Dessert Atlas</div>
    <div style="font-size:13px;color:#A89880;margin-bottom:28px;">${orderedAt}</div>

    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#C4884A;margin-bottom:8px;">Customer</div>
    <table style="width:100%;font-size:14px;color:#3D2B1A;margin-bottom:24px;">
      <tr><td style="padding:4px 0;width:120px;color:#A89880;">Name</td><td>${customer.name}</td></tr>
      <tr><td style="padding:4px 0;color:#A89880;">Phone</td><td>${customer.phone}</td></tr>
      <tr><td style="padding:4px 0;color:#A89880;">Address</td><td>${customer.address}, ${customer.area}, ${customer.city} – ${customer.pincode}</td></tr>
      ${customer.notes ? `<tr><td style="padding:4px 0;color:#A89880;">Notes</td><td>${customer.notes}</td></tr>` : ''}
      <tr><td style="padding:4px 0;color:#A89880;">Payment</td><td>${paymentMethod}</td></tr>
    </table>

    <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#C4884A;margin-bottom:8px;">Order Items</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#3D2B1A;margin-bottom:24px;">
      <thead>
        <tr style="background:#E8DDD0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#A89880;">
          <th style="padding:8px 12px;text-align:left;">Item</th>
          <th style="padding:8px 12px;text-align:center;">Qty</th>
          <th style="padding:8px 12px;text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr style="border-top:2px solid #E8DDD0;">
          <td colspan="2" style="padding:10px 12px;font-weight:500;">Total</td>
          <td style="padding:10px 12px;text-align:right;font-weight:500;color:#C4884A;">₹${total}</td>
        </tr>
      </tfoot>
    </table>

    <div style="font-size:12px;color:#A89880;border-top:1px solid #E8DDD0;padding-top:16px;">
      Dessert Atlas · dessert.atlas@upi · Chennai
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Dessert Atlas Orders <${FROM_EMAIL}>`,
        to: [NOTIFY_EMAIL],
        subject: `🍰 New Order from ${customer.name} — ₹${total}`,
        html
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend error:', err);
      return res.status(502).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
