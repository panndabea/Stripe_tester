'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app  = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", 'https://js.stripe.com'],
      frameSrc:   ['https://js.stripe.com', 'https://hooks.stripe.com'],
      connectSrc: ["'self'", 'https://api.stripe.com'],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
    },
  },
}));
// Allow same-origin requests only (works regardless of hostname or port)
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());
app.use(express.static('.'));

// Validate that required environment variables are set
if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PUBLISHABLE_KEY) {
  console.error('ERROR: STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY must be set in .env');
  process.exit(1);
}

// Serve the publishable key to the frontend (never the secret key)
app.get('/config', (_req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// Create a PaymentIntent on the server so the secret key is never exposed
app.post('/create-payment-intent', async (req, res) => {
  const { amount, currency = 'usd' } = req.body;

  if (!Number.isInteger(amount) || amount < 50) {
    return res.status(400).json({ error: 'amount must be an integer in cents and at least 50' });
  }
  if (amount > 99999999) {
    return res.status(400).json({ error: 'amount exceeds the maximum of 99999999 cents' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
