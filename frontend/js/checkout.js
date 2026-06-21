// ============================================
// Kenya Marketplace - Checkout Page JavaScript
// ============================================
// NOTE: This backend has NO /api/cart/ endpoints.
// We use POST /api/orders/ directly with items from localStorage.

const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';

let cart = [];
let user = null;
let token = null;

const checkoutContainer = document.getElementById('checkout-container');
const navCartCount = document.getElementById('nav-cart-count');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

document.addEventListener('DOMContentLoaded', () => {
    token = localStorage.getItem('token');
    user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!token) { showAuthRequired(); return; }
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    loadCheckoutSummary();
});

function showAuthRequired() {
    checkoutContainer.innerHTML = `
        <div class="auth-required">
            <i class="fas fa-lock" style="font-size: 4rem; color: #ddd; margin-bottom: 20px;"></i>
            <h2>Login Required</h2>
            <p style="color: #888; margin-bottom: 25px;">Please login to proceed with checkout.</p>
            <a href="login.html?redirect=checkout.html" class="btn-shop-now"><i class="fas fa-sign-in-alt"></i> Login to Continue</a>
            <p style="margin-top: 15px; font-size: 13px; color: #aaa;">Don't have an account? <a href="register.html" style="color: #FF9900;">Register</a></p>
        </div>`;
}

function toggleMenu() { document.getElementById('dropdownMenu').classList.toggle('active'); }
document.addEventListener('click', function(e) {
    const menu = document.getElementById('dropdownMenu');
    const btn = document.querySelector('.menu-btn');
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) menu.classList.remove('active');
});

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) window.location.href = 'products.html?search=' + encodeURIComponent(query);
}

async function apiFetch(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) { console.error('Token expired/invalid'); handleAuthError(); return null; }
        if (!response.ok) { const errorData = await response.json().catch(() => ({})); throw new Error(errorData.detail || `HTTP ${response.status}`); }
        return await response.json();
    } catch (error) { console.error('API Error:', error); throw error; }
}

function handleAuthError() {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    showToast('Session expired. Please login again.', 'error');
    setTimeout(() => { window.location.href = 'login.html?redirect=checkout.html'; }, 2000);
}

function loadCheckoutSummary() {
    const localCart = JSON.parse(localStorage.getItem('cart')) || [];
    if (localCart.length === 0) { showEmptyCart(); return; }
    cart = localCart.map(item => ({ id: item.id, product_id: item.id, name: item.name, price: item.price, quantity: item.quantity, image_url: item.image || '', stock: item.stock || 999 }));
    renderCheckout();
    updateNavCartCount();
}

function showEmptyCart() {
    checkoutContainer.innerHTML = `
        <div class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <h2>Your cart is empty</h2>
            <p style="color: #888; margin-bottom: 25px;">Add some items before checkout.</p>
            <a href="products.html" class="btn-shop-now"><i class="fas fa-shopping-bag"></i> Browse Products</a>
        </div>`;
}

function renderCheckout() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 5000 ? 0 : 300;
    const total = subtotal + shipping;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const itemsHTML = cart.map((item) => `
        <div class="checkout-item">
            <div class="item-image">
                ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-image placeholder-icon\'></i>';">` : `<i class="fas fa-image placeholder-icon"></i>`}
            </div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-price">KES ${Number(item.price).toLocaleString()} × ${item.quantity}</div>
            </div>
            <div class="item-total">KES ${Number(item.price * item.quantity).toLocaleString()}</div>
        </div>`).join('');
    checkoutContainer.innerHTML = `
        <div class="checkout-grid">
            <div class="checkout-items">
                <div class="checkout-header"><h2><i class="fas fa-shopping-bag"></i> Order Items (${itemCount})</h2></div>
                <div class="items-list">${itemsHTML}</div>
                <a href="cart.html" class="btn-edit-cart"><i class="fas fa-arrow-left"></i> Back to Cart</a>
            </div>
            <div class="checkout-summary">
                <h3><i class="fas fa-receipt"></i> Order Summary</h3>
                <div class="summary-row"><span>Subtotal</span><span>KES ${Number(subtotal).toLocaleString()}</span></div>
                <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : 'KES ' + Number(shipping).toLocaleString()}</span></div>
                ${shipping > 0 ? `<div class="summary-row" style="font-size: 12px; color: #888;"><span><i class="fas fa-info-circle"></i> Free shipping on orders over KES 5,000</span></div>` : ''}
                <div class="summary-row total"><span>Total</span><span>KES ${Number(total).toLocaleString()}</span></div>
                <div class="shipping-form">
                    <h4><i class="fas fa-truck"></i> Shipping Details</h4>
                    <div class="form-group"><label>Full Name</label><input type="text" id="ship-name" value="${user?.name || ''}" placeholder="Enter your full name"></div>
                    <div class="form-group"><label>Phone Number</label><input type="tel" id="ship-phone" value="${user?.phone || ''}" placeholder="e.g. 0712345678"></div>
                    <div class="form-group"><label>Delivery Address</label><textarea id="ship-address" rows="3" placeholder="Enter your delivery address"></textarea></div>
                    <div class="form-group"><label>City / Town</label><input type="text" id="ship-city" placeholder="e.g. Nairobi, Mombasa"></div>
                </div>
                <div class="payment-section">
                    <h4><i class="fas fa-credit-card"></i> Payment Method</h4>
                    <div class="payment-options">
                        <label class="payment-option">
                            <input type="radio" name="payment" value="mpesa" checked>
                            <div class="payment-label"><i class="fas fa-mobile-alt" style="color: #27ae60;"></i><div><strong>M-Pesa</strong><small>Pay via M-Pesa mobile money</small></div></div>
                        </label>
                        <label class="payment-option">
                            <input type="radio" name="payment" value="cod">
                            <div class="payment-label"><i class="fas fa-hand-holding-usd" style="color: #FF9900;"></i><div><strong>Cash on Delivery</strong><small>Pay when you receive your order</small></div></div>
                        </label>
                    </div>
                </div>
                <button class="btn-place-order" onclick="placeOrder()"><i class="fas fa-lock"></i> Place Order — KES ${Number(total).toLocaleString()}</button>
                <p style="text-align: center; font-size: 12px; color: #888; margin-top: 10px;"><i class="fas fa-shield-alt"></i> Secure checkout powered by Kenya Marketplace</p>
            </div>
        </div>`;
}

async function placeOrder() {
    const name = document.getElementById('ship-name').value.trim();
    const phone = document.getElementById('ship-phone').value.trim();
    const address = document.getElementById('ship-address').value.trim();
    const city = document.getElementById('ship-city').value.trim();
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'mpesa';
    if (!name || !phone || !address || !city) { showToast('Please fill in all shipping details', 'error'); return; }
    if (!token) { showAuthRequired(); return; }
    const localCart = JSON.parse(localStorage.getItem('cart')) || [];
    if (localCart.length === 0) { showToast('Your cart is empty!', 'error'); showEmptyCart(); return; }
    const btn = document.querySelector('.btn-place-order');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing order...';
    try {
        const subtotal = localCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 5000 ? 0 : 300;
        // Backend has NO /api/cart/ and NO /api/orders/checkout
        // Use POST /api/orders/ directly with items in the body
        const orderData = {
            items: localCart.map(item => ({
                product_id: item.id,
                quantity: item.quantity,
                price: item.price,
                name: item.name
            })),
            shipping_address: `${name}, ${phone}, ${address}, ${city}`,
            payment_method: paymentMethod,
            total_amount: subtotal + shipping,
            status: 'pending'
        };
        console.log('Placing order via POST /api/orders/:', orderData);
        const result = await apiFetch(`${API_BASE_URL}/api/orders/`, { method: 'POST', body: JSON.stringify(orderData) });
        if (!result) return;
        console.log('Order placed:', result);
        localStorage.removeItem('cart');
        showToast('Order placed successfully!', 'success');
        setTimeout(() => { window.location.href = 'orders.html'; }, 2000);
    } catch (error) {
        console.error('Order failed:', error);
        showToast('Failed to place order: ' + error.message, 'error');
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Place Order';
    }
}

function updateNavCartCount() {
    const localCart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = localCart.reduce((sum, item) => sum + item.quantity, 0);
    navCartCount.textContent = totalItems;
}

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
