import { showSuccess, showError } from './utils/toast.js';

let supabaseClient;
let currentUser;

async function initAddresses() {
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
        await loadAddresses();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing addresses:', error);
        showError('Error al cargar las direcciones');
    }
}

async function loadAddresses() {
    try {
        const { data: addresses, error } = await supabaseClient
            .from('addresses')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const addressesList = document.getElementById('addressesList');
        const noAddresses = document.getElementById('noAddresses');

        if (!addresses || addresses.length === 0) {
            addressesList.style.display = 'none';
            noAddresses.style.display = 'block';
            return;
        }

        noAddresses.style.display = 'none';
        addressesList.style.display = 'grid';
        addressesList.innerHTML = addresses.map(address => createAddressCard(address)).join('');
    } catch (error) {
        console.error('Error loading addresses:', error);
        showError('Error al cargar las direcciones');
    }
}

function createAddressCard(address) {
    return `
        <div class="address-card" data-id="${address.id}">
            <div class="address-header">
                <h3>${address.name}</h3>
                <div class="address-actions">
                    <button class="edit-address" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-address" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="address-details">
                <p>${address.street}</p>
                <p>${address.city}, ${address.state} ${address.zip_code}</p>
                <p>Tel: ${address.phone}</p>
                ${address.instructions ? `<p class="instructions">${address.instructions}</p>` : ''}
            </div>
        </div>
    `;
}

function setupEventListeners() {
    const addBtn = document.getElementById('addAddressBtn');
    const modal = document.getElementById('addressModal');
    const closeBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('addressForm');
    const cancelBtn = form.querySelector('.cancel-btn');
    const addressesList = document.getElementById('addressesList');

    addBtn.addEventListener('click', () => {
        form.reset();
        form.dataset.mode = 'add';
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    form.addEventListener('submit', handleAddressSubmit);

    addressesList.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-address');
        const deleteBtn = e.target.closest('.delete-address');
        const addressCard = e.target.closest('.address-card');

        if (editBtn && addressCard) {
            editAddress(addressCard.dataset.id);
        }

        if (deleteBtn && addressCard) {
            deleteAddress(addressCard.dataset.id);
        }
    });
}

async function handleAddressSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const addressData = {
        user_id: currentUser.id,
        name: formData.get('addressName'),
        street: formData.get('street'),
        city: formData.get('city'),
        state: formData.get('state'),
        zip_code: formData.get('zipCode'),
        phone: formData.get('phone'),
        instructions: formData.get('instructions') || null
    };

    try {
        const mode = e.target.dataset.mode;
        let error;

        if (mode === 'edit') {
            const addressId = e.target.dataset.addressId;
            ({ error } = await supabaseClient
                .from('addresses')
                .update(addressData)
                .eq('id', addressId));
        } else {
            ({ error } = await supabaseClient
                .from('addresses')
                .insert([addressData]));
        }

        if (error) throw error;

        showSuccess(mode === 'edit' ? 'Dirección actualizada' : 'Dirección agregada');
        document.getElementById('addressModal').style.display = 'none';
        await loadAddresses();
    } catch (error) {
        console.error('Error saving address:', error);
        showError('Error al guardar la dirección');
    }
}

async function editAddress(addressId) {
    try {
        const { data: address, error } = await supabaseClient
            .from('addresses')
            .select('*')
            .eq('id', addressId)
            .single();

        if (error) throw error;

        const form = document.getElementById('addressForm');
        form.dataset.mode = 'edit';
        form.dataset.addressId = addressId;

        form.elements.addressName.value = address.name;
        form.elements.street.value = address.street;
        form.elements.city.value = address.city;
        form.elements.state.value = address.state;
        form.elements.zipCode.value = address.zip_code;
        form.elements.phone.value = address.phone;
        form.elements.instructions.value = address.instructions || '';

        document.getElementById('addressModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading address for edit:', error);
        showError('Error al cargar la dirección');
    }
}

async function deleteAddress(addressId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('addresses')
            .delete()
            .eq('id', addressId);

        if (error) throw error;

        showSuccess('Dirección eliminada');
        await loadAddresses();
    } catch (error) {
        console.error('Error deleting address:', error);
        showError('Error al eliminar la dirección');
    }
}

document.addEventListener('DOMContentLoaded', initAddresses);