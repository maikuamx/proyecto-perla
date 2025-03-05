// import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// const supabase = createClient(supabaseUrl, supabaseAnonKey);

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    // checkAuthState();
    
    // Switch between login and register forms
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

    // Toggle password visibility
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

    // Handle login form submission
    const loginFormElement = loginForm.querySelector('form');
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        // Disable submit button and show loading state
        const submitBtn = loginFormElement.querySelector('.auth-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;
        
        try {
            const { data, error } = await signIn(email, password);
            
            if (error) throw error;
            
            // Check if user was trying to checkout
            const checkoutRedirect = localStorage.getItem('checkoutRedirect');
            
            // Redirect based on user role or previous action
            if (checkoutRedirect) {
                localStorage.removeItem('checkoutRedirect');
                window.location.href = '/cart.html';
            } else if (data.user.role === 'admin') {
                window.location.href = '/admin.html';
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            alert('Error al iniciar sesión: ' + error.message);
            
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // Handle register form submission
    const registerFormElement = registerForm.querySelector('form');
    registerFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        
        // Validate password strength
        if (password.length < 8) {
            alert('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        
        // Disable submit button and show loading state
        const submitBtn = registerFormElement.querySelector('.auth-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        submitBtn.disabled = true;
        
        try {
            const { error } = await signUp(email, password, firstName, lastName);
            
            if (error) throw error;
            
            // Show success message and switch to login form
            alert('Registro exitoso. Por favor, inicia sesión.');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            
            // Pre-fill email in login form
            document.getElementById('loginEmail').value = email;
            
            // Reset register form
            registerFormElement.reset();
        } catch (error) {
            alert('Error al registrarse: ' + error.message);
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
});

// async function checkAuthState() {
//     const { data: { user } } = await supabase.auth.getUser();
    
//     if (user) {
//         // User is already logged in, redirect appropriately
//         const { data } = await supabase
//             .from('users')
//             .select('role')
//             .eq('id', user.id)
//             .single();
            
//         if (data && data.role === 'admin') {
//             window.location.href = '/admin.html';
//         } else {
//             window.location.href = '/';
//         }
//     }
// }

async function signUp(email, password, firstName, lastName) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    
    if (!error && data.user) {
        // Create entry in the users table
        const { error: userError } = await supabase
            .from('users')
            .insert([
                { 
                    id: data.user.id,
                    email: email,
                    first_name: firstName,
                    last_name: lastName,
                    role: 'user'
                }
            ]);
            
        if (userError) return { error: userError };
    }
    
    return { data, error };
}

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    
    if (!error) {
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        return { data: { ...data, user: { ...data.user, ...userData } }, error: null };
    }
    
    return { data, error };
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}