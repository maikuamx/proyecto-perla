import { Chart } from 'chart.js/auto';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStats, getProducts, addProduct, isAdmin } from './supabase';

async function initAdminPanel() {
  if (!await isAdmin()) {
    window.location.href = '/';
    return;
  }

  const stats = await getStats();
  updateStats(stats);
  await loadProducts();
  initCharts();
  setupProductForm();
}

function updateStats({ userCount, totalRevenue }) {
  document.getElementById('userCount').textContent = userCount;
  document.getElementById('totalRevenue').textContent = 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
      .format(totalRevenue);
}

async function loadProducts() {
  const { data: products } = await getProducts();
  const productsList = document.getElementById('productsList');
  
  productsList.innerHTML = products.map(product => `
    <div class="product-item">
      <img src="${product.image_url}" alt="${product.name}">
      <div class="product-details">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="price-info">
          <span class="original-price">€${product.original_price}</span>
          <span class="price">€${product.price}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function initCharts() {
  const ctx = document.getElementById('revenueChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: 7 }, (_, i) => 
        format(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'EEEE', { locale: es })),
      datasets: [{
        label: 'Ingresos',
        data: [1234, 2345, 1845, 2345, 3456, 2345, 3456],
        borderColor: '#142C2E',
        tension: 0.4
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
      }
    }
  });
}

function setupProductForm() {
  const form = document.getElementById('addProductForm');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      original_price: parseFloat(formData.get('original_price')),
      category: formData.get('category'),
      image_url: formData.get('image_url')
    };
    
    const { error } = await addProduct(productData);
    
    if (error) {
      alert('Error al agregar el producto');
      return;
    }
    
    form.reset();
    await loadProducts();
  });
}

document.addEventListener('DOMContentLoaded', initAdminPanel);