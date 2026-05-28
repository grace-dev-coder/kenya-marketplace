// Authentication utilities

function getToken() {
    return localStorage.getItem('access_token');
}

function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function isLoggedIn() {
    return !!getToken();
}

function isAdmin() {
    const user = getUser();
    return user && user.role === 'admin';
}

function isVendor() {
    const user = getUser();
    return user && (user.role === 'vendor' || user.role === 'admin');
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

function updateAuthUI() {
    const token = getToken();
    const user = getUser();
    const authLinks = document.getElementById('authLinks');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');

    if (token && user) {
        if (authLinks) authLinks.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            if (userName) userName.textContent = user.full_name.split(' ')[0];
        }
        updateCartCount();
    } else {
        if (authLinks) authLinks.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

async function updateCartCount() {
    const token = getToken();
    if (!token) return;
    
    try {
        const response = await fetch('http://localhost:8000/api/orders/cart', {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const data = await response.json();
        const count = data.items ? data.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
        
        const cartCountElements = document.querySelectorAll('#cartCount');
        cartCountElements.forEach(el => el.textContent = count);
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Protect routes
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function requireAdmin() {
    if (!isAdmin()) {
        alert('Admin access required');
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Add to cart helper
async function addToCart(productId, quantity = 1) {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:8000/api/orders/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({product_id: productId, quantity: quantity})
        });

        if (response.ok) {
            alert('Added to cart!');
            updateCartCount();
        } else {
            const error = await response.json();
            alert(error.detail || 'Failed to add to cart');
        }
    } catch (error) {
        alert('Network error. Please try again.');
    }
}

// Add to wishlist helper
async function addToWishlist(productId) {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    alert('Added to wishlist!');
}

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', updateAuthUI);