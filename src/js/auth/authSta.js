import { showSuccess } from '../utils/toast.js';
import { createUserMenu } from '../components/userMenu.js';

let supabaseClient = null;

export async function initAuthState() {
    try {
        // Wait for Supabase client to be initialized
        supabaseClient = await window.initSupabase();
        
        if (!supabaseClient) {
            throw new Error('Failed to initialize Supabase client');
        }

        // Check for existing session in cookies
        const session = Cookies.get('supabase-session');
        if (session) {
            const { data: { user }, error } = await supabaseClient.auth.getUser(session);
            if (!error && user) {
                await updateUIForAuthenticatedUser(user);
            } else {
                Cookies.remove('supabase-session');
                updateUIForUnauthenticatedUser();
            }
        } else {
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
        // Save session in cookies
        Cookies.set('supabase-session', session.access_token, { expires: 7 }); // 7 days expiry
        await updateUIForAuthenticatedUser(session.user);
        showSuccess('¡Bienvenido de nuevo!');
        
        // Sync cart with server
        await syncCartWithServer();
    } else if (event === 'SIGNED_OUT') {
        Cookies.remove('supabase-session');
        updateUIForUnauthenticatedUser();
        showSuccess('Has cerrado sesión correctamente');
    }
}

async function updateUIForAuthenticatedUser(user) {
    try {
        const { data: profile } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
            
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

async function syncCartWithServer() {
    try {
        const localCart = JSON.parse(localStorage.getItem('cart')) || [];
        const { data: serverCart } = await window.getCart();

        if (localCart.length > 0) {
            // Merge local cart with server cart
            const mergedCart = mergeCartItems(localCart, serverCart?.items || []);
            await window.saveCart(mergedCart);
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