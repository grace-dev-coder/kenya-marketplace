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
        
        // Normalize category to string for consistent comparison
        window.loadedProducts = products.map(p => ({
            ...p,
            category: String(p.category || '').trim()
        }));
        window.filteredProducts = window.loadedProducts;
        
        const container = document.getElementById('products-container');
        const loading = document.getElementById('loading');
        
        if (loading) loading.style.display = 'none';
        if (!container) return;
        
        if (!window.loadedProducts || window.loadedProducts.length === 0) {
            container.innerHTML = '<p class="no-products">No products available</p>';
            return;
        }
        
        renderProducts(window.loadedProducts);
        
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
                <p class="category">${getCategoryName(product.category)}</p>
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

// Map category IDs to names for display
function getCategoryName(categoryId) {
    const categories = {
        '1': 'Electronics',
        '2': 'Fashion',
        '3': 'Home & Garden',
        '4': 'Food & Groceries',
        '5': 'Sports'
    };
    return categories[String(categoryId)] || (categoryId || 'Uncategorized');
}

function filterProducts() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    const category = document.getElementById('category-filter').value;
    const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
    const maxPrice = parseFloat(document.getElementById('max-price').value) || Infinity;
    const sortBy = document.getElementById('sort-by').value;
    
    console.log('=== FILTER DEBUG ===');
    console.log('Selected category:', category, 'type:', typeof category);
    console.log('Total products:', window.loadedProducts.length);
    
    if (window.loadedProducts.length > 0) {
        console.log('First product:', window.loadedProducts[0].name, 'category:', window.loadedProducts[0].category, 'type:', typeof window.loadedProducts[0].category);
    }
    
    let filtered = window.loadedProducts.filter(product => {
        const matchesSearch = !searchTerm || 
            (product.name && product.name.toLowerCase().includes(searchTerm)) ||
            (product.description && product.description.toLowerCase().includes(searchTerm));
        
        // Both are now strings due to normalization in loadProducts
        const matchesCategory = category === 'All Categories' || 
            product.category === category;
        
        const price = parseFloat(product.price) || 0;
        const matchesPrice = price >= minPrice && price <= maxPrice;
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    console.log('Filtered count:', filtered.length);
    console.log('Filtered products:', filtered.map(p => ({name: p.name, category: p.category})));
    
    // Sort
    if (sortBy === 'price_low') {
        filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortBy === 'price_high') {
        filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else {
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