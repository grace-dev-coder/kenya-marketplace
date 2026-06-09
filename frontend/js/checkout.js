// Checkout-specific functions

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : 'https://kenya-marketplace-api.onrender.com';

async function loadCheckoutSummary() {
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
        renderCheckoutSummary(data);
    } catch (error) {
        console.error('Error loading checkout:', error);
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
        <div class="checkout-item">
            <span>${item.product_name} x ${item.quantity}</span>
            <span>KES ${(item.price * item.quantity).toLocaleString()}</span>
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
            alert('Order placed successfully! Check your phone for M-Pesa prompt.');
            window.location.href = 'orders.html';
        } else {
            const error = await response.json();
            alert(error.detail || 'Checkout failed');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

// Initialize checkout page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('checkoutItems')) {
        loadCheckoutSummary();
    }
});
