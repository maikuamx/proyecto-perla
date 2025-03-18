import { showSuccess, showError } from './utils/toast.js';

let supabaseClient;
let currentUser;

async function initProfile() {
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
        await loadUserProfile();
        setupFormHandlers();
    } catch (error) {
        console.error('Error initializing profile:', error);
        showError('Error al cargar el perfil');
    }
}

async function loadUserProfile() {
    try {
        const { data: profile, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;

        document.getElementById('firstName').value = profile.first_name || '';
        document.getElementById('lastName').value = profile.last_name || '';
        document.getElementById('email').value = profile.email || '';
    } catch (error) {
        console.error('Error loading user profile:', error);
        showError('Error al cargar la información del perfil');
    }
}

function setupFormHandlers() {
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');

    profileForm.addEventListener('submit', handleProfileUpdate);
    passwordForm.addEventListener('submit', handlePasswordUpdate);
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    
    try {
        const { error } = await supabaseClient
            .from('users')
            .update({
                first_name: firstName,
                last_name: lastName,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);

        if (error) throw error;
        
        showSuccess('Perfil actualizado exitosamente');
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Error al actualizar el perfil');
    }
}

async function handlePasswordUpdate(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }
    
    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;
        
        document.getElementById('passwordForm').reset();
        showSuccess('Contraseña actualizada exitosamente');
    } catch (error) {
        console.error('Error updating password:', error);
        showError('Error al actualizar la contraseña');
    }
}

document.addEventListener('DOMContentLoaded', initProfile);