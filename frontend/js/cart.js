// Check if API_BASE_URL already exists
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}
}

function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('access_token');
}

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Add product to cart (called from products.js)
function addToCart(product) {
    const cart = getCart();
    const existingItem = cart.find(item => item.product_id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            product_id: product.id,
            product_name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1
        });
    }
    
    saveCart(cart);
    updateCartCount();
    alert(`${product.name} added to cart!`);
}

// Remove from cart
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.product_id !== productId);
    saveCart(cart);
    loadCart();
    updateCartCount();
}

// Update quantity
function updateQuantity(productId, quantity) {
    if (quantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const cart = getCart();
    const item = cart.find(item => item.product_id === productId);
    if (item) {
        item.quantity = quantity;
        saveCart(cart);
        loadCart();
        updateCartCount();
    }
}

// Load and render cart
function loadCart() {
    const cart = getCart();
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        updateCartTotal(0);
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.product_id}">
            <img src="${item.image_url || 'https://via.placeholder.com/100'}" alt="${item.product_name}">
            <div class="item-details">
                <h3>${item.product_name}</h3>
                <p class="price">KES ${(item.price || 0).toLocaleString()} each</p>
            </div>
            <div class="item-quantity">
                <button onclick="updateQuantity(${item.product_id}, ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
            </div>
            <p class="item-total">KES ${((item.price || 0) * item.quantity).toLocaleString()}</p>
            <button onclick="removeFromCart(${item.product_id})" class="btn-remove"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0);
    updateCartTotal(total);
}

function updateCartTotal(total) {
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = `KES ${total.toLocaleString()}`;
}

// Update cart count badge
function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartCount');
    if (badge) badge.textContent = count;
}

// Initialize cart page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cartItems')) {
        loadCart();
    }
    updateCartCount();
});