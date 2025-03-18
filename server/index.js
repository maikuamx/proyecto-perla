import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import Stripe from 'stripe';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize Stripe with secret key from env
const stripe = new Stripe(process.env.STRIPE_KEY_SECRET);

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET
);

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve static files
app.use(express.static(join(__dirname, '../')));
app.use('/src', express.static(join(__dirname, '../src')));

// Stripe configuration endpoint
app.get('/api/stripe-config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_KEY_PUBLIC
  });
});

// Create payment intent endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});


// Supabase config endpoint
app.get('/api/supabase-config', (req, res) => {
  res.json({
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_SECRET
  });
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../index.html'));
});

app.get('/catalogo.html', (req, res) => {
  res.sendFile(join(__dirname, '../catalogo.html'));
});

app.get('/cart.html', (req, res) => {
  res.sendFile(join(__dirname, '../cart.html'));
});

app.get('/iniciarsesion.html', (req, res) => {
  res.sendFile(join(__dirname, '../iniciarsesion.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(join(__dirname, '../admin.html'));
});

// Helper functions for payment handling
async function handleSuccessfulPayment(paymentIntent) {
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status: 'completed', payment_intent_id: paymentIntent.id })
      .eq('payment_intent_id', paymentIntent.id)
      .select()
      .single();

    if (error) throw error;

    // Clear user's cart after successful payment
    if (order.user_id) {
      await supabase
        .from('carts')
        .delete()
        .eq('user_id', order.user_id);
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(paymentIntent) {
  try {
    await supabase
      .from('orders')
      .update({ status: 'failed' })
      .eq('payment_intent_id', paymentIntent.id);
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});