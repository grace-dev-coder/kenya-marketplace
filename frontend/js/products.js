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

async function loadProducts() {
    try {
        console.log('Loading products from:', `${API_BASE_URL}/api/products/`);
        const response = await fetch(`${API_BASE_URL}/api/products/`);
        
        console.log('Products response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to load products: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('Products loaded:', products.length);
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsGrid').innerHTML = `<p style="text-align:center; padding:40px; color:#e74c3c;">Failed to load products: ${error.message}</p>`;
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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 1.2em; font-weight: 700; color: #1976d2;">KES ${product.price ? product.price.toLocaleString() : '0'}</span>
                    <span style="font-size: 0.85em; color: #666;">${product.stock || 0} left</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="addToCart(${product.id})" class="btn btn-primary" style="flex: 1; padding: 10px; cursor: pointer;">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <a href="product-detail.html?id=${product.id}" class="btn btn-outline" style="padding: 10px; text-decoration: none;">
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

        console.log('Add to cart response status:', response.status);

        if (response.status === 401) {
            alert('Session expired. Please log in again.');
            window.location.href = 'login.html';
            return;
        }

        if (response.ok) {
            showToast('Added to cart!');
            updateCartCount();
        } else {
            const error = await response.json();
            showToast(error.detail || 'Failed to add to cart', 'error');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showToast('Network error. Please try again.', 'error');
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