// js/main.js - Kenya Marketplace Main JavaScript

if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('API Base URL:', API_BASE_URL);

    // Initialize cart count
    updateCartCount();

    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    }

    // Check auth status
    checkAuthStatus();
});

function performSearch() {
    const query = document.getElementById('searchInput')?.value.trim();
    if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const countEl = document.getElementById('cartCount');
    if (countEl) {
        countEl.textContent = cart.length;
    }
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const authSection = document.getElementById('authSection');
    if (token && authSection) {
        authSection.innerHTML = 'Logout';
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.reload();
}