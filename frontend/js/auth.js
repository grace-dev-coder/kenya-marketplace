function getToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
}

function updateAuthUI() {
    const token = getToken();
    const user = getUser();
    
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (token && user) {
        if (userMenu) userMenu.style.display = 'flex';
        if (userName) userName.textContent = user.full_name || user.email || 'User';
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (userName) userName.textContent = '';
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', updateAuthUI);
