// Auth state management
let currentUser = null;

// Initialize authentication
async function initAuth() {
    const supabaseClient = window.supabase.createClient(
        'https://rxjquziaipslqtmgqeoz.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4anF1emlhaXBzbHF0bWdxZW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MjQzMTEsImV4cCI6MjA1NjAwMDMxMX0.iu4ovJ2QumGBROQOnbljQ9kPSirYvfgYiEukxJrHD3Q'
    );
    window.supabaseClient = supabaseClient;

    // Check initial auth state
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        handleAuthStateChange();
    }

    // Listen for auth changes
    supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        handleAuthStateChange();
    });

    setupFormHandlers();
}

// Handle auth state changes
async function handleAuthStateChange() {
    if (!currentUser) return;

    try {
        // Get user profile
        const { data: profile, error } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;

        // Check email verification
        if (!profile.email_verified) {
            showWarning('Por favor, verifica tu correo electrónico para continuar');
            return;
        }

        // Redirect based on role
        const checkoutRedirect = localStorage.getItem('checkoutRedirect');
        if (checkoutRedirect) {
            localStorage.removeItem('checkoutRedirect');
            window.location.href = '/cart.html';
        } else if (profile.role === 'admin') {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        showError('Error al cargar el perfil de usuario');
    }
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

            // Check email verification
            const { data: profile } = await window.supabaseClient
                .from('users')
                .select('email_verified')
                .eq('id', data.user.id)
                .single();

            if (!profile.email_verified) {
                showWarning('Por favor, verifica tu correo electrónico para continuar');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                return;
            }

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

            // Register user with Supabase Auth
            const { data: { user }, error: signUpError } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: { first_name: firstName, last_name: lastName },
                    emailRedirectTo: `${window.location.origin}/verify.html`
                }
            });

            if (signUpError) throw signUpError;

            // Create user profile
            const { error: profileError } = await window.supabaseClient
                .from('users')
                .insert([{
                    id: user.id,
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    role: 'user',
                    email_verified: false
                }]);

            if (profileError) throw profileError;

            showSuccess('Cuenta creada. Por favor, verifica tu correo electrónico.');
            
            // Switch to login form
            document.querySelector('[data-form="login"]').click();

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

// UI Helpers
function showError(message) {
    showToast(message, 'error');
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showWarning(message) {
    showToast(message, 'warning');
}

function showToast(message, type) {
    const toast = createToast(message, type);
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `auth-toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    return toast;
}

function getToastIcon(type) {
    switch (type) {
        case 'error': return 'exclamation-circle';
        case 'success': return 'check-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Error handling
function getErrorMessage(error) {
    const errorMessages = {
        'Invalid login credentials': 'Credenciales inválidas',
        'Email already registered': 'Este correo ya está registrado',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
        'Invalid email': 'Correo electrónico inválido'
    };

    return errorMessages[error.message] || 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', initAuth);