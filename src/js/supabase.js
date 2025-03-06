// API URL for backend communication
const API_URL = 'https://sapphirus.com.mx/api';

// Initialize Supabase client
window.initSupabase = async function() {
    if (!window.supabaseClient) {
        // Get Supabase configuration from server
        const response = await fetch(`${API_URL}/supabase-config`);
        const { url, anonKey } = await response.json();
        
        window.supabaseClient = window.supabase.createClient(url, anonKey);
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