const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';

function getToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
}

async function loadCheckoutSummary() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        if (!response.ok) {
            throw new Error('Failed to load cart');
        }
        
        const data = await response.json();
        renderCheckoutSummary(data);
    } catch (error) {
        console.error('Error loading checkout:', error);
        document.getElementById('checkoutItems').innerHTML = '<p style="color: #e74c3c;">Failed to load cart. <a href="cart.html">Go to cart</a></p>';
    }
}

function renderCheckoutSummary(cartData) {
    const container = document.getElementById('checkoutItems');
    if (!container) return;

    if (!cartData.items || cartData.items.length === 0) {
        container.innerHTML = '<p>Your cart is empty. <a href="products.html">Continue shopping</a></p>';
        return;
    }

    container.innerHTML = cartData.items.map(item => `
        <div class="checkout-item" style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
            <span>
                <img src="${item.image_url || 'https://via.placeholder.com/40?text=No+Image'}" 
                     style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; vertical-align: middle; margin-right: 10px;"
                     onerror="this.src='https://via.placeholder.com/40?text=No+Image'">
                ${item.product_name} x ${item.quantity}
            </span>
            <span style="font-weight: 600;">KES ${(item.price * item.quantity).toLocaleString()}</span>
        </div>
    `).join('');

    const subtotal = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = 200;
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = `KES ${subtotal.toLocaleString()}`;
    document.getElementById('shipping').textContent = `KES ${shipping.toLocaleString()}`;
    document.getElementById('total').textContent = `KES ${total.toLocaleString()}`;
}

async function processCheckout() {
    const token = getToken();
    const phone = document.getElementById('phoneNumber').value.trim();
    const address = document.getElementById('deliveryAddress').value.trim();

    if (!phone || !address) {
        alert('Please fill in all required fields');
        return;
    }

    if (!phone.startsWith('254') || phone.length !== 12) {
        alert('Please enter a valid M-Pesa number starting with 254 (e.g., 254712345678)');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                phone_number: phone,
                delivery_address: address,
                payment_method: 'mpesa'
            })
        });

        if (response.ok) {
            const result = await response.json();
            alert(`Order placed successfully! Order #${result.order_id}. Check your phone for M-Pesa prompt.`);
            window.location.href = 'orders.html';
        } else {
            const error = await response.json();
            alert(error.detail || 'Checkout failed');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Network error. Please try again.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('checkoutItems')) {
        loadCheckoutSummary();
    }
});