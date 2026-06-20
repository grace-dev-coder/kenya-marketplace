if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

function getToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
}

function showToast(message, type) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.background = type === 'error' ? '#f44336' : '#4caf50';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
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

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Cart error:', response.status, errorText);
            throw new Error(`Failed to load cart: ${response.status}`);
        }

        const data = await response.json();
        console.log('Cart data:', data);
        renderCart(data);
    } catch (error) {
        console.error('Load cart error:', error);
        document.getElementById('cartItems').innerHTML = `<p style="color: #e74c3c; text-align: center; padding: 40px;">${error.message}. <a href="products.html">Continue shopping</a></p>`;
    }
}

function renderCart(cartData) {
    const container = document.getElementById('cartItems');
    const summary = document.getElementById('cartSummary');
    
    if (!container) return;

    if (!cartData.items || cartData.items.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Your cart is empty. <a href="products.html">Continue shopping</a></p>';
        if (summary) summary.style.display = 'none';
        updateCartCount(0);
        return;
    }

    container.innerHTML = cartData.items.map(item => `
        <div class="cart-item" style="display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #eee; background: #fff; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <img src="${item.image_url || 'https://via.placeholder.com/80?text=No+Image'}" 
                 alt="${item.product_name}" 
                 style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 20px;"
                 onerror="this.src='https://via.placeholder.com/80?text=No+Image'">
            <div style="flex: 1;">
                <h4 style="margin: 0 0 5px; font-size: 1.1em;">${item.product_name}</h4>
                <p style="color: #666; margin: 0;">KES ${item.price.toLocaleString()} each</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-right: 20px;">
                <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})" class="btn btn-sm btn-outline" style="padding: 8px 12px;">-</button>
                <span style="font-weight: 600; min-width: 30px; text-align: center;">${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})" class="btn btn-sm btn-outline" style="padding: 8px 12px;">+</button>
            </div>
            <div style="min-width: 120px; text-align: right;">
                <p style="font-weight: 600; margin: 0; font-size: 1.1em;">KES ${(item.price * item.quantity).toLocaleString()}</p>
                <button onclick="removeFromCart(${item.id})" class="btn btn-sm btn-danger" style="margin-top: 8px;">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        </div>
    `).join('');

    const subtotal = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + 200;

    document.getElementById('cartSubtotal').textContent = `KES ${subtotal.toLocaleString()}`;
    document.getElementById('cartTotal').textContent = `KES ${total.toLocaleString()}`;
    
    if (summary) summary.style.display = 'block';
    updateCartCount(cartData.count || 0);
}

function updateCartCount(count) {
    const countEl = document.getElementById('cartCount');
    if (countEl) {
        countEl.textContent = count;
    }
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
            const error = await response.json();
            showToast(error.detail || 'Failed to update quantity', 'error');
        }
    } catch (error) {
        console.error('Update quantity error:', error);
        showToast('Network error', 'error');
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
            showToast('Item removed');
            loadCart();
        } else {
            const error = await response.json();
            showToast(error.detail || 'Failed to remove item', 'error');
        }
    } catch (error) {
        console.error('Remove from cart error:', error);
        showToast('Network error', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cartItems')) {
        loadCart();
    }
});