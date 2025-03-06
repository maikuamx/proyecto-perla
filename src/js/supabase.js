// API URL for backend communication
const API_URL = 'https://proyecto-perla.onrender.com/api';

// Initialize Supabase client
window.initSupabase = function() {
    if (!window.supabaseClient) {
        window.supabaseClient = window.supabase.createClient(
            'https://rxjquziaipslqtmgqeoz.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4anF1emlhaXBzbHF0bWdxZW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MjQzMTEsImV4cCI6MjA1NjAwMDMxMX0.iu4ovJ2QumGBROQOnbljQ9kPSirYvfgYiEukxJrHD3Q'
        );
    }
    return window.supabaseClient;
};

// Product functions
async function getProducts() {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }
    return await response.json();
}

async function getProductsByCategory(category) {
    const response = await fetch(`${API_URL}/products/category/${category}`);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }
    return await response.json();
}

// Cart functions
async function saveCart(items) {
    const supabaseClient = window.initSupabase();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        localStorage.setItem('cart', JSON.stringify(items));
        return;
    }

    const { error } = await supabaseClient
        .from('carts')
        .upsert({
            user_id: user.id,
            items: items
        })
        .select();

    if (error) throw error;
}

async function getCart() {
    const supabaseClient = window.initSupabase();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        return JSON.parse(localStorage.getItem('cart')) || { items: [] };
    }

    const { data, error } = await supabaseClient
        .from('carts')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || { items: [] };
}

// Checkout functions
async function createCheckoutSession(items) {
    const supabaseClient = window.initSupabase();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User must be logged in to checkout');

    const response = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ items })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
    }

    const { url } = await response.json();
    window.location.href = url;
}

// Make functions available globally
window.getProducts = getProducts;
window.getProductsByCategory = getProductsByCategory;
window.saveCart = saveCart;
window.getCart = getCart;
window.createCheckoutSession = createCheckoutSession;

export { getProducts, getProductsByCategory }