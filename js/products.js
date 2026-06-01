// Product-related functions

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : 'https://kenya-marketplace-api.onrender.com';

async function loadFeaturedProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/?limit=8`);
        const products = await response.json();

        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        grid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.images || 'https://placehold.co/300x300?text=No+Image'}" alt="${product.name}">
                    <button class="wishlist-btn" onclick="addToWishlist(${product.id})"><i class="fas fa-heart"></i></button>
                </div>
                <div class="product-info">
                    <h3><a href="product-detail.html?id=${product.id}">${product.name}</a></h3>
                    <p class="vendor">${product.vendor_name}</p>
                    <div class="rating">
                        ${'★'.repeat(Math.floor(product.average_rating))}${'☆'.repeat(5 - Math.floor(product.average_rating))}
                        <span>(${product.average_rating})</span>
                    </div>
                    <div class="product-footer">
                        <span class="price">KES ${product.price.toLocaleString()}</span>
                        <button class="btn btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/categories`);
        const categories = await response.json();

        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;

        const icons = ['fa-mobile-alt', 'fa-tshirt', 'fa-couch', 'fa-spa', 'fa-car', 'fa-shopping-basket', 'fa-futbol'];

        grid.innerHTML = categories.map((cat, index) => `
            <div class="category-card" onclick="window.location.href='products.html?category=${cat.id}'">
                <i class="fas ${icons[index % icons.length]}"></i>
                <h3>${cat.name}</h3>
                <p>${cat.product_count || 0} products</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProductsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    const searchQuery = urlParams.get('search');
    const sortBy = urlParams.get('sort_by') || 'created_at';
    
    let url = `${API_BASE_URL}/api/products/?skip=0&limit=12&sort_by=${sortBy}`;
    if (categoryId) url += `&category_id=${categoryId}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        if (!data.products || data.products.length === 0) {
            grid.innerHTML = '<p class="no-results">No products found</p>';
            return;
        }

        grid.innerHTML = data.products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.images || 'https://placehold.co/300x300?text=No+Image'}" alt="${product.name}">
                    <button class="wishlist-btn" onclick="addToWishlist(${product.id})"><i class="fas fa-heart"></i></button>
                </div>
                <div class="product-info">
                    <h3><a href="product-detail.html?id=${product.id}">${product.name}</a></h3>
                    <p class="vendor">${product.vendor_name}</p>
                    <div class="rating">
                        ${'★'.repeat(Math.floor(product.average_rating))}${'☆'.repeat(5 - Math.floor(product.average_rating))}
                        <span>(${product.average_rating})</span>
                    </div>
                    <div class="product-footer">
                        <span class="price">KES ${product.price.toLocaleString()}</span>
                        <button class="btn btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Update page title if searching
        if (searchQuery) {
            document.title = `Search: ${searchQuery} - Kenya Marketplace`;
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        const product = await response.json();

        document.getElementById('productName').textContent = product.name;
        document.getElementById('productPrice').textContent = `KES ${product.price.toLocaleString()}`;
        document.getElementById('productVendor').textContent = product.vendor_name;
        document.getElementById('productDescription').textContent = product.description;
        
        const imageEl = document.getElementById('productImage');
        if (imageEl) imageEl.src = product.images || 'https://placehold.co/500x500?text=No+Image';

        // Load reviews if available
        loadProductReviews(productId);
    } catch (error) {
        console.error('Error loading product detail:', error);
    }
}

async function loadProductReviews(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/reviews/?product_id=${productId}`);
        const reviews = await response.json();
        
        const container = document.getElementById('reviewsList');
        if (!container) return;

        if (!reviews || reviews.length === 0) {
            container.innerHTML = '<p>No reviews yet</p>';
            return;
        }

        container.innerHTML = reviews.map(review => `
            <div class="review">
                <div class="review-header">
                    <span class="reviewer">${review.user_name}</span>
                    <span class="stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                </div>
                <p>${review.comment}</p>
                <small>${new Date(review.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Initialize product pages
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsGrid') && document.getElementById('categoriesGrid')) {
        loadFeaturedProducts();
        loadCategories();
    }
    
    if (document.getElementById('productsGrid') && !document.getElementById('categoriesGrid')) {
        loadProductsPage();
    }
    
    if (document.getElementById('productDetail')) {
        loadProductDetail();
    }
});
