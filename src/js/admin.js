import { Chart } from 'chart.js/auto';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { showSuccess, showError } from './utils/toast.js';

// Initialize Supabase client
const supabase = window.supabaseClient;

async function initAdminPanel() {
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
    initializeCharts();
    setupProductForm();
    setupLogout();
}

async function getStats() {
    const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
        
    const { data: orders } = await supabase
        .from('orders')
        .select('total, status');
        
    const completedOrders = orders?.filter(order => order.status === 'completed') || [];
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    
    const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
        
    return {
        userCount: userCount || 0,
        totalRevenue: totalRevenue || 0,
        completedOrders: completedOrders.length,
        activeProducts: productCount || 0
    };
}

async function loadProducts() {
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        showError('Error al cargar productos');
        return;
    }
    
    const productsList = document.getElementById('productsList');
    
    if (products.length === 0) {
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
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        submitBtn.disabled = true;
        
        const formData = new FormData(form);
        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            original_price: parseFloat(formData.get('original_price')) || null,
            category: formData.get('category'),
            image_url: formData.get('image_url')
        };
        
        try {
            const { error } = await supabase
                .from('products')
                .insert([productData]);
            
            if (error) throw error;
            
            showSuccess('Producto agregado exitosamente');
            form.reset();
            await loadProducts();
            
        } catch (error) {
            showError('Error al agregar el producto: ' + error.message);
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

async function editProduct(productId) {
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
        
    if (error) {
        showError('Error al cargar el producto');
        return;
    }
    
    const form = document.getElementById('addProductForm');
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
        
        const formData = new FormData(form);
        const updatedData = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            original_price: parseFloat(formData.get('original_price')) || null,
            category: formData.get('category'),
            image_url: formData.get('image_url')
        };
        
        try {
            const { error } = await supabase
                .from('products')
                .update(updatedData)
                .eq('id', productId);
                
            if (error) throw error;
            
            showSuccess('Producto actualizado exitosamente');
            form.reset();
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Agregar Producto';
            form.onsubmit = null;
            await loadProducts();
            
        } catch (error) {
            showError('Error al actualizar el producto: ' + error.message);
        } finally {
            submitBtn.disabled = false;
        }
    };
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAdminPanel);