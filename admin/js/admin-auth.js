const API_BASE_URL = 'http://localhost:8000';

function checkAuthStatus() {
    const token = localStorage.getItem('admin_token');
    const isAdmin = localStorage.getItem('is_admin');
    const currentPage = window.location.pathname.split('/').pop();
    
    // Don't check auth on login page itself
    if (currentPage === 'login.html' || currentPage === '') return;
    
    if (!token || !isAdmin || isAdmin !== '1') {
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', checkAuthStatus);
