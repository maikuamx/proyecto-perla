// API URL for backend communication
const API_URL = 'https://proyecto-perla.onrender.com/api';

// Initialize Supabase client
let supabaseClient = null;

// Load Supabase script dynamically
async function loadSupabaseScript() {
    return new Promise((resolve, reject) => {
        if (window.supabase) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Supabase script'));
        document.head.appendChild(script);
    });
}

// Initialize Supabase client
window.initSupabase = async function() {
    if (!supabaseClient) {
        try {
            // Ensure Supabase script is loaded
            await loadSupabaseScript();
            
            // Wait for window.supabase to be available
            if (!window.supabase) {
                throw new Error('Supabase not available');
            }

            // Get Supabase configuration from server
            const response = await fetch(`${API_URL}/supabase-config`);
            if (!response.ok) {
                throw new Error('Failed to fetch Supabase config');
            }
            const { url, anonKey } = await response.json();
            
            if (!url || !anonKey) {
                throw new Error('Invalid Supabase configuration');
            }

            supabaseClient = window.supabase.createClient(url, anonKey);

            // Initialize auth state
            await initAuthState();

            return supabaseClient;
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            return null;
        }
    }
    return supabaseClient;
};

// Initialize auth state
async function initAuthState() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            const { data: profile } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                // Check if we're on admin page and user is not admin
                if (window.location.pathname === '/admin.html' && profile.role !== 'admin') {
                    window.location.href = '/';
                    return;
                }

                // Update UI for authenticated user
                await updateUIForAuthenticatedUser(profile);
            }
        } else {
            // If not authenticated and trying to access protected pages
            const protectedPages = ['/perfil.html', '/pedidos.html', '/direcciones.html'];
            if (protectedPages.includes(window.location.pathname)) {
                window.location.href = '/iniciarsesion.html';
                return;
            }
            updateUIForUnauthenticatedUser();
        }

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange(handleAuthStateChange);
    } catch (error) {
        console.error('Error initializing auth state:', error);
        updateUIForUnauthenticatedUser();
    }
}

async function handleAuthStateChange(event, session) {
    if (event === 'SIGNED_IN') {
        const { data: profile } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            await updateUIForAuthenticatedUser(profile);
        }
    } else if (event === 'SIGNED_OUT') {
        updateUIForUnauthenticatedUser();
        if (window.location.pathname !== '/' && window.location.pathname !== '/iniciarsesion.html') {
            window.location.href = '/';
        }
    }
}

async function updateUIForAuthenticatedUser(profile) {
    try {
        // Update navigation icons
        const navIcons = document.querySelector('.nav-icons');
        const userLink = navIcons?.querySelector('a[href="/iniciarsesion.html"]');
        
        if (userLink && profile) {
            const userMenu = createUserMenu(profile);
            userLink.replaceWith(userMenu);
            
            // Setup logout handler
            const logoutBtn = userMenu.querySelector('#logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    try {
                        const { error } = await supabaseClient.auth.signOut();
                        if (!error) {
                            window.location.href = '/';
                        }
                    } catch (error) {
                        console.error('Error signing out:', error);
                    }
                });
            }
            
            // Setup menu toggle
            const menuTrigger = userMenu.querySelector('.user-menu-trigger');
            if (menuTrigger) {
                menuTrigger.addEventListener('click', () => {
                    userMenu.classList.toggle('active');
                });
            }
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target)) {
                    userMenu.classList.remove('active');
                }
            });
        }
        
        // Sync cart with server
        await syncCartWithServer();
    } catch (error) {
        console.error('Error updating UI for authenticated user:', error);
    }
}

function updateUIForUnauthenticatedUser() {
    try {
        const navIcons = document.querySelector('.nav-icons');
        const userMenu = navIcons?.querySelector('.user-menu');
        
        if (userMenu) {
            const loginLink = document.createElement('a');
            loginLink.href = '/iniciarsesion.html';
            loginLink.innerHTML = '<i class="fas fa-user"></i>';
            userMenu.replaceWith(loginLink);
        }
    } catch (error) {
        console.error('Error updating UI for unauthenticated user:', error);
    }
}

function createUserMenu(user) {
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    
    menu.innerHTML = `
        <button class="user-menu-trigger">
            <i class="fas fa-user-circle"></i>
            <span class="user-name">${user.first_name || 'Usuario'}</span>
            <i class="fas fa-chevron-down"></i>
        </button>
        <div class="user-menu-dropdown">
            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-details">
                    <span class="user-fullname">${user.first_name} ${user.last_name}</span>
                    <span class="user-email">${user.email}</span>
                </div>
            </div>
            <div class="menu-items">
                <a href="/perfil.html" class="menu-item">
                    <i class="fas fa-user-cog"></i>
                    Mi Perfil
                </a>
                <a href="/pedidos.html" class="menu-item">
                    <i class="fas fa-shopping-bag"></i>
                    Mis Pedidos
                </a>
                <a href="/direcciones.html" class="menu-item">
                    <i class="fas fa-map-marker-alt"></i>
                    Mis Direcciones
                </a>
                <button class="menu-item" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i>
                    Cerrar Sesión
                </button>
            </div>
        </div>
    `;
    
    return menu;
}

// Product functions
async function getProducts() {
    try {
        if (!supabaseClient) {
            supabaseClient = await window.initSupabase();
        }
        
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
        if (!supabaseClient) {
            supabaseClient = await window.initSupabase();
        }
        
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
        if (!supabaseClient) {
            supabaseClient = await window.initSupabase();
        }
        
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
        if (!supabaseClient) {
            supabaseClient = await window.initSupabase();
        }
        
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

async function syncCartWithServer() {
    try {
        const localCart = JSON.parse(localStorage.getItem('cart')) || [];
        const { data: serverCart } = await getCart();

        if (localCart.length > 0) {
            // Merge local cart with server cart
            const mergedCart = mergeCartItems(localCart, serverCart?.items || []);
            await saveCart(mergedCart);
            localStorage.setItem('cart', JSON.stringify(mergedCart));
        } else if (serverCart?.items?.length > 0) {
            localStorage.setItem('cart', JSON.stringify(serverCart.items));
        }
    } catch (error) {
        console.error('Error syncing cart:', error);
    }
}

function mergeCartItems(localItems, serverItems) {
    const mergedItems = [...serverItems];
    
    localItems.forEach(localItem => {
        const existingItem = mergedItems.find(item => item.id === localItem.id);
        if (existingItem) {
            existingItem.quantity += localItem.quantity;
        } else {
            mergedItems.push(localItem);
        }
    });
    
    return mergedItems;
}

// Make functions available globally
window.getProducts = getProducts;
window.getProductsByCategory = getProductsByCategory;
window.saveCart = saveCart;
window.getCart = getCart;

export { getProducts, getProductsByCategory }