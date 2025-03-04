import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Toggle mobile menu
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-left') && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
    }
});

// Cart functionality
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    
    // Event delegation for cart item actions
    document.getElementById('cartItems').addEventListener('click', (e) => {
        const target = e.target;
        
        // Handle quantity increase
        if (target.classList.contains('quantity-increase')) {
            const itemId = parseInt(target.closest('.cart-item').dataset.id);
            updateItemQuantity(itemId, 1);
        }
        
        // Handle quantity decrease
        if (target.classList.contains('quantity-decrease')) {
            const itemId = parseInt(target.closest('.cart-item').dataset.id);
            updateItemQuantity(itemId, -1);
        }
        
        // Handle item removal
        if (target.classList.contains('cart-item-remove') || target.closest('.cart-item-remove')) {
            const itemId = parseInt(target.closest('.cart-item').dataset.id);
            removeItem(itemId);
        }
    });
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', initiateCheckout);
    }
});

function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cartItems');
    const cartEmptyMessage = document.getElementById('cartEmpty');
    const cartSummary = document.getElementById('cartSummary');
    
    // Update cart count
    updateCartCount(cart);
    
    if (cart.length === 0) {
        // Show empty cart message
        cartItemsContainer.innerHTML = '';
        cartEmptyMessage.style.display = 'block';
        cartSummary.style.display = 'none';
        return;
    }
    
    // Hide empty cart message and show summary
    cartEmptyMessage.style.display = 'none';
    cartSummary.style.display = 'block';
    
    // Render cart items
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p class="cart-item-price">€${item.price.toFixed(2)}</p>
                <div class="cart-item-quantity">
                    <button class="quantity-btn quantity-decrease">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn quantity-increase">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            <button class="cart-item-remove">
                <i class="fas fa-trash"></i>
                Eliminar
            </button>
        </div>
    `).join('');
    
    // Update summary
    updateCartSummary(cart);
}

function updateCartCount(cart) {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        // Show/hide the count badge
        if (totalItems > 0) {
            cartCount.style.display = 'flex';
        } else {
            cartCount.style.display = 'none';
        }
    }
}

function updateCartSummary(cart) {
    // Calculate subtotal
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculate shipping (free over €50)
    const shipping = subtotal > 50 ? 0 : 4.99;
    
    // Calculate taxes (21% VAT)
    const taxes = subtotal * 0.21;
    
    // Calculate total
    const total = subtotal + shipping + taxes;
    
    // Update DOM
    document.getElementById('subtotal').textContent = `€${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = shipping === 0 ? 'Gratis' : `€${shipping.toFixed(2)}`;
    document.getElementById('taxes').textContent = `€${taxes.toFixed(2)}`;
    document.getElementById('total').textContent = `€${total.toFixed(2)}`;
}

function updateItemQuantity(itemId, change) {
    // Get current cart
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Find the item
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        // Update quantity
        cart[itemIndex].quantity += change;
        
        // Remove item if quantity is 0 or less
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
        
        // Save updated cart
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Reload cart UI
        loadCart();
    }
}

function removeItem(itemId) {
    // Get current cart
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Remove the item
    const updatedCart = cart.filter(item => item.id !== itemId);
    
    // Save updated cart
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Reload cart UI
    loadCart();
}

async function initiateCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        // Redirect to login page with return URL
        localStorage.setItem('checkoutRedirect', true);
        window.location.href = '/iniciarsesion.html';
        return;
    }
    
    // Prepare checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    const originalText = checkoutBtn.innerHTML;
    checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    checkoutBtn.disabled = true;
    
    try {
        // Calculate totals
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shipping = subtotal > 50 ? 0 : 4.99;
        const taxes = subtotal * 0.21;
        const total = subtotal + shipping + taxes;
        
        // Create order in database
        const { data: order, error } = await supabase
            .from('orders')
            .insert([
                {
                    user_id: user.id,
                    total: total,
                    status: 'pending',
                    items: cart
                }
            ])
            .select()
            .single();
            
        if (error) throw error;
        
        // Here you would normally redirect to Stripe checkout
        // For demo purposes, we'll simulate a successful payment
        alert('¡Pedido creado con éxito! Serías redirigido a la pasarela de pago.');
        
        // Clear cart after successful order
        localStorage.removeItem('cart');
        
        // Redirect to confirmation page
        // window.location.href = `/confirmation.html?order=${order.id}`;
        
        // For demo, just reload the cart page
        window.location.reload();
        
    } catch (error) {
        console.error('Error al procesar el pedido:', error);
        alert('Ha ocurrido un error al procesar tu pedido. Por favor, inténtalo de nuevo.');
        
        // Reset checkout button
        checkoutBtn.innerHTML = originalText;
        checkoutBtn.disabled = false;
    }
}