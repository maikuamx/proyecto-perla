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
dotenv.config({ path: './server/.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Verify environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET) {
  console.error('Missing required environment variables');
  process.exit(1);
}

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
app.use(express.static(join(__dirname, '../')));

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin middleware
const isAdmin = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    if (data.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Serve static files
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

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Register user with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.signUp({
      email,
      password: hashedPassword
    });

    if (authError) throw authError;

    // Create user profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert([{
        id: user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'user'
      }]);

    if (profileError) throw profileError;

    res.json({ message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    res.json({
      user: { ...data.user, ...profile },
      session: data.session
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Product Routes
app.get('/api/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/category/:category', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', req.params.category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Product Routes
app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([req.body])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cart Routes
app.post('/api/cart', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('carts')
      .upsert({
        user_id: req.user.id,
        items: req.body.items
      })
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || { items: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Checkout Routes
app.post('/api/checkout', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: req.user.id,
        items,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          images: [item.image]
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/success.html`,
      cancel_url: `${req.protocol}://${req.get('host')}/cart.html`,
      metadata: {
        order_id: order.id
      }
    });

    // Update order with checkout session ID
    await supabase
      .from('orders')
      .update({ checkout_session: session.id })
      .eq('id', order.id);

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Update order status in database
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'completed',
          payment_intent: session.payment_intent
        })
        .eq('checkout_session', session.id);

      if (error) {
        console.error('Error updating order:', error);
      }

      // Clear user's cart after successful purchase
      await supabase
        .from('carts')
        .delete()
        .eq('user_id', session.metadata.user_id);
    }

    res.json({received: true});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});