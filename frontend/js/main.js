// Main JavaScript for Kenya Marketplace

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : 'https://kenya-marketplace-api.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    // Load featured products on homepage
    if (document.getElementById('productsGrid')) {
        loadFeaturedProducts();
    }
    
    // Load categories on homepage
    if (document.getElementById('categoriesGrid')) {
        loadCategories();
    }
    
    // Handle search on Enter key
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }
});

async function loadFeaturedProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/?limit=8`);
        const data = await response.json();
        const grid = document.getElementById('productsGrid');
        if (grid && data.products) {
            grid.innerHTML = data.products.map(product => `
                <div class="product-card">
                    <img src="${product.image_url || 'https://via.placeholder.com/300x200'}" alt="${product.name}">
                    <h3>${product.name}</h3>
                    <p class="price">KES ${product.price.toLocaleString()}</p>
                    <p class="vendor">${product.vendor_name || 'Verified Vendor'}</p>
                    <button onclick="addToCart(${product.id})" class="btn btn-primary">Add to Cart</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/categories`);
        const categories = await response.json();
        const grid = document.getElementById('categoriesGrid');
        if (grid && categories) {
            grid.innerHTML = categories.map(cat => `
                <div class="category-card" onclick="window.location.href='products.html?category=${cat.id}'">
                    <i class="fas ${cat.icon || 'fa-tag'}"></i>
                    <h3>${cat.name}</h3>
                    <p>${cat.product_count || 0} products</p>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('mobile-open');
    }
}
