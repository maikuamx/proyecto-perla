// User menu component
export function createUserMenu(user) {
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    
    menu.innerHTML = `
        <button class="user-menu-trigger">
            <i class="fas fa-user-circle"></i>
            <span class="user-name">${user.first_name || 'Usuario'}</span>
            <i class="fas fa-chevron-down"></i>
        </button>
        <div class="user-menu-dropdown">
            <div class="user-info">
                <div class="user-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="user-details">
                    <span class="user-fullname">${user.first_name} ${user.last_name}</span>
                    <span class="user-email">${user.email}</span>
                </div>
            </div>
            <div class="menu-items">
                <a href="/perfil.html" class="menu-item">
                    <i class="fas fa-user-cog"></i>
                    Mi Perfil
                </a>
                <a href="/pedidos.html" class="menu-item">
                    <i class="fas fa-shopping-bag"></i>
                    Mis Pedidos
                </a>
                <a href="/direcciones.html" class="menu-item">
                    <i class="fas fa-map-marker-alt"></i>
                    Mis Direcciones
                </a>
                <button class="menu-item" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i>
                    Cerrar Sesión
                </button>
            </div>
        </div>
    `;
    
    return menu;
}