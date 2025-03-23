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
    const cart = await getValidatedCart();
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
    await loadCart();
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
    
    const cart = await getValidatedCart();
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

async function getValidatedCart() {
    try {
        const supabase = await window.initSupabase();
        if (!supabase) throw new Error('No se pudo inicializar Supabase');

        // Get current cart
        const { data: { user } } = await supabase.auth.getUser();
        let cart;
        
        if (user) {
            const { data } = await supabase
                .from('carts')
                .select('items')
                .eq('user_id', user.id)
                .single();
            cart = data?.items || [];
        } else {
            cart = JSON.parse(localStorage.getItem('cart')) || [];
        }

        // Validate each item against current stock
        const validatedCart = [];
        let cartChanged = false;

        for (const item of cart) {
            const { data: product } = await supabase
                .from('products')
                .select('stock_quantity, price')
                .eq('id', item.id)
                .single();

            if (!product) {
                showError(`El producto "${item.name}" ya no está disponible`);
                cartChanged = true;
                continue;
            }

            if (product.stock_quantity === 0) {
                showError(`El producto "${item.name}" está agotado`);
                cartChanged = true;
                continue;
            }

            if (item.quantity > product.stock_quantity) {
                item.quantity = product.stock_quantity;
                showWarning(`Solo hay ${product.stock_quantity} unidades disponibles de "${item.name}"`);
                cartChanged = true;
            }

            // Update price if it changed
            if (item.price !== product.price) {
                item.price = product.price;
                cartChanged = true;
            }

            validatedCart.push(item);
        }

        // Update cart if it changed
        if (cartChanged) {
            if (user) {
                await supabase
                    .from('carts')
                    .upsert({ user_id: user.id, items: validatedCart });
            }
            localStorage.setItem('cart', JSON.stringify(validatedCart));
        }

        return validatedCart;
    } catch (error) {
        console.error('Error validating cart:', error);
        showError('Error al validar el carrito');
        return [];
    }
}

async function loadCart() {
    const cart = await getValidatedCart();
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
        const supabase = await window.initSupabase();
        if (!supabase) throw new Error('No se pudo inicializar Supabase');

        // Get current stock
        const { data: product } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', itemId)
            .single();

        if (!product) {
            showError('Producto no encontrado');
            return;
        }

        // Get current cart
        const cart = await getValidatedCart();
        const itemIndex = cart.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) return;
        
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
        
        // Update cart in storage
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('carts')
                .upsert({ user_id: user.id, items: cart });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        
        await loadCart();
    } catch (error) {
        console.error('Error updating quantity:', error);
        showError('Error al actualizar la cantidad');
    }
}

async function removeItem(itemId) {
    try {
        const supabase = await window.initSupabase();
        if (!supabase) throw new Error('No se pudo inicializar Supabase');

        const cart = await getValidatedCart();
        const updatedCart = cart.filter(item => item.id !== itemId);
        
        // Update cart in storage
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('carts')
                .upsert({ user_id: user.id, items: updatedCart });
        }
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        
        showInfo('Producto eliminado del carrito');
        await loadCart();
    } catch (error) {
        console.error('Error removing item:', error);
        showError('Error al eliminar el producto');
    }
}