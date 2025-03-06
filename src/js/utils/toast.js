// Toast notifications utility
export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `site-toast ${type}`;
    
    const icon = getIconForType(type);
    
    toast.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto dismiss
    const timeout = setTimeout(() => {
        dismissToast(toast);
    }, 5000);
    
    // Click to dismiss
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timeout);
        dismissToast(toast);
    });
}

function dismissToast(toast) {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
}

function getIconForType(type) {
    switch (type) {
        case 'success':
            return 'check-circle';
        case 'error':
            return 'exclamation-circle';
        case 'warning':
            return 'exclamation-triangle';
        default:
            return 'info-circle';
    }
}

export function showSuccess(message) {
    showToast(message, 'success');
}

export function showError(message) {
    showToast(message, 'error');
}

export function showWarning(message) {
    showToast(message, 'warning');
}

export function showInfo(message) {
    showToast(message, 'info');
}