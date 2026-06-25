const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const fetch = require('node-fetch');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// For webhook signature verification we need the raw body
app.use('/webhook', bodyParser.raw({ type: '*/*' }));

const PORT = process.env.PORT || 3000;
const RAZOR_KEY_ID = process.env.RAZOR_KEY_ID || '';
const RAZOR_KEY_SECRET = process.env.RAZOR_KEY_SECRET || '';
const RAZOR_WEBHOOK_SECRET = process.env.RAZOR_WEBHOOK_SECRET || '';
const GOOGLE_DATABASE_URL = process.env.GOOGLE_DATABASE_URL || '';
const OWNER_WHATSAPP_NUMBER = process.env.OWNER_WHATSAPP_NUMBER || '';

const razor = new Razorpay({ key_id: RAZOR_KEY_ID, key_secret: RAZOR_KEY_SECRET });

// In-memory store for demo/testing. Replace with DB for production.
const ORDERS = {}; // key: orderId -> { orderId, razorOrderId, status, total, items, customer, payment }

function saveOrderToCloud(obj) {
  if (!GOOGLE_DATABASE_URL) return Promise.resolve();
  return fetch(GOOGLE_DATABASE_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  }).catch(err => console.log('Cloud Save Error:', err));
}

app.post('/create-order', async (req, res) => {
  try {
    const { name, phone, email, items, total } = req.body;
    if (!total) return res.status(400).json({ success: false, message: 'Missing total amount' });

    const orderId = 'NS' + Date.now().toString().slice(-8);
    const amountPaise = Math.round(Number(total) * 100);

    const order = await razor.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: orderId,
      payment_capture: 1
    });

    ORDERS[orderId] = {
      orderId,
      razorOrderId: order.id,
      status: 'PENDING',
      total: Number(total),
      items: items || [],
      customer: { name, phone, email },
      createdAt: new Date().toISOString()
    };

    // Persist PENDING order to cloud (optional)
    saveOrderToCloud({ action: 'createOrder', orderId, name, phone, email, items, total, status: 'PENDING', date: new Date().toLocaleString('en-IN') });

    res.json({ success: true, orderId, razorOrderId: order.id, keyId: RAZOR_KEY_ID });
  } catch (e) {
    console.error('create-order error', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/order-status/:orderId', (req, res) => {
  const { orderId } = req.params;
  const ord = ORDERS[orderId];
  if (!ord) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, order: ord });
});

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer
  if (!RAZOR_WEBHOOK_SECRET) {
    console.warn('No webhook secret configured — skipping signature check');
  } else {
    const expected = crypto.createHmac('sha256', RAZOR_WEBHOOK_SECRET).update(rawBody).digest('hex');
    if (expected !== signature) {
      console.warn('Invalid webhook signature');
      return res.status(400).send('invalid signature');
    }
  }

  let payload;
  try { payload = JSON.parse(rawBody.toString()); } catch (e) { return res.status(400).send('invalid json'); }

  // Handle payment captured event
  const event = payload.event;
  if (event === 'payment.captured' || event === 'payment.authorized') {
    const payment = payload.payload.payment.entity;
    const razorOrderId = payment.order_id;
    // Find our order by razorOrderId
    const orderEntry = Object.values(ORDERS).find(o => o.razorOrderId === razorOrderId);
    if (orderEntry) {
      orderEntry.status = 'PAID';
      orderEntry.payment = {
        payment_id: payment.id,
        method: payment.method,
        amount: payment.amount / 100,
        currency: payment.currency,
        vpa: payment.vpa || null
      };

      // Persist PAID status to cloud
      saveOrderToCloud({ action: 'updateOrder', orderId: orderEntry.orderId, status: 'PAID', payment: orderEntry.payment, date: new Date().toLocaleString('en-IN') });

      // Optionally notify owner via WhatsApp link (just log here)
      console.log('Order marked PAID:', orderEntry.orderId);

      // Respond OK
      return res.status(200).send('ok');
    }
  }

  res.status(200).send('ignored');
});

app.listen(PORT, () => console.log(`Payment server listening on port ${PORT}`));
