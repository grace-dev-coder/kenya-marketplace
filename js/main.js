// ============================================
// KENYA MARKETPLACE - MAIN JS (Self-Contained)
// ============================================

// API Configuration - SET YOUR BACKEND URL HERE
const API_BASE_URL = (() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:8000';
    }
    // CHANGE THIS to your actual Render backend URL:
    return 'https://ketplace-backend.onrender.com';
})();

console.log('API Base URL:', API_BASE_URL); // Debug

// Build full API URL
function apiUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    return API_BASE_URL + cleanEndpoint;
}

// Fetch with timeout
async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Check your connection.');
        }
        throw error;
    }
}

// Format price
function formatPrice(price) {
    return 'KES ' + parseFloat(price || 0).toLocaleString('en-KE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// Show loading
function showLoading(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading...</p></div>';
}

// Show error
function showError(containerId, message, retryFn) {
    const el = document.getElementById(containerId);
    if (el) {
        el.innerHTML = `
            <div class="error-state">
                <div style="font-size:48px; margin-bottom:15px;">⚠️</div>
                <h3 style="color:#B12704; margin-bottom:10px;">Oops!</h3>
                <p>${message}</p>
                ${retryFn ? `<button onclick="${retryFn}" style="margin-top:15px; padding:10px 20px; background:#FF9900; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Try Again</button>` : ''}
            </div>
        `;
    }
}

// Show empty
function showEmpty(containerId, message) {
    const el = document.getElementById(containerId);
    if (el) {
        el.innerHTML = `
            <div class="empty-state">
                <div style="font-size:48px; margin-bottom:15px;">📦</div>
                <h3>${message || 'No products found.'}</h3>
            </div>
        `;
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Cart
function getCart() {
    try {
        return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url || product.image || '',
            quantity: 1,
            vendor_id: product.vendor_id
        });
    }
    saveCart(cart);
    showToast(`${product.name} added to cart!`);
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = count;
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#232F3E; color:#fff; padding:12px 24px; border-radius:8px; z-index:1000; animation:slideIn 0.3s ease;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});