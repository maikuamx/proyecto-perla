import { initAuthState } from './js/auth/authState.js';
import { getProducts } from './js/supaba.js';
import { showSuccess, showError } from './js/utils/toast.js';

// Initialize auth state
document.addEventListener('DOMContentLoaded', async () => {
    initAuthState();
    await loadRandomProducts();
    await loadFeaturedProducts();
});

async function loadRandomProducts() {
    try {
        const products = await getProducts();
        if (!products || products.length === 0) {
            document.querySelector('.products-grid').innerHTML = '<p class="no-products">No hay productos disponibles.</p>';
            return;
        }

        // Get 6 random products
        const randomProducts = getRandomProducts(products, 6);
        const productsGrid = document.querySelector('.products-grid');
        
        productsGrid.innerHTML = randomProducts.map(product => `
            <div class="product-card">
                <img src="${product.image_url}" alt="${product.name}" class="product-image">
                <div class="product-details">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price-container">
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                        ${product.size ? `<span class="product-size">Talla: ${product.size}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="add-to-cart" data-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i>
                            Añadir al carrito
                        </button>
                        <button class="quick-view" title="Vista rápida" data-image="${product.image_url}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        setupProductInteractions();
    } catch (error) {
        console.error('Error loading random products:', error);
        showError('Error al cargar los productos');
    }
}

async function loadFeaturedProducts() {
    try {
        const products = await getProducts();
        if (!products || products.length === 0) {
            document.querySelector('.featured-products-grid').innerHTML = '<p class="no-products">No hay productos destacados disponibles.</p>';
            return;
        }

        // Get 3 random products for featured section
        const featuredProducts = getRandomProducts(products, 3);
        const featuredGrid = document.querySelector('.featured-products-grid');
        
        featuredGrid.innerHTML = featuredProducts.map(product => `
            <div class="featured-product-card">
                <div class="featured-badge">Destacado</div>
                <img src="${product.image_url}" alt="${product.name}" class="featured-product-image">
                <div class="featured-product-details">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-price-container">
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                        ${product.size ? `<span class="product-size">Talla: ${product.size}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="add-to-cart" data-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i>
                            Añadir al carrito
                        </button>
                        <button class="quick-view" title="Vista rápida" data-image="${product.image_url}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        setupProductInteractions();
    } catch (error) {
        console.error('Error loading featured products:', error);
        showError('Error al cargar los productos destacados');
    }
}

function getRandomProducts(products, count) {
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

function setupProductInteractions() {
    // Quick view functionality
    document.querySelectorAll('.quick-view').forEach(button => {
        button.addEventListener('click', () => {
            const imageUrl = button.dataset.image;
            showImagePreview(imageUrl);
        });
    });
    
    // Add to cart functionality
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.id;
            addToCart(productId);
        });
    });
}

async function addToCart(productId) {
    try {
        const products = await getProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            throw new Error('Producto no encontrado');
        }
        
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
            showSuccess(`Se actualizó la cantidad de ${product.name}`);
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url,
                quantity: 1
            });
            showSuccess(`${product.name} añadido al carrito`);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount(cart);
        
    } catch (error) {
        console.error('Error adding to cart:', error);
        showError('Error al añadir al carrito');
    }
}

function updateCartCount(cart) {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function createImagePreviewModal() {
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `
        <div class="preview-content">
            <img class="preview-image" src="" alt="Preview">
            <button class="close-preview">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeImagePreview();
        }
    });
    
    modal.querySelector('.close-preview').addEventListener('click', closeImagePreview);
    
    return modal;
}

function showImagePreview(imageUrl) {
    const modal = document.querySelector('.image-preview-modal') || createImagePreviewModal();
    const previewImage = modal.querySelector('.preview-image');
    previewImage.src = imageUrl;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeImagePreview() {
    const modal = document.querySelector('.image-preview-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}