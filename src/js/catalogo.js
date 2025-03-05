// Sample product data (placeholders)
const products = [
    {
        id: 1,
        name: "Chaqueta Vintage Americana",
        category: "clothing",
        price: 89.99,
        originalPrice: 129.99,
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        badge: "Nuevo"
    },
    {
        id: 2,
        name: "Zapatillas Clásicas USA",
        category: "shoes",
        price: 79.99,
        originalPrice: 99.99,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 3,
        name: "Bolso Premium Leather",
        category: "accessories",
        price: 149.99,
        originalPrice: 199.99,
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        badge: "Popular"
    },
    {
        id: 4,
        name: "Jeans Denim Classic",
        category: "clothing",
        price: 69.99,
        originalPrice: 89.99,
        image: "https://images.unsplash.com/photo-1542272604-787c3835535d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 5,
        name: "Reloj Elegante Premium",
        category: "accessories",
        price: 299.99,
        originalPrice: 399.99,
        image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        badge: "Destacado"
    },
    {
        id: 6,
        name: "Sneakers Urban Style",
        category: "shoes",
        price: 119.99,
        originalPrice: 149.99,
        image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    }
];

// Create image preview modal
function createImagePreviewModal() {
    const modal = document.createElement('div');
    modal.className = 'image-preview-modal';
    modal.innerHTML = `
        <div class="preview-content">
            <img class="preview-image" src="" alt="Preview">
            <button class="close-preview">
                <i class="fas fa-times"></i>
            </button>
            <div class="zoom-instructions">
                <i class="fas fa-search-plus"></i>
                Click para hacer zoom
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const previewContent = modal.querySelector('.preview-content');
    const previewImage = modal.querySelector('.preview-image');
    const instructions = modal.querySelector('.zoom-instructions');
    let isZoomed = false;
    let isDragging = false;
    let startX, startY, translateX = 0, translateY = 0;

    // Toggle zoom on click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeImagePreview();
            return;
        }

        if (e.target.closest('.close-preview')) {
            closeImagePreview();
            return;
        }

        isZoomed = !isZoomed;
        previewImage.classList.toggle('zoomed', isZoomed);
        modal.classList.toggle('zoomed', isZoomed);
        instructions.classList.toggle('hidden', isZoomed);

        if (!isZoomed) {
            // Reset position when zooming out
            previewImage.style.transform = 'scale(1)';
            translateX = 0;
            translateY = 0;
        }
    });

    // Handle image dragging when zoomed
    previewImage.addEventListener('mousedown', (e) => {
        if (!isZoomed) return;
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        previewImage.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const x = e.clientX - startX;
        const y = e.clientY - startY;
        
        // Limit dragging area
        const maxX = previewImage.offsetWidth / 2;
        const maxY = previewImage.offsetHeight / 2;
        
        translateX = Math.max(Math.min(x, maxX), -maxX);
        translateY = Math.max(Math.min(y, maxY), -maxY);
        
        previewImage.style.transform = `scale(2) translate(${translateX}px, ${translateY}px)`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        previewImage.style.cursor = 'zoom-out';
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImagePreview();
        }
    });

    return modal;
}

// Show image preview
function showImagePreview(imageUrl) {
    const modal = document.querySelector('.image-preview-modal') || createImagePreviewModal();
    const previewImage = modal.querySelector('.preview-image');
    const instructions = modal.querySelector('.zoom-instructions');
    
    previewImage.src = imageUrl;
    previewImage.classList.remove('zoomed');
    modal.classList.remove('zoomed');
    instructions.classList.remove('hidden');
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close image preview
function closeImagePreview() {
    const modal = document.querySelector('.image-preview-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Function to create product cards
function createProductCard(product) {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    
    return `
        <div class="product-card">
            ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-details">
                <div class="product-category">${product.category}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price-container">
                    <span class="product-price">$${product.price.toFixed(2)}</span>
                    <span class="product-original-price">$${product.originalPrice.toFixed(2)}</span>
                    <span class="product-discount">-${discount}%</span>
                </div>
                <div class="product-actions">
                    <button class="add-to-cart" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                        Añadir al carrito
                    </button>
                    <button class="quick-view" title="Vista rápida" data-image="${product.image}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Initialize catalog
function initializeCatalog() {
    const catalogGrid = document.querySelector('.catalog-grid');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    
    // Initial render
    catalogGrid.innerHTML = products.map(createProductCard).join('');
    
    // Filter products by category
    categoryFilter.addEventListener('change', () => {
        const selectedCategory = categoryFilter.value;
        const filteredProducts = selectedCategory
            ? products.filter(product => product.category === selectedCategory)
            : products;
            
        catalogGrid.innerHTML = filteredProducts.map(createProductCard).join('');
    });
    
    // Sort products
    sortFilter.addEventListener('change', () => {
        const sortValue = sortFilter.value;
        let sortedProducts = [...products];
        
        switch(sortValue) {
            case 'price-asc':
                sortedProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                sortedProducts.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                // In a real app, you would sort by date
                sortedProducts.reverse();
                break;
            default:
                // 'featured' - keep original order
                break;
        }
        
        catalogGrid.innerHTML = sortedProducts.map(createProductCard).join('');
    });
    
    // Add to cart and quick view functionality
    catalogGrid.addEventListener('click', (e) => {
        const addToCartBtn = e.target.closest('.add-to-cart');
        const quickViewBtn = e.target.closest('.quick-view');

        if (addToCartBtn) {
            const productId = parseInt(addToCartBtn.dataset.id);
            const product = products.find(p => p.id === productId);
            
            if (product) {
                addToCart(product);
                showAddToCartSuccess(product.name);
            }
        } else if (quickViewBtn) {
            const imageUrl = quickViewBtn.dataset.image;
            showImagePreview(imageUrl);
        }
    });

    // Add keyboard support for closing preview
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImagePreview();
        }
    });
}

// Cart functionality
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount(cart);
}

function updateCartCount(cart) {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function showAddToCartSuccess(productName) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <div class="toast-content">
            <p><strong>${productName}</strong> añadido al carrito</p>
        </div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
    
    // Close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    });
}

// Initialize catalog when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCatalog);