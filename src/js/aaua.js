import { showSuccess, showError } from './utils/toast.js';
import { createUserMenu } from './components/userMenu.js';

// Auth state management
let currentUser = null;
let supabaseClient = null;

// Initialize authentication
async function initAuth() {
    supabaseClient = window.supabase.createClient(
        'https://rxjquziaipslqtmgqeoz.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4anF1emlhaXBzbHF0bWdxZW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MjQzMTEsImV4cCI6MjA1NjAwMDMxMX0.iu4ovJ2QumGBROQOnbljQ9kPSirYvfgYiEukxJrHD3Q'
    );
    window.supabaseClient = supabaseClient;

    // Check for existing session
    const session = Cookies.get('supabase-session');
    if (session) {
        const { data: { user }, error } = await supabaseClient.auth.getUser(session);
        if (!error && user) {
            currentUser = user;
            await updateUIForAuthenticatedUser(user);
        } else {
            Cookies.remove('supabase-session');
            updateUIForUnauthenticatedUser();
        }
    }

    setupFormHandlers();
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
                            Cookies.remove('supabase-session');
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

// Setup form handlers
function setupFormHandlers() {
    setupFormSwitching();
    setupPasswordToggles();
    setupLoginForm();
    setupRegisterForm();
}

// Form switching
function setupFormSwitching() {
    const switchButtons = document.querySelectorAll('.switch-form');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    switchButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const formToShow = button.dataset.form;
            
            if (formToShow === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                registerForm.classList.add('active');
                loginForm.classList.remove('active');
            }
        });
    });
}

// Password visibility toggles
function setupPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.parentElement.querySelector('input');
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
}

// Login form handling
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm').querySelector('form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const submitBtn = loginForm.querySelector('.auth-btn');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
            submitBtn.disabled = true;

            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Save session
            Cookies.set('supabase-session', data.session.access_token, { expires: 7 });
            currentUser = data.user;

            // Get user profile to check role
            const { data: profile } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();

            showSuccess('¡Inicio de sesión exitoso!');
            
            // Redirect based on user role
            setTimeout(() => {
                if (profile.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    const checkoutRedirect = localStorage.getItem('checkoutRedirect');
                    if (checkoutRedirect) {
                        localStorage.removeItem('checkoutRedirect');
                        window.location.href = '/cart.html';
                    } else {
                        window.location.href = '/';
                    }
                }
            }, 1500);

        } catch (error) {
            showError(getErrorMessage(error));
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Register form handling
function setupRegisterForm() {
    const registerForm = document.getElementById('registerForm').querySelector('form');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        
        if (!validateRegistration(email, password, firstName, lastName)) return;
        
        const submitBtn = registerForm.querySelector('.auth-btn');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
            submitBtn.disabled = true;

            const { data: { user }, error: signUpError } = await supabaseClient.auth.signUp({
                email,
                password
            });

            if (signUpError) throw signUpError;

            const { error: profileError } = await supabaseClient
                .from('users')
                .insert([{
                    id: user.id,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    role: 'user'
                }]);

            if (profileError) throw profileError;

            showSuccess('¡Cuenta creada exitosamente!');
            
            setTimeout(() => {
                const loginForm = document.getElementById('loginForm');
                const registerForm = document.getElementById('registerForm');
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
                document.getElementById('loginEmail').value = email;
            }, 1500);

        } catch (error) {
            showError(getErrorMessage(error));
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Validation
function validateRegistration(email, password, firstName, lastName) {
    if (!email || !password || !firstName || !lastName) {
        showError('Por favor, completa todos los campos');
        return false;
    }

    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return false;
    }

    return true;
}

// Error message handling
function getErrorMessage(error) {
    const errorMessages = {
        'Invalid login credentials': 'Credenciales inválidas',
        'Email already registered': 'Este correo ya está registrado',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
        'Invalid email': 'Correo electrónico inválido'
    };

    return errorMessages[error.message] || 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);