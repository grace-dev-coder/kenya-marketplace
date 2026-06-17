// Use var with check to prevent redeclaration
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

window.loadedProducts = [];
window.filteredProducts = [];

async function loadProducts() {
    try {
        const response = await fetch(API_BASE_URL + '/api/products/?limit=100');
        const products = await response.json();
        
        window.loadedProducts = products;
        window.filteredProducts = products;
        
        const container = document.getElementById('products-container');
        const loading = document.getElementById('loading');
        
        if (loading) loading.style.display = 'none';
        if (!container) return;
        
        if (!products || products.length === 0) {
            container.innerHTML = '<p class="no-products">No products available</p>';
            return;
        }
        
        renderProducts(products);
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function renderProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="no-products">No products found matching your criteria</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image_url || 'https://via.placeholder.com/250'}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/250'">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="price">KES ${(product.price || 0).toLocaleString()}</p>
                <p class="category">${product.category || 'Uncategorized'}</p>
                <div class="product-actions">
                    <a href="product-detail.html?id=${product.id}" class="btn btn-outline">View Details</a>
                    <button onclick="addProductToCart(${product.id})" class="btn btn-primary">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const category = document.getElementById('category-filter').value;
    const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-price').value) || Infinity;
    const sortBy = document.getElementById('sort-by').value;
    
    let filtered = window.loadedProducts.filter(product => {
        const matchesSearch = !searchTerm || 
            (product.name && product.name.toLowerCase().includes(searchTerm)) ||
            (product.description && product.description.toLowerCase().includes(searchTerm));
        
        const matchesCategory = category === 'All Categories' || 
            (product.category && product.category === category);
        
        const price = parseFloat(product.price) || 0;
        const matchesPrice = price >= minPrice && price <= maxPrice;
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    // Sort
    if (sortBy === 'price_low') {
        filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortBy === 'price_high') {
        filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else {
        // newest - sort by id descending (assuming higher id = newer)
        filtered.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
    
    window.filteredProducts = filtered;
    renderProducts(filtered);
}

function clearFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('category-filter').value = 'All Categories';
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    document.getElementById('sort-by').value = 'newest';
    
    window.filteredProducts = window.loadedProducts;
    renderProducts(window.loadedProducts);
}

function addProductToCart(productId) {
    const product = window.loadedProducts.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        alert('Error: Product not found');
        return;
    }
    
    if (typeof addToCart === 'function') {
        addToCart(product);
    } else {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
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
        
        localStorage.setItem('cart', JSON.stringify(cart));
        alert(product.name + ' added to cart!');
        
        if (typeof updateCartCount === 'function') {
            updateCartCount();
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('products-container')) {
        loadProducts();
        
        // Attach event listeners
        const searchBtn = document.getElementById('search-btn');
        const searchInput = document.getElementById('search-input');
        const applyFiltersBtn = document.getElementById('apply-filters');
        const clearFiltersBtn = document.getElementById('clear-filters');
        
        if (searchBtn) searchBtn.addEventListener('click', filterProducts);
        if (searchInput) searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') filterProducts();
        });
        if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', filterProducts);
        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearFilters);
    }
});