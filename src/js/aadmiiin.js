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
        
    } catch (error) {
        console.error('Error initializing admin panel:', error);
        showError('Error al inicializar el panel de administración');
    }
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
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'MXN' })
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
                <td>${new Date(entry.date).toLocaleDateString('es-ES')}</td>
                <td>${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'MXN' }).format(entry.total)}</td>
            `;
            tableBody.appendChild(row);
        });
}

function setupChartPeriodButtons(stats) {
    const buttons = document.querySelectorAll('.chart-period');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            buttons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            // Get selected period
            const days = parseInt(button.dataset.period);
            
            // Filter and display data
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
                <img src="${product.image_url}" alt="${product.name}" class="product-image">
                <div class="product-details">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <div class="price-info">
                        <span class="price">$${product.price}</span>
                        ${product.original_price ? `<span class="original-price">$${product.original_price}</span>` : ''}
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
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Error al cargar los productos');
    }
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
    
    // Initially hide the form
    form.style.display = 'none';
    
    addProductBtn.addEventListener('click', () => {
        form.style.display = 'block';
        form.reset();
        form.scrollIntoView({ behavior: 'smooth' });
    });
    
    cancelBtn.addEventListener('click', () => {
        form.style.display = 'none';
        form.reset();
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;
        
        try {
            const formData = new FormData(form);
            const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')),
                original_price: parseFloat(formData.get('original_price')) || null,
                category: formData.get('category'),
                image_url: formData.get('image_url'),
                created_at: new Date().toISOString()
            };
            
            const { error } = await supabase
                .from('products')
                .insert([productData]);
            
            if (error) throw error;
            
            showSuccess('Producto agregado exitosamente');
            form.reset();
            form.style.display = 'none';
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
        form.querySelector('#original_price').value = product.original_price || '';
        form.querySelector('#category').value = product.category;
        form.querySelector('#image_url').value = product.image_url;
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Producto';
        
        form.scrollIntoView({ behavior: 'smooth' });
        
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(form);
                const updatedData = {
                    name: formData.get('name'),
                    description: formData.get('description'),
                    price: parseFloat(formData.get('price')),
                    original_price: parseFloat(formData.get('original_price')) || null,
                    category: formData.get('category'),
                    image_url: formData.get('image_url')
                };
                
                const { error } = await supabase
                    .from('products')
                    .update(updatedData)
                    .eq('id', productId);
                    
                if (error) throw error;
                
                showSuccess('Producto actualizado exitosamente');
                form.reset();
                form.style.display = 'none';
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

async function addProduct(productData) {
    try {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        showSuccess('Producto agregado exitosamente');
    } catch (error) {
        console.error('Error adding product:', error);
        showError('Error al agregar el producto');
    }
}

document.addEventListener('DOMContentLoaded', initAdminPanel);