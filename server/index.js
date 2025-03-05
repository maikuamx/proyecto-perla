import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import Stripe from 'stripe';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize Stripe with test key (replace with your key in production)
const stripe = new Stripe('sk_test_...');

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(join(__dirname, '../')));

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

// API Routes
// Get all products
app.get('/api/products', (req, res) => {
  // For now, return mock data
  const products = [
    {
      id: 1,
      name: "Reloj Bold Chronograph",
      originalPrice: 450.00,
      price: 299.99,
      category: "accessories",
      image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
      id: 2,
      name: "Smartwatch Motion Plus",
      originalPrice: 199.99,
      price: 99.99,
      category: "accessories",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    }
  ];
  res.json(products);
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
  // Mock single product response
  const product = {
    id: parseInt(req.params.id),
    name: "Reloj Bold Chronograph",
    originalPrice: 450.00,
    price: 299.99,
    category: "accessories",
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
  };
  res.json(product);
});

// Get products by category
app.get('/api/products/category/:category', (req, res) => {
  // Mock category products response
  const products = [
    {
      id: 1,
      name: "Reloj Bold Chronograph",
      originalPrice: 450.00,
      price: 299.99,
      category: req.params.category,
      image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    }
  ];
  res.json(products);
});

// Create checkout session
app.post('/api/checkout', async (req, res) => {
  try {
    const { items } = req.body;

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
      cancel_url: `${req.protocol}://${req.get('host')}/cart.html`
    });

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
      'whsec_...' // Replace with your webhook secret
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Payment successful for session:', session.id);
      // Here you would typically update your database
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