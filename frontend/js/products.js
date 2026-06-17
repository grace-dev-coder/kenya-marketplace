// Use var with check to prevent redeclaration
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

window.loadedProducts = [];

async function loadProducts() {
    try {
        const response = await fetch(API_BASE_URL + '/api/products/?limit=100');
        const products = await response.json();
        
        window.loadedProducts = products;
        
        const container = document.getElementById('products-container');
        if (!container) return;
        
        if (!products || products.length === 0) {
            container.innerHTML = '<p class="no-products">No products available</p>';
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
        
    } catch (error) {
        console.error('Error loading products:', error);
    }
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

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('products-container')) {
        loadProducts();
    }
});
