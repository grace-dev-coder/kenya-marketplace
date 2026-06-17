if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

function getAdminToken() {
    return localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
}

async function loadAnalytics() {
    const token = getAdminToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Analytics data would be loaded here
    console.log('Analytics page loaded');
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('monthRevenue') || document.getElementById('monthOrders')) {
        loadAnalytics();
    }
});
