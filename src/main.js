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

// Sample product data
const products = [
    {
        id: 1,
        name: "Reloj Bold Chronograph",
        originalPrice: 450.00,
        price: 299.99,
        category: "accessories",
        image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 2,
        name: "Smartwatch Motion Plus",
        originalPrice: 199.99,
        price: 99.99,
        category: "accessories",
        image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 3,
        name: "Bolso Leather Premium",
        originalPrice: 29.90,
        price: 19.90,
        category: "accessories",
        image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 4,
        name: "Zapatillas Urban Sport",
        originalPrice: 390.00,
        price: 199.00,
        category: "shoes",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 5,
        name: "Vestido Elegante Noche",
        originalPrice: 120.00,
        price: 89.99,
        category: "clothing",
        image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: 6,
        name: "Chaqueta Casual Otoño",
        originalPrice: 180.00,
        price: 129.99,
        category: "clothing",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    }
];

// Function to create product cards
function createProductCard(product) {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    
    return `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <div class="price-container">
                <span class="original-price">€${product.originalPrice.toFixed(2)}</span>
                <span class="discounted-price">€${product.price.toFixed(2)}</span>
            </div>
            <button class="add-to-cart" data-id="${product.id}">Añadir al carrito</button>
            <a href="#" class="shop-now">
                Ver detalles
                <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    `;
}

// Initialize with all products
const productsGrid = document.querySelector('.products-grid');
if (productsGrid) {
    productsGrid.innerHTML = products.map(createProductCard).join('');
}

// Initialize featured products
const featuredProductsGrid = document.querySelector('.featured-products-grid');
if (featuredProductsGrid) {
    // Select 3 random products for featured section
    const featuredProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, 3);
    featuredProductsGrid.innerHTML = featuredProducts.map(createProductCard).join('');
}

// Contact form handling with modern animations
const inputs = document.querySelectorAll('.input-group input, .input-group textarea');

inputs.forEach(input => {
    // Add animation class when input is focused
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
    });

    // Remove animation class when input loses focus and is empty
    input.addEventListener('blur', () => {
        if (input.value === '') {
            input.parentElement.classList.remove('focused');
        }
    });

    // Check initial state for pre-filled inputs
    if (input.value !== '') {
        input.parentElement.classList.add('focused');
    }
});

// Enhanced form submission
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            interest: document.getElementById('interest').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };
        
        // Aquí normalmente enviarías los datos a tu backend
        console.log('Datos del formulario:', formData);
        
        // Simular envío exitoso
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Enviando...';
        submitBtn.disabled = true;
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        submitBtn.textContent = '¡Mensaje enviado!';
        
        // Resetear formulario
        setTimeout(() => {
            contactForm.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            // Remover clases 'focused' después de resetear
            inputs.forEach(input => {
                input.parentElement.classList.remove('focused');
            });
        }, 2000);
    });
}

// Shopping Cart Functionality
function initializeCart() {
    // Get cart from localStorage or initialize empty cart
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Update cart count in the header
    updateCartCount(cart);
    
    // Add event listeners to "Add to Cart" buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const productId = parseInt(button.getAttribute('data-id'));
            const product = products.find(p => p.id === productId);
            
            if (product) {
                // Check if product is already in cart
                const existingItem = cart.find(item => item.id === productId);
                
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
                
                // Save updated cart to localStorage
                localStorage.setItem('cart', JSON.stringify(cart));
                
                // Update cart count
                updateCartCount(cart);
                
                // Show success message
                showAddToCartSuccess(product.name);
            }
        });
    });
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

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            navMenu.classList.remove('active');
        }
    });
});

// Initialize cart functionality
initializeCart();