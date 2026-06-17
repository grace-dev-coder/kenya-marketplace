// Check if API_BASE_URL already exists (declared in another script)
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

function getAdminToken() {
    return localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
}

function checkAuthStatus() {
    const token = getAdminToken();
    const isAdmin = localStorage.getItem('is_admin');
    const currentPage = window.location.pathname.split('/').pop();

    // Don't check auth on login page itself
    if (currentPage === 'login.html' || currentPage === '' || currentPage === 'index.html') return;

    if (!token || !isAdmin || isAdmin !== '1') {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', checkAuthStatus);
