// Wait for Supabase to be available
function waitForSupabase() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.supabase) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }
  
  // Initialize authentication after Supabase is loaded
  async function initAuth() {
    await waitForSupabase();
    window.initSupabase();
    checkAuthState();
  }
  
  document.addEventListener('DOMContentLoaded', initAuth);
  
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
          const supabaseClient = window.initSupabase();
          const { data, error } = await supabaseClient.auth.signInWithPassword({
              email,
              password
          });
  
          if (error) throw error;
  
          // Check if user was trying to checkout
          const checkoutRedirect = localStorage.getItem('checkoutRedirect');
          
          // Get user profile
          const { data: profile } = await supabaseClient
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();
          
          // Redirect based on user role or previous action
          if (checkoutRedirect) {
              localStorage.removeItem('checkoutRedirect');
              window.location.href = '/cart.html';
          } else if (profile.role === 'admin') {
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
          const supabaseClient = window.initSupabase();
          const { data: { user }, error: signUpError } = await supabaseClient.auth.signUp({
              email,
              password
          });
  
          if (signUpError) throw signUpError;
  
          // Create user profile
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
  
  async function checkAuthState() {
      const supabaseClient = window.initSupabase();
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (user) {
          // Get user profile
          const { data: profile } = await supabaseClient
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
          
          // User is already logged in, redirect appropriately
          if (profile.role === 'admin') {
              window.location.href = '/admin.html';
          } else {
              window.location.href = '/';
          }
      }
  }