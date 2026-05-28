// Admin Authentication

function getAdminToken() {
    return localStorage.getItem('adminToken');
}

function getAdminUser() {
    const user = localStorage.getItem('adminUser');
    return user ? JSON.parse(user) : null;
}

function checkAdminAuth() {
    const token = getAdminToken();
    const user = getAdminUser();
    
    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return false;
    }
    
    // Update admin name in sidebar
    const adminName = document.getElementById('adminName');
    if (adminName) {
        adminName.textContent = user.full_name || 'Admin';
    }
    
    return true;
}

function adminLogout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'index.html';
}

// Check auth on page load for protected pages
document.addEventListener('DOMContentLoaded', () => {
    // Only check auth if we're not on the login page
    if (!document.querySelector('.admin-login-page')) {
        checkAdminAuth();
    }
});