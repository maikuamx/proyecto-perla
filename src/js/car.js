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

// Cart functionality
document.addEventListener('DOMContentLoaded', async () => {
    loadCart();
    await initializeStripe();
    
    // Event delegation for cart item actions
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        cartItems.addEventListener('click', async (e) => {
            const target = e.target;
            const cartItem = target.closest('.cart-item');
            
            if (!cartItem) return;
            
            const itemId = cartItem.dataset.id;
            
            if (target.closest('.quantity-increase')) {
                await updateItemQuantity(itemId, 1);
            } else if (target.closest('.quantity-decrease')) {
                await updateItemQuantity(itemId, -1);
            } else if (target.closest('.cart-item-remove')) {
                await removeItem(itemId);
            }
        });
    }
    
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

async function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cartItems');
    const cartEmptyMessage = document.getElementById('cartEmpty');
    const cartSummary = document.getElementById('cartSummary');
    
    // Update cart count
    updateCartCount(cart);
    
    if (cart.length === 0) {
        if (cartItemsContainer) cartItemsContainer.innerHTML = '';
        if (cartEmptyMessage) cartEmptyMessage.style.display = 'block';
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }
    
    if (cartEmptyMessage) cartEmptyMessage.style.display = 'none';
    if (cartSummary) cartSummary.style.display = 'block';
    
    if (cartItemsContainer) {
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
    }
    
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
    
    const subtotalElement = document.getElementById('subtotal');
    const shippingElement = document.getElementById('shipping');
    const taxesElement = document.getElementById('taxes');
    const totalElement = document.getElementById('total');
    
    if (subtotalElement) subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingElement) shippingElement.textContent = shipping === 0 ? 'Gratis' : `$${shipping.toFixed(2)}`;
    if (taxesElement) taxesElement.textContent = `$${taxes.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `$${total.toFixed(2)}`;
}

async function updateItemQuantity(itemId, change) {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const itemIndex = cart.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) return;
        
        // Get current stock from database
        const { data: product } = await window.supabaseClient
            .from('products')
            .select('stock_quantity')
            .eq('id', itemId)
            .single();
            
        if (!product) {
            showError('Producto no encontrado');
            return;
        }
        
        const newQuantity = cart[itemIndex].quantity + change;
        
        if (newQuantity > product.stock_quantity) {
            showError('No hay suficiente stock disponible');
            return;
        }
        
        if (newQuantity <= 0) {
            cart.splice(itemIndex, 1);
            showInfo('Producto eliminado del carrito');
        } else {
            cart[itemIndex].quantity = newQuantity;
            showSuccess('Cantidad actualizada');
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        await window.saveCart(cart);
        loadCart();
    } catch (error) {
        console.error('Error updating quantity:', error);
        showError('Error al actualizar la cantidad');
    }
}

async function removeItem(itemId) {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const updatedCart = cart.filter(item => item.id !== itemId);
        
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        await window.saveCart(updatedCart);
        showInfo('Producto eliminado del carrito');
        loadCart();
    } catch (error) {
        console.error('Error removing item:', error);
        showError('Error al eliminar el producto');
    }
}