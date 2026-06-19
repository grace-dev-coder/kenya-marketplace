if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

function getToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/`);
        const products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsGrid').innerHTML = '<p style="text-align:center; padding:40px; color:#e74c3c;">Failed to load products</p>';
    }
}

function renderProducts(products) {
    const container = document.getElementById('productsGrid');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:40px;">No products available</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card" style="background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s;">
            <div style="position: relative; padding-top: 75%; overflow: hidden;">
                <img src="${product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                     alt="${product.name}" 
                     style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                     onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
            </div>
            <div style="padding: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 1.1em;">${product.name}</h3>
                <p style="color: #666; font-size: 0.9em; margin: 0 0 12px; line-height: 1.4;">${product.description || ''}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.2em; font-weight: 700; color: #1976d2;">KES ${product.price ? product.price.toLocaleString() : '0'}</span>
                    <span style="font-size: 0.85em; color: #666;">${product.stock || 0} left</span>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button onclick="addToCart(${product.id})" class="btn btn-primary" style="flex: 1; padding: 10px;">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <a href="product-detail.html?id=${product.id}" class="btn btn-outline" style="padding: 10px;">
                        <i class="fas fa-eye"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

async function addToCart(productId) {
    const token = getToken();
    if (!token) {
        alert('Please log in first');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: 1
            })
        });

        if (response.status === 401) {
            alert('Session expired. Please log in again.');
            window.location.href = 'login.html';
            return;
        }

        if (response.ok) {
            alert('Added to cart!');
            updateCartCount();
        } else {
            const error = await response.json();
            alert(error.detail || 'Failed to add to cart');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        alert('Network error. Please try again.');
    }
}

function updateCartCount() {
    const token = getToken();
    if (!token) return;

    fetch(`${API_BASE_URL}/api/cart/`, {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
        const countEl = document.getElementById('cartCount');
        if (countEl) {
            countEl.textContent = data.count || 0;
        }
    })
    .catch(err => console.error('Cart count error:', err));
}

function filterProducts() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    
    // Reload and filter
    fetch(`${API_BASE_URL}/api/products/`)
        .then(res => res.json())
        .then(products => {
            let filtered = products;
            if (search) {
                filtered = filtered.filter(p => 
                    (p.name && p.name.toLowerCase().includes(search)) ||
                    (p.description && p.description.toLowerCase().includes(search))
                );
            }
            if (category) {
                filtered = filtered.filter(p => p.category === category);
            }
            renderProducts(filtered);
        })
        .catch(err => console.error('Filter error:', err));
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsGrid')) {
        loadProducts();
        updateCartCount();
    }
});