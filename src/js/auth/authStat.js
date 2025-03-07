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

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange(handleAuthStateChange);
        
        // Check initial auth state
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            await updateUIForAuthenticatedUser(user);
        } else {
            updateUIForUnauthenticatedUser();
        }
    } catch (error) {
        console.error('Error initializing auth state:', error);
    }
}

async function handleAuthStateChange(event, session) {
    if (event === 'SIGNED_IN') {
        await updateUIForAuthenticatedUser(session.user);
        showSuccess('¡Bienvenido de nuevo!');
    } else if (event === 'SIGNED_OUT') {
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
        
        // Update cart if available
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

async function syncCartWithServer() {
    try {
        const localCart = JSON.parse(localStorage.getItem('cart')) || [];
        if (localCart.length > 0) {
            await window.saveCart(localCart);
        } else {
            const serverCart = await window.getCart();
            if (serverCart.items?.length > 0) {
                localStorage.setItem('cart', JSON.stringify(serverCart.items));
            }
        }
    } catch (error) {
        console.error('Error syncing cart:', error);
    }
}