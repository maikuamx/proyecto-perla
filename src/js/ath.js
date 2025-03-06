import * as echarts from 'echarts';
import { showSuccess, showError } from './utils/toast.js';

const API_URL = 'https://proyecto-perla.onrender.com/api';

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
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
            .format(totalRevenue);
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('activeProducts').textContent = activeProducts;
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
                        <span class="price">€${product.price}</span>
                        ${product.original_price ? `<span class="original-price">€${product.original_price}</span>` : ''}
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

function initializeCharts(stats) {
    const chartDom = document.getElementById('revenueChart');
    if (!chartDom) {
        console.error("Error: Elemento 'revenueChart' no encontrado en el DOM.");
        return;
    }
    const chart = echarts.init(chartDom);
    
    const dates = stats.revenueData.map(entry => new Date(entry.date).toLocaleDateString('es-ES'));
    const revenues = stats.revenueData.map(entry => entry.total);

    const option = {
        title: { text: 'Ingresos últimos 7 días', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: dates },
        yAxis: { type: 'value' },
        series: [{ name: 'Ingresos ($)', type: 'line', data: revenues, smooth: true }]
    };
    
    chart.setOption(option);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminPanel);