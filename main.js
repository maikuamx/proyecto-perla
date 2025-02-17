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

// Category tabs functionality
const tabButtons = document.querySelectorAll('.tab-btn');
const productsGrid = document.querySelector('.products-grid');

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
            <button class="add-to-cart">Añadir al carrito</button>
            <a href="#" class="shop-now">
                Ver detalles
                <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    `;
}

// Function to filter products by category
function filterProducts(category) {
    const filteredProducts = category === 'all' 
        ? products 
        : products.filter(product => product.category === category);
    
    productsGrid.innerHTML = filteredProducts.map(createProductCard).join('');
}

// Add click event listeners to tab buttons
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        // Filter products
        filterProducts(button.dataset.category);
    });
});

// Initialize with all products
filterProducts('all');

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