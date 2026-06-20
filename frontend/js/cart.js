// ============================================
// Kenya Marketplace - Cart Page JavaScript
// ============================================

const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';

// State
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// DOM Elements
const cartContainer = document.getElementById('cart-container');
const navCartCount = document.getElementById('nav-cart-count');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    updateNavCartCount();

    // Search events
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
});

// ============================================
// MENU TOGGLE (matches index.html)
// ============================================

function toggleMenu() {
    document.getElementById('dropdownMenu').classList.toggle('active');
}

document.addEventListener('click', function(e) {
    const menu = document.getElementById('dropdownMenu');
    const btn = document.querySelector('.menu-btn');
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove('active');
    }
});

// ============================================
// SEARCH
// ============================================

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        window.location.href = 'products.html?search=' + encodeURIComponent(query);
    }
}

// ============================================
// RENDER CART
// ============================================

function renderCart() {
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added any items yet.</p>
                <a href="products.html" class="btn-shop-now">
                    <i class="fas fa-shopping-bag"></i> Start Shopping
                </a>
            </div>
        `;
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 5000 ? 0 : 300;
    const total = subtotal + shipping;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartItemsHTML = cart.map((item, index) => `
        <div class="cart-item" data-index="${index}">
            <div class="item-image">
                ${item.image 
                    ? `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-image placeholder-icon\'></i>';">`
                    : `<i class="fas fa-image placeholder-icon"></i>`
                }
            </div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-price">KES ${Number(item.price).toLocaleString()} each</div>
                <div class="item-actions">
                    <div class="qty-control">
                        <button onclick="updateQuantity(${index}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${index}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn-remove" onclick="removeItem(${index})">
                        <i class="fas fa-trash-alt"></i> Remove
                    </button>
                </div>
            </div>
            <div class="item-total">
                KES ${Number(item.price * item.quantity).toLocaleString()}
            </div>
        </div>
    `).join('');

    cartContainer.innerHTML = `
        <div class="cart-items">
            <div class="cart-header">
                <h2><i class="fas fa-shopping-bag"></i> Cart Items</h2>
                <span>${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
            </div>
            <div class="cart-list">
                ${cartItemsHTML}
            </div>
        </div>
        <div class="cart-summary">
            <h3><i class="fas fa-receipt"></i> Order Summary</h3>
            <div class="summary-row">
                <span>Subtotal</span>
                <span>KES ${Number(subtotal).toLocaleString()}</span>
            </div>
            <div class="summary-row">
                <span>Shipping</span>
                <span>${shipping === 0 ? 'FREE' : 'KES ' + Number(shipping).toLocaleString()}</span>
            </div>
            ${shipping > 0 ? `
            <div class="summary-row" style="font-size: 12px; color: #888;">
                <span><i class="fas fa-info-circle"></i> Free shipping on orders over KES 5,000</span>
            </div>
            ` : ''}
            <div class="summary-row total">
                <span>Total</span>
                <span>KES ${Number(total).toLocaleString()}</span>
            </div>
            <button class="btn-checkout" onclick="proceedToCheckout()">
                <i class="fas fa-credit-card"></i> Proceed to Checkout
            </button>
            <a href="products.html" class="btn-continue">
                <i class="fas fa-arrow-left"></i> Continue Shopping
            </a>
        </div>
    `;
}

// ============================================
// CART OPERATIONS
// ============================================

function updateQuantity(index, change) {
    const item = cart[index];
    if (!item) return;

    const newQty = item.quantity + change;
    if (newQty < 1) return;

    item.quantity = newQty;
    localStorage.setItem('cart', JSON.stringify(cart));

    renderCart();
    updateNavCartCount();

    showToast(change > 0 ? 'Quantity increased' : 'Quantity decreased', 'success');
}

function removeItem(index) {
    const item = cart[index];
    if (!item) return;

    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));

    renderCart();
    updateNavCartCount();

    showToast(`${item.name} removed from cart`, 'success');
}

function updateNavCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    navCartCount.textContent = totalItems;
}

// ============================================
// CHECKOUT
// ============================================

function proceedToCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!', 'error');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please login to checkout', 'error');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=checkout.html';
        }, 1500);
        return;
    }

    window.location.href = 'checkout.html';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
