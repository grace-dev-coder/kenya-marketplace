if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

function getToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
}

async function loadCart() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            alert('Session expired. Please log in again.');
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();
        renderCart(data);
    } catch (error) {
        console.error('Load cart error:', error);
        document.getElementById('cartItems').innerHTML = '<p style="color: #e74c3c;">Failed to load cart</p>';
    }
}

function renderCart(cartData) {
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    
    if (!container) return;

    if (!cartData.items || cartData.items.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Your cart is empty. <a href="products.html">Continue shopping</a></p>';
        if (summary) summary.style.display = 'none';
        return;
    }

    container.innerHTML = cartData.items.map(item => `
        <div class="cart-item" style="display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #eee; background: #fff; border-radius: 8px; margin-bottom: 10px;">
            <img src="${item.image_url || 'https://via.placeholder.com/80?text=No+Image'}" 
                 alt="${item.product_name}" 
                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 20px;"
                 onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
            <div style="flex: 1;">
                <h4 style="margin: 0 0 5px;">${item.product_name}</h4>
                <p style="color: #666; margin: 0;">KES ${item.price.toLocaleString()} each</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})" class="btn btn-sm btn-outline">-</button>
                <span style="font-weight: 600; min-width: 30px; text-align: center;">${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})" class="btn btn-sm btn-outline">+</button>
            </div>
            <div style="margin-left: 20px; min-width: 100px; text-align: right;">
                <p style="font-weight: 600; margin: 0;">KES ${(item.price * item.quantity).toLocaleString()}</p>
                <button onclick="removeFromCart(${item.id})" class="btn btn-sm btn-danger" style="margin-top: 5px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    const subtotal = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + 200;

    document.getElementById('cartSubtotal').textContent = `KES ${subtotal.toLocaleString()}`;
    document.getElementById('cartTotal').textContent = `KES ${total.toLocaleString()}`;
    document.getElementById('cartCount').textContent = cartData.count || 0;
    
    if (summary) summary.style.display = 'block';
}

async function updateQuantity(cartItemId, quantity) {
    const token = getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity: quantity })
        });

        if (response.ok) {
            loadCart();
        } else {
            alert('Failed to update quantity');
        }
    } catch (error) {
        console.error('Update quantity error:', error);
    }
}

async function removeFromCart(cartItemId) {
    const token = getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadCart();
        } else {
            alert('Failed to remove item');
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cartItems')) {
        loadCart();
    }
});