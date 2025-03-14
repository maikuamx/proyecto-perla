import { getProducts, getProductsByCategory } from './supabase.js';
import { showSuccess, showError } from './utils/toast.js';

// Initialize catalog
async function initializeCatalog() {
    const catalogGrid = document.querySelector('.catalog-grid');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    try {
        const products = await getProducts();
        renderProducts(products);
        
        categoryFilter.addEventListener('change', async () => {
            const selectedCategory = categoryFilter.value;
            try {
                const products = selectedCategory
                    ? await getProductsByCategory(selectedCategory)
                    : await getProducts();
                renderProducts(products);
            } catch (error) {
                console.error('Error filtering products:', error);
                showError('Error al filtrar productos');
            }
        });
        
        sortFilter.addEventListener('change', async () => {
            const sortValue = sortFilter.value;
            try {
                let products = await getProducts();
                
                switch(sortValue) {
                    case 'price-asc':
                        products.sort((a, b) => a.price - b.price);
                        break;
                    case 'price-desc':
                        products.sort((a, b) => b.price - a.price);
                        break;
                    case 'newest':
                        products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                        break;
                }
                
                renderProducts(products);
            } catch (error) {
                console.error('Error sorting products:', error);
                showError('Error al ordenar productos');
            }
        });
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Error al cargar productos');
    }
}

function renderProducts(products) {
    const catalogGrid = document.querySelector('.catalog-grid');
    
    if (!products.length) {
        catalogGrid.innerHTML = '<p class="no-products">No hay productos disponibles.</p>';
        return;
    }
    
    catalogGrid.innerHTML = products.map(product => createProductCard(product)).join('');
    
    setupProductInteractions();
}

function createProductCard(product) {
    const discount = product.original_price 
        ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
        : 0;
    
    return `
        <div class="product-card">
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            <img src="${product.image_url}" alt="${product.name}" class="product-image">
            <div class="product-details">
                <div class="product-category">${product.category}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price-container">
                    <span class="product-price">${product.price.toFixed(2)}</span>
                    ${product.original_price ? `
                        <span class="product-original-price">$${product.original_price.toFixed(2)}</span>
                        <span class="product-discount">-${discount}%</span>
                    ` : ''}
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
    `;$
}

function setupProductInteractions() {
    document.querySelectorAll('.quick-view').forEach(button => {
        button.addEventListener('click', () => {
            const imageUrl = button.dataset.image;
            showImagePreview(imageUrl);
        });
    });
    
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

document.addEventListener('DOMContentLoaded', initializeCatalog);