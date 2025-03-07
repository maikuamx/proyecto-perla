// API URL for backend communication
const API_URL = 'https://proyecto-perla.onrender.com/api';

// Initialize Supabase client
window.initSupabase = async function() {
    if (!window.supabaseClient) {
        try {
            // Get Supabase configuration from server
            const response = await fetch(`${API_URL}/supabase-config`);
            if (!response.ok) {
                throw new Error('Failed to fetch Supabase config');
            }
            const { url, anonKey } = await response.json();
            
            if (!url || !anonKey) {
                throw new Error('Invalid Supabase configuration');
            }

            window.supabaseClient = window.supabase.createClient(url, anonKey);
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            return null;
        }
    }
    return window.supabaseClient;
};

// Product functions
async function getProducts() {
    try {
        const supabaseClient = await window.initSupabase();
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function getProductsByCategory(category) {
    try {
        const supabaseClient = await window.initSupabase();
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching products by category:', error);
        return [];
    }
}

// Cart functions
async function saveCart(items) {
    try {
        const supabaseClient = await window.initSupabase();
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

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
    } catch (error) {
        console.error('Error saving cart:', error);
        throw error;
    }
}

async function getCart() {
    try {
        const supabaseClient = await window.initSupabase();
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            return { items: JSON.parse(localStorage.getItem('cart')) || [] };
        }

        const { data, error } = await supabaseClient
            .from('carts')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || { items: [] };
    } catch (error) {
        console.error('Error fetching cart:', error);
        return { items: [] };
    }
}

// Make functions available globally
window.getProducts = getProducts;
window.getProductsByCategory = getProductsByCategory;
window.saveCart = saveCart;
window.getCart = getCart;

export { getProducts, getProductsByCategory }