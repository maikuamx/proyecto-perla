import { showSuccess, showError } from './utils/toast.js';

// Initialize Supabase client
let supabase;

async function initAdminPanel() {
    try {
        supabase = await window.initSupabase();
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
        displayRevenueTable(stats);
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
            revenueData: completedOrders.map(order => ({ date: order.created_at, total: order.total }))
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
    document.getElementById('totalRevenue').textContent = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalRevenue);
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('activeProducts').textContent = activeProducts;
}

function displayRevenueTable(stats) {
    const tableBody = document.getElementById('revenueTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    stats.revenueData.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${new Date(entry.date).toLocaleDateString('es-ES')}</td><td>${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(entry.total)}</td>`;
        tableBody.appendChild(row);
    });
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