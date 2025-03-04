import { Chart } from 'chart.js/auto';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function initAdminPanel() {
  if (!await isAdmin()) {
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

async function isAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
    
  return data?.role === 'admin';
}

async function getStats() {
  // Get user count
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count:  'exact', head: true });
    
  // Get orders data
  const { data: orders } = await supabase
    .from('orders')
    .select('total, status');
    
  // Calculate total revenue from completed orders
  const completedOrders = orders?.filter(order => order.status === 'completed') || [];
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
  
  // Get product count
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

function updateStats({ userCount, totalRevenue, completedOrders, activeProducts }) {
  document.getElementById('userCount').textContent = userCount;
  document.getElementById('totalRevenue').textContent = 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
      .format(totalRevenue);
  document.getElementById('completedOrders').textContent = completedOrders;
  document.getElementById('activeProducts').textContent = activeProducts;
}

async function loadProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error loading products:', error);
    return;
  }
  
  const productsList = document.getElementById('productsList');
  
  if (products.length === 0) {
    productsList.innerHTML = '<p class="no-products">No hay productos disponibles.</p>';
    return;
  }
  
  productsList.innerHTML = products.map(product => `
    <div class="product-item" data-id="${product.id}">
      <img src="${product.image_url}" alt="${product.name}">
      <div class="product-details">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="price-info">
          <span class="original-price">€${product.original_price}</span>
          <span class="price">€${product.price}</span>
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
  
  // Add event listeners for edit and delete buttons
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

function initializeCharts() {
  // Revenue chart for the last 7 days
  const ctx = document.getElementById('revenueChart').getContext('2d');
  
  // Generate dates for the last 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date;
  }).reverse();
  
  // Format dates for display
  const formattedDates = dates.map(date => 
    format(date, 'EEEE, d MMM', { locale: es })
  );
  
  // Generate random revenue data for demo
  const revenueData = dates.map(() => Math.floor(Math.random() * 1000) + 500);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: formattedDates,
      datasets: [{
        label: 'Ingresos (€)',
        data: revenueData,
        borderColor: '#884A39',
        backgroundColor: 'rgba(136, 74, 57, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Ingresos últimos 7 días'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '€' + value;
            }
          }
        }
      }
    }
  });
}

function setupProductForm() {
  const form = document.getElementById('addProductForm');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Guardando...';
    submitBtn.disabled = true;
    
    const formData = new FormData(form);
    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      original_price: parseFloat(formData.get('original_price')),
      category: formData.get('category'),
      image_url: formData.get('image_url')
    };
    
    try {
      const { error } = await addProduct(productData);
      
      if (error) throw error;
      
      form.reset();
      await loadProducts();
      
      // Show success message
      alert('Producto agregado con éxito');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error al agregar el producto: ' + error.message);
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

async function addProduct(productData) {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select();
    
  return { data, error };
}

async function editProduct(productId) {
  // Get product data
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
    
  if (error) {
    console.error('Error fetching product:', error);
    alert('Error al cargar el producto');
    return;
  }
  
  // Fill form with product data
  document.getElementById('name').value = product.name;
  document.getElementById('description').value = product.description;
  document.getElementById('price').value = product.price;
  document.getElementById('original_price').value = product.original_price;
  document.getElementById('category').value = product.category;
  document.getElementById('image_url').value = product.image_url;
  
  // Change form submit button
  const form = document.getElementById('addProductForm');
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = 'Actualizar Producto';
  
  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth' });
  
  // Update form submission handler
  const originalSubmitHandler = form.onsubmit;
  form.onsubmit = async (e) => {
    e.preventDefault();
    
    submitBtn.textContent = 'Guardando...';
    submitBtn.disabled = true;
    
    const formData = new FormData(form);
    const updatedProductData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      original_price: parseFloat(formData.get('original_price')),
      category: formData.get('category'),
      image_url: formData.get('image_url')
    };
    
    try {
      const { error } = await supabase
        .from('products')
        .update(updatedProductData)
        .eq('id', productId);
        
      if (error) throw error;
      
      // Reset form and reload products
      form.reset();
      await loadProducts();
      
      // Restore original submit handler and button text
      form.onsubmit = originalSubmitHandler;
      submitBtn.textContent = 'Agregar Producto';
      
      // Show success message
      alert('Producto actualizado con éxito');
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error al actualizar el producto: ' + error.message);
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
    
    // Reload products
    await loadProducts();
    
    // Show success message
    alert('Producto eliminado con éxito');
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Error al eliminar el producto: ' + error.message);
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
        console.error('Error signing out:', error);
        alert('Error al cerrar sesión: ' + error.message);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initAdminPanel);