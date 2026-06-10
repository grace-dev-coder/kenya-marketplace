// Cart-specific functions

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'https://kenya-marketplace-api.onrender.com' 
    : 'https://kenya-marketplace-api.onrender.com';

async function loadCart() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/cart`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const data = await response.json();
        renderCart(data);
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

function renderCart(cartData) {
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (!cartData.items || cartData.items.length === 0) {
        container.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        updateCartTotal(0);
        return;
    }

    container.innerHTML = cartData.items.map(item => `
        <div class="cart-item" data-id="${item.product_id}">
            <img src="${item.image_url || 'https://via.placeholder.com/100'}" alt="${item.product_name}">
            <div class="item-details">
                <h3>${item.product_name}</h3>
                <p class="price">KES ${item.price.toLocaleString()} each</p>
            </div>
            <div class="item-quantity">
                <button onclick="updateQuantity(${item.product_id}, ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.product_id}, ${item.quantity + 1})">+</button>
            </div>
            <p class="item-total">KES ${(item.price * item.quantity).toLocaleString()}</p>
            <button onclick="removeFromCart(${item.product_id})" class="btn-remove"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    const total = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    updateCartTotal(total);
}

async function updateQuantity(productId, quantity) {
    if (quantity < 1) {
        removeFromCart(productId);
        return;
    }

    const token = getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/cart`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({product_id: productId, quantity: quantity})
        });

        if (response.ok) {
            loadCart();
            updateCartCount();
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
    }
}

async function removeFromCart(productId) {
    const token = getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/cart/${productId}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });

        if (response.ok) {
            loadCart();
            updateCartCount();
        }
    } catch (error) {
        console.error('Error removing item:', error);
    }
}

function updateCartTotal(total) {
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = `KES ${total.toLocaleString()}`;
}

// Initialize cart page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cartItems')) {
        loadCart();
    }
});
