// import { signIn, signUp } from './supabase';

document.addEventListener('DOMContentLoaded', () => {
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
        
        const { data, error } = await signIn(email, password);
        
        if (error) {
            alert('Error al iniciar sesión: ' + error.message);
            return;
        }
        
        // Redirigir según el rol del usuario
        const { user } = data;
        if (user.role === 'admin') {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/';
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
        
        const { data, error } = await signUp(email, password);
        
        if (error) {
            alert('Error al registrarse: ' + error.message);
            return;
        }
        
        // Mostrar mensaje de éxito y cambiar a formulario de login
        alert('Registro exitoso. Por favor, inicia sesión.');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });
});