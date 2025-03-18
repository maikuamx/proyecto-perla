import { showSuccess, showError } from './utils/toast.js';

let supabaseClient;
let currentUser;

async function initOrders() {
    try {
        supabaseClient = await window.initSupabase();
        if (!supabaseClient) {
            throw new Error('Failed to initialize Supabase client');
        }

        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error || !user) {
            window.location.href = '/iniciarsesion.html';
            return;
        }

        currentUser = user;
        await loadOrders();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing orders:', error);
        showError('Error al cargar los pedidos');
    }
}

async function loadOrders() {
    try {
        const { data: orders, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                items:order_items (
                    product_id,
                    quantity,
                    price,
                    products:products (name, images)
                )
            `)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const ordersList = document.getElementById('ordersList');
        const noOrders = document.getElementById('noOrders');

        if (!orders || orders.length === 0) {
            ordersList.style.display = 'none';
            noOrders.style.display = 'block';
            return;
        }

        noOrders.style.display = 'none';
        ordersList.style.display = 'block';
        ordersList.innerHTML = orders.map(order => createOrderCard(order)).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        showError('Error al cargar los pedidos');
    }
}

function createOrderCard(order) {
    const date = new Date(order.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const statusClasses = {
        pending: 'pending',
        processing: 'processing',
        completed: 'completed',
        cancelled: 'cancelled'
    };

    const statusLabels = {
        pending: 'Pendiente',
        processing: 'En proceso',
        completed: 'Completado',
        cancelled: 'Cancelado'
    };

    return `
        <div class="order-card">
            <div class="order-header">
                <div class="order-info">
                    <h3>Pedido #${order.id.slice(0, 8)}</h3>
                    <span class="order-date">${date}</span>
                </div>
                <span class="order-status ${statusClasses[order.status]}">
                    ${statusLabels[order.status]}
                </span>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <img src="${item.products.images[0]}" alt="${item.products.name}">
                        <div class="item-details">
                            <h4>${item.products.name}</h4>
                            <p>Cantidad: ${item.quantity}</p>
                            <p>Precio: $${item.price.toFixed(2)}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-footer">
                <div class="order-total">
                    <span>Total:</span>
                    <span class="total-amount">$${order.total.toFixed(2)}</span>
                </div>
                <button class="view-details-btn" data-order-id="${order.id}">
                    Ver Detalles
                </button>
            </div>
        </div>
    `;
}

function setupEventListeners() {
    const ordersList = document.getElementById('ordersList');
    const modal = document.getElementById('orderModal');
    const closeBtn = modal.querySelector('.close-modal');
    const downloadBtn = document.getElementById('downloadTicket');

    ordersList.addEventListener('click', async (e) => {
        const viewDetailsBtn = e.target.closest('.view-details-btn');
        if (viewDetailsBtn) {
            const orderId = viewDetailsBtn.dataset.orderId;
            await showOrderDetails(orderId);
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    downloadBtn.addEventListener('click', () => {
        generateTicket();
    });
}

async function showOrderDetails(orderId) {
    try {
        const { data: order, error } = await supabaseClient
            .from('orders')
            .select(`
                *,
                items:order_items (
                    product_id,
                    quantity,
                    price,
                    products:products (name, images)
                )
            `)
            .eq('id', orderId)
            .single();

        if (error) throw error;

        const modal = document.getElementById('orderModal');
        const detailsContainer = document.getElementById('orderDetails');

        detailsContainer.innerHTML = createOrderDetailsHTML(order);
        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading order details:', error);
        showError('Error al cargar los detalles del pedido');
    }
}

function createOrderDetailsHTML(order) {
    const date = new Date(order.created_at).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
        <div class="ticket" id="ticket">
            <div class="ticket-header">
                <img src="./assets/logo-black.png" alt="Sapphirus" class="ticket-logo">
                <h2>Sapphirus</h2>
                <p>Tu tienda de productos americanos</p>
            </div>
            
            <div class="ticket-info">
                <p><strong>Pedido #${order.id.slice(0, 8)}</strong></p>
                <p>Fecha: ${date}</p>
            </div>
            
            <div class="ticket-items">
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Precio</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.products.name}</td>
                                <td>${item.quantity}</td>
                                <td>$${item.price.toFixed(2)}</td>
                                <td>$${(item.quantity * item.price).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="ticket-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>$${(order.total / 1.16).toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>IVA (16%):</span>
                    <span>$${(order.total - order.total / 1.16).toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>$${order.total.toFixed(2)}</span>
                </div>
            </div>
            
            <div class="ticket-footer">
                <p>¡Gracias por tu compra!</p>
                <p>www.sapphirus.com</p>
            </div>
        </div>
    `;
}

async function generateTicket() {
    const ticket = document.getElementById('ticket');
    
    try {
        const canvas = await html2canvas(ticket);
        const imgData = canvas.toDataURL('image/png');
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 150]
        });
        
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save('ticket-sapphirus.pdf');
        
        showSuccess('Ticket descargado exitosamente');
    } catch (error) {
        console.error('Error generating ticket:', error);
        showError('Error al generar el ticket');
    }
}

document.addEventListener('DOMContentLoaded', initOrders);