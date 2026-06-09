// Product-related functions

async function loadFeaturedProducts() {
    try {
        const response = await fetch('http://localhost:8000/api/products/?limit=8');
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
        const response = await fetch('http://localhost:8000/api/products/categories');
        const categories = await response.json();
        
        const grid = document.getElementById('categoriesGrid');
        if (!grid) return;
        
        const icons = ['fa-mobile-alt', 'fa-tshirt', 'fa-couch', 'fa-spa', 'fa-car', 'fa-shopping-basket', 'fa-futbol'];
        
        grid.innerHTML = categories.map((cat, index) => `
            <div class="category-card" onclick="window.location.href='products.html?category=${cat.id}'">
                <i class="fas ${icons[index % icons.length]}"></i>
                <h4>${cat.name}</h4>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}