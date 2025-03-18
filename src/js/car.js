import { showSuccess, showError, showInfo } from './utils/toast.js';

const API_URL = 'https://proyecto-perla.onrender.com/api';

// Initialize Stripe
let stripe;
let elements;
let paymentElement;

async function initializeStripe() {
    const response = await fetch(`${API_URL}/stripe-config`);
    const { publishableKey } = await response.json();
    stripe = Stripe(publishableKey);
    const clientSecret = await createPaymentIntent();
    
    elements = stripe.elements({
        clientSecret,
        appearance: {
            theme: 'stripe',
            variables: {
                colorPrimary: '#884A39',
                colorBackground: '#ffffff',
                colorText: '#1a1a1a',
                colorDanger: '#dc2626',
                fontFamily: 'Poppins, system-ui, sans-serif',
                borderRadius: '12px',
                spacingUnit: '4px'
            }
        }
    });

    paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');
}

async function createPaymentIntent() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const total = calculateTotal(cart);

    const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount: Math.round(total * 100),
            currency: 'usd'
        })
    });

    const { clientSecret } = await response.json();
    return clientSecret;
}

function calculateTotal(cart) {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 4.99;
    const taxes = subtotal * 0.21;
    return subtotal + shipping + taxes;
}

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
document.addEventListener('DOMContentLoaded', async () => {
    loadCart();
    await initializeStripe();
    
    // Event delegation for cart item actions
    document.getElementById('cartItems').addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.classList.contains('quantity-increase')) {
            const itemId = target.closest('.cart-item').dataset.id;
            updateItemQuantity(itemId, 1);
        }
        
        if (target.classList.contains('quantity-decrease')) {
            const itemId = target.closest('.cart-item').dataset.id;
            updateItemQuantity(itemId, -1);
        }
        
        if (target.classList.contains('cart-item-remove') || target.closest('.cart-item-remove')) {
            const itemId = target.closest('.cart-item').dataset.id;
            removeItem(itemId);
        }
    });
    
    // Checkout button
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handlePayment);
    }
});

async function handlePayment(e) {
    e.preventDefault();
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showError('Tu carrito está vacío');
        return;
    }

    const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
            return_url: `${window.location.origin}/confirmation.html`
        }
    });

    if (error) {
        const messageDiv = document.getElementById('payment-message');
        messageDiv.className = 'payment-message error';
        messageDiv.textContent = error.message;
        messageDiv.style.display = 'block';
        showError('Error en el pago: ' + error.message);
    }
}

function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cartItems');
    const cartEmptyMessage = document.getElementById('cartEmpty');
    const cartSummary = document.getElementById('cartSummary');
    
    // Update cart count
    updateCartCount(cart);
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '';
        cartEmptyMessage.style.display = 'block';
        cartSummary.style.display = 'none';
        return;
    }
    
    cartEmptyMessage.style.display = 'none';
    cartSummary.style.display = 'block';
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
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
    
    updateCartSummary(cart);
}

function updateCartCount(cart) {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function updateCartSummary(cart) {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shipping = subtotal > 50 ? 0 : 4.99;
    const taxes = subtotal * 0.21;
    const total = subtotal + shipping + taxes;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`;
    document.getElementById('taxes').textContent = `$${taxes.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function updateItemQuantity(itemId, change) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        cart[itemIndex].quantity += change;
        
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
            showInfo('Producto eliminado del carrito');
        } else {
            showSuccess('Cantidad actualizada');
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
    }
}

function removeItem(itemId) {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const updatedCart = cart.filter(item => item.id !== itemId);
    
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    showInfo('Producto eliminado del carrito');
    loadCart();
}