import { showSuccess, showError } from './utils/toast.js';

// Initialize Supabase client
let supabase;

async function initAdminPanel() {
    try {
        // Initialize Supabase client
        supabase = await window.initSupabase();
        
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '/iniciarsesion.html';
            return;
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            showError('Acceso no autorizado');
            window.location.href = '/';
            return;
        }

        const stats = await getStats();
        updateStats(stats);
        await loadProducts();
        initializeCharts(stats);
        setupProductForm();
        setupLogout();
        setupImageUpload();
        
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showError('Error al inicializar el panel de administración');
    }
}

// Image handling functions
function setupImageUpload() {
    const addImageBtn = document.getElementById('addImageBtn');
    const imageInput = document.getElementById('imageInput');
    const imagePreviewGrid = document.getElementById('imagePreviewGrid');
    const maxImages = 5;
    let uploadedImages = [];

    addImageBtn.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        
        if (uploadedImages.length + files.length > maxImages) {
            showError(`Máximo ${maxImages} imágenes permitidas`);
            return;
        }

        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                showError('Solo se permiten archivos de imagen');
                continue;
            }

            try {
                const base64 = await convertToBase64(file);
                uploadedImages.push(base64);
                addImagePreview(base64);
            } catch (error) {
                console.error('Error processing image:', error);
                showError('Error al procesar la imagen');
            }
        }

        if (uploadedImages.length >= maxImages) {
            addImageBtn.disabled = true;
        }
    });

    function addImagePreview(base64) {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.innerHTML = `
            <img src="${base64}" alt="Preview">
            <button type="button" class="remove-image">
                <i class="fas fa-times"></i>
            </button>
        `;

        preview.querySelector('.remove-image').addEventListener('click', () => {
            const index = uploadedImages.indexOf(base64);
            if (index > -1) {
                uploadedImages.splice(index, 1);
                preview.remove();
                addImageBtn.disabled = false;
            }
        });

        imagePreviewGrid.appendChild(preview);
    }
}

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

async function getStats() {
    try {
        const { count: userCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
            
        const { data: orders } = await supabase
            .from('orders')
            .select('total, status, created_at');
            
        const completedOrders = orders?.filter(order => order.status === 'completed') || [];
        const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        const { count: productCount } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });
            
        return {
            userCount: userCount || 0,
            totalRevenue: totalRevenue || 0,
            completedOrders: completedOrders.length,
            activeProducts: productCount || 0,
            revenueData: completedOrders.map(order => ({
                date: order.created_at,
                total: order.total
            }))
        };
    } catch (error) {
        console.error('Error getting stats:', error);
        return {
            userCount: 0,
            totalRevenue: 0,
            completedOrders: 0,
            activeProducts: 0,
            revenueData: []
        };
    }
}

function updateStats({ userCount, totalRevenue, completedOrders, activeProducts }) {
    document.getElementById('userCount').textContent = userCount;
    document.getElementById('totalRevenue').textContent = 
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
            .format(totalRevenue);
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('activeProducts').textContent = activeProducts;
}

function initializeCharts(stats) {
    displayRevenueTable(stats);
    setupChartPeriodButtons(stats);
}

function displayRevenueTable(stats) {
    const tableBody = document.getElementById('revenueTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    stats.revenueData
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 7) // Show last 7 days by default
        .forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(entry.date).toLocaleDateString('es-MX')}</td>
                <td>${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(entry.total)}</td>
            `;
            tableBody.appendChild(row);
        });
}

function setupChartPeriodButtons(stats) {
    const buttons = document.querySelectorAll('.chart-period');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const days = parseInt(button.dataset.period);
            const filteredData = {
                ...stats,
                revenueData: stats.revenueData
                    .filter(entry => {
                        const date = new Date(entry.date);
                        const daysAgo = (new Date() - date) / (1000 * 60 * 60 * 24);
                        return daysAgo <= days;
                    })
            };
            
            displayRevenueTable(filteredData);
        });
    });
}

async function loadProducts() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const productsList = document.getElementById('productsList');
        
        if (!products || products.length === 0) {
            productsList.innerHTML = '<p class="no-products">No hay productos disponibles.</p>';
            return;
        }
        
        productsList.innerHTML = products.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-images">
                    <div class="image-gallery">
                        ${product.images.map(image => `
                            <img src="${image}" alt="${product.name}">
                        `).join('')}
                    </div>
                    ${product.images.length > 1 ? `
                        <div class="gallery-nav">
                            ${product.images.map((_, index) => `
                                <span class="gallery-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
                            `).join('')}
                        </div>
                        <button class="gallery-arrow gallery-prev">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="gallery-arrow gallery-next">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="product-details">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="price-info">
                        <span class="price">$${product.price}</span>
                        ${product.size ? `<span class="size">Talla: ${product.size}</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="edit-product" data-id="${product.id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="delete-product" data-id="${product.id}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        setupProductActions();
        setupImageGalleries();
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Error al cargar los productos');
    }
}

function setupImageGalleries() {
    document.querySelectorAll('.product-images').forEach(gallery => {
        if (gallery.querySelector('.image-gallery').children.length <= 1) return;

        let currentIndex = 0;
        const images = gallery.querySelectorAll('img');
        const dots = gallery.querySelectorAll('.gallery-dot');
        const prevBtn = gallery.querySelector('.gallery-prev');
        const nextBtn = gallery.querySelector('.gallery-next');

        function updateGallery() {
            const offset = currentIndex * -100;
            gallery.querySelector('.image-gallery').style.transform = `translateX(${offset}%)`;
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        }

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + images.length) % images.length;
                updateGallery();
            });

            nextBtn.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % images.length;
                updateGallery();
            });
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentIndex = index;
                updateGallery();
            });
        });
    });
}

function setupProductActions() {
    document.querySelectorAll('.edit-product').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.getAttribute('data-id');
            editProduct(productId);
        });
    });
    
    document.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.getAttribute('data-id');
            deleteProduct(productId);
        });
    });
}

function setupProductForm() {
    const form = document.getElementById('addProductForm');
    const addProductBtn = document.getElementById('addProductBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    form.style.display = 'none';
    
    addProductBtn.addEventListener('click', () => {
        form.style.display = 'block';
        form.reset();
        document.getElementById('imagePreviewGrid').innerHTML = '';
        form.scrollIntoView({ behavior: 'smooth' });
    });
    
    cancelBtn.addEventListener('click', () => {
        form.style.display = 'none';
        form.reset();
        document.getElementById('imagePreviewGrid').innerHTML = '';
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(form);
            const images = Array.from(document.querySelectorAll('.image-preview img')).map(img => img.src);
            
            if (images.length === 0) {
                throw new Error('Debe agregar al menos una imagen');
            }
            
            const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')),
                category: formData.get('category'),
                size: formData.get('size') || null,
                images: images,
                created_at: new Date().toISOString()
            };
            
            const { error } = await supabase
                .from('products')
                .insert([productData]);
            
            if (error) throw error;
            
            showSuccess('Producto agregado exitosamente');
            form.reset();
            form.style.display = 'none';
            document.getElementById('imagePreviewGrid').innerHTML = '';
            await loadProducts();
            
        } catch (error) {
            console.error('Error adding product:', error);
            showError('Error al agregar el producto: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

async function editProduct(productId) {
    try {
        const { data: product, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
            
        if (error) throw error;
        
        const form = document.getElementById('addProductForm');
        form.style.display = 'block';
        
        form.querySelector('#name').value = product.name;
        form.querySelector('#description').value = product.description;
        form.querySelector('#price').value = product.price;
        form.querySelector('#category').value = product.category;
        form.querySelector('#size').value = product.size || '';
        
        // Load existing images
        const imagePreviewGrid = document.getElementById('imagePreviewGrid');
        imagePreviewGrid.innerHTML = '';
        product.images.forEach(image => {
            const preview = document.createElement('div');
            preview.className = 'image-preview';
            preview.innerHTML = `
                <img src="${image}" alt="Preview">
                <button type="button" class="remove-image">
                    <i class="fas fa-times"></i>
                </button>
            `;
            imagePreviewGrid.appendChild(preview);
        });
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Producto';
        
        form.scrollIntoView({ behavior: 'smooth'});
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(form);
                const images = Array.from(document.querySelectorAll('.image-preview img')).map(img => img.src);
                
                if (images.length === 0) {
                    throw new Error('Debe agregar al menos una imagen');
                }
                
                const updatedData = {
                    name: formData.get('name'),
                    description: formData.get('description'),
                    price: parseFloat(formData.get('price')),
                    category: formData.get('category'),
                    size: formData.get('size') || null,
                    images: images
                };
                
                const { error } = await supabase
                    .from('products')
                    .update(updatedData)
                    .eq('id', productId);
                    
                if (error) throw error;
                
                showSuccess('Producto actualizado exitosamente');
                form.reset();
                form.style.display = 'none';
                document.getElementById('imagePreviewGrid').innerHTML = '';
                submitBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar Producto';
                form.onsubmit = null;
                await loadProducts();
                
            } catch (error) {
                console.error('Error updating product:', error);
                showError('Error al actualizar el producto: ' + error.message);
            } finally {
                submitBtn.disabled = false;
            }
        };
    } catch (error) {
        console.error('Error loading product:', error);
        showError('Error al cargar el producto');
    }
}

async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
            
        if (error) throw error;
        
        showSuccess('Producto eliminado exitosamente');
        await loadProducts();
        
    } catch (error) {
        console.error('Error deleting product:', error);
        showError('Error al eliminar el producto: ' + error.message);
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                window.location.href = '/';
            } catch (error) {
                showError('Error al cerrar sesión: ' + error.message);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', initAdminPanel);