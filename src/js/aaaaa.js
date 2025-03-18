import { showSuccess, showError } from './utils/toast.js';
import Cookies from '../../node_modules/js-cookie/';

// Auth state management
let currentUser = null;

// Initialize authentication
async function initAuth() {
    const supabaseClient = window.supabase.createClient(
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
            updateUIForAuthenticatedUser();
        }
    }

    setupFormHandlers();
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

            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            // Save session
            Cookies.set('supabase-session', data.session.access_token, { expires: 7 });

            // Get user profile to check role
            const { data: profile } = await window.supabaseClient
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

            const { data: { user }, error: signUpError } = await window.supabaseClient.auth.signUp({
                email,
                password
            });

            if (signUpError) throw signUpError;

            const { error: profileError } = await window.supabaseClient
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