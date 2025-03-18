import { getProducts, getProductsByCategory } from './supaaa.js';
import { showSuccess, showError } from './utils/toast.js';

const ITEMS_PER_PAGE = 9;
let currentPage = 1;
let totalPages = 1;
let currentProducts = [];

// Initialize catalog
async function initializeCatalog() {
    const catalogGrid = document.querySelector('.catalog-grid');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    try {
        const products = await getProducts();
        currentProducts = products;
        totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
        renderProducts(getCurrentPageProducts());
        setupPagination();
        
        categoryFilter.addEventListener('change', async () => {
            const selectedCategory = categoryFilter.value;
            try {
                const products = selectedCategory
                    ? await getProductsByCategory(selectedCategory)
                    : await getProducts();
                currentProducts = products;
                currentPage = 1;
                totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
                renderProducts(getCurrentPageProducts());
                setupPagination();
            } catch (error) {
                console.error('Error filtering products:', error);
                showError('Error al filtrar productos');
            }
        });
        
        sortFilter.addEventListener('change', async () => {
            const sortValue = sortFilter.value;
            try {
                let products = [...currentProducts];
                
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
                
                currentProducts = products;
                currentPage = 1;
                renderProducts(getCurrentPageProducts());
                setupPagination();
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

function getCurrentPageProducts() {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return currentProducts.slice(startIndex, endIndex);
}

function setupPagination() {
    const paginationNumbers = document.querySelector('.pagination-numbers');
    const prevBtn = document.querySelector('.pagination-btn:first-child');
    const nextBtn = document.querySelector('.pagination-btn:last-child');
    
    // Clear existing pagination
    paginationNumbers.innerHTML = '';
    
    // Add page numbers
    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.toggle('active', i === currentPage);
        button.addEventListener('click', () => {
            currentPage = i;
            renderProducts(getCurrentPageProducts());
            setupPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationNumbers.appendChild(button);
    }
    
    // Update prev/next buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // Add event listeners for prev/next
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts(getCurrentPageProducts());
            setupPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderProducts(getCurrentPageProducts());
            setupPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
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
            <img src="${product.images[0]}" alt="${product.name}" class="product-image">
            <div class="product-details">
                <div class="product-category">${product.category}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price-container">
                    <span class="product-price">€${product.price.toFixed(2)}</span>
                    ${product.original_price ? `
                        <span class="product-original-price">€${product.original_price.toFixed(2)}</span>
                        <span class="product-discount">-${discount}%</span>
                    ` : ''}
                </div>
                <div class="product-actions">
                    <button class="add-to-cart" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                        Añadir al carrito
                    </button>
                    <button class="quick-view" title="Vista rápida" data-images='${JSON.stringify(product.images)}'>
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function setupProductInteractions() {
    document.querySelectorAll('.quick-view').forEach(button => {
        button.addEventListener('click', () => {
            const images = JSON.parse(button.dataset.images);
            showImagePreview(images[0]); // Por ahora mostramos solo la primera imagen
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
        const product = currentProducts.find(p => p.id === productId);
        
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
                image: product.images[0],
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