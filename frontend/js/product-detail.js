// ============================================
// Kenya Marketplace - Product Detail Page JavaScript
// ============================================

const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';

let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
let quantity = 1;

const productDetail = document.getElementById('product-detail');
const breadcrumbName = document.getElementById('breadcrumb-name');
const relatedSection = document.getElementById('related-section');
const relatedGrid = document.getElementById('related-grid');
const navCartCount = document.getElementById('nav-cart-count');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showNotFound();
        return;
    }

    loadProduct(productId);
    updateNavCartCount();

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
});

function toggleMenu() { document.getElementById('dropdownMenu').classList.toggle('active'); }
document.addEventListener('click', function(e) {
    const menu = document.getElementById('dropdownMenu');
    const btn = document.querySelector('.menu-btn');
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) menu.classList.remove('active');
});

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) window.location.href = 'products.html?search=' + encodeURIComponent(query);
}

async function loadProduct(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
        if (!response.ok) {
            if (response.status === 404) { showNotFound(); return; }
            throw new Error(`HTTP ${response.status}`);
        }
        const product = await response.json();
        currentProduct = product;
        renderProduct(product);
        loadRelatedProducts(product);
    } catch (error) {
        console.error('Error loading product:', error);
        productDetail.innerHTML = `
            <div class="error-detail" style="grid-column: 1 / -1;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px; color: #e74c3c;"></i>
                <h3 style="margin-bottom: 10px;">Failed to load product</h3>
                <p style="color: #666;">${error.message}</p>
                <button onclick="window.location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #FF9900; color: #232F3E; border: none; border-radius: 4px; cursor: pointer; font-weight: 700;">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>`;
    }
}

function renderProduct(product) {
    const imageUrl = product.image_url || product.image || '';
    const hasImage = imageUrl && !imageUrl.includes('placeholder') && imageUrl.trim() !== '';
    const stockClass = product.stock <= 5 ? 'low' : (product.stock === 0 ? 'out' : 'in');
    const stockText = product.stock === 0 ? 'Out of Stock' : (product.stock <= 5 ? `Only ${product.stock} left` : `In Stock (${product.stock} available)`);
    const isWishlisted = wishlist.includes(product.id);

    breadcrumbName.textContent = product.name;
    document.title = `${product.name} - Kenya Marketplace`;

    productDetail.innerHTML = `
        <div class="product-gallery">
            <div class="main-image">
                ${hasImage 
                    ? `<img src="${imageUrl}" alt="${product.name}" id="main-product-img">`
                    : `<i class="fas fa-image placeholder-icon"></i>`
                }
                ${product.stock <= 5 && product.stock > 0 ? '<span class="image-badge">Low Stock</span>' : ''}
            </div>
        </div>
        <div class="product-info-detail">
            <span class="product-category-tag">${product.category || 'General'}</span>
            <h1 class="product-title">${product.name}</h1>
            <div class="product-rating">
                <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i>
                <span>4.5 (12 reviews)</span>
            </div>
            <div class="product-price-detail">
                KES ${Number(product.price).toLocaleString()}
                ${product.original_price ? `<span class="original">KES ${Number(product.original_price).toLocaleString()}</span>` : ''}
            </div>
            <div class="product-description">
                ${product.description || 'No description available for this product.'}
            </div>
            <div class="product-meta-detail">
                <div class="meta-item"><i class="fas fa-box"></i><div><span class="label">Category:</span> ${product.category || 'General'}</div></div>
                <div class="meta-item"><i class="fas fa-tag"></i><div><span class="label">SKU:</span> PROD-${product.id.toString().padStart(4, '0')}</div></div>
                <div class="meta-item"><i class="fas fa-truck"></i><div><span class="label">Delivery:</span> 1-3 days</div></div>
                <div class="meta-item"><i class="fas fa-undo"></i><div><span class="label">Returns:</span> 7 days</div></div>
            </div>
            <div class="stock-status ${stockClass}">
                <i class="fas fa-circle" style="font-size: 8px;"></i> ${stockText}
            </div>
            <div class="quantity-selector">
                <label>Quantity:</label>
                <div class="qty-control-detail">
                    <button onclick="changeQty(-1)" ${quantity <= 1 ? 'disabled' : ''}><i class="fas fa-minus"></i></button>
                    <input type="number" id="qty-input" value="1" min="1" max="${product.stock}" onchange="setQty(this.value)">
                    <button onclick="changeQty(1)" ${quantity >= product.stock ? 'disabled' : ''}><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <div class="action-buttons">
                <button class="btn-add-cart-detail" onclick="addToCartDetail()" ${product.stock === 0 ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
                <button class="btn-wishlist-detail ${isWishlisted ? 'active' : ''}" onclick="toggleWishlistDetail()" title="${isWishlisted ? 'Remove from' : 'Add to'} wishlist">
                    <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
        </div>
    `;
}

function changeQty(delta) {
    if (!currentProduct) return;
    const newQty = quantity + delta;
    if (newQty < 1 || newQty > currentProduct.stock) return;
    quantity = newQty;
    document.getElementById('qty-input').value = quantity;

    // Update button states
    const buttons = document.querySelectorAll('.qty-control-detail button');
    buttons[0].disabled = quantity <= 1;
    buttons[1].disabled = quantity >= currentProduct.stock;
}

function setQty(val) {
    if (!currentProduct) return;
    let newQty = parseInt(val) || 1;
    if (newQty < 1) newQty = 1;
    if (newQty > currentProduct.stock) newQty = currentProduct.stock;
    quantity = newQty;
    document.getElementById('qty-input').value = quantity;

    const buttons = document.querySelectorAll('.qty-control-detail button');
    buttons[0].disabled = quantity <= 1;
    buttons[1].disabled = quantity >= currentProduct.stock;
}

function addToCartDetail() {
    if (!currentProduct || currentProduct.stock === 0) return;

    const existingItem = cart.find(item => item.id === currentProduct.id);
    if (existingItem) {
        if (existingItem.quantity + quantity <= currentProduct.stock) {
            existingItem.quantity += quantity;
            showToast(`${quantity} more added to cart!`, 'success');
        } else {
            showToast('Maximum stock reached!', 'error');
            return;
        }
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.image_url || currentProduct.image || '',
            quantity: quantity
        });
        showToast('Added to cart!', 'success');
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateNavCartCount();
}

function toggleWishlistDetail() {
    if (!currentProduct) return;
    const index = wishlist.indexOf(currentProduct.id);
    const btn = document.querySelector('.btn-wishlist-detail');
    const icon = btn.querySelector('i');

    if (index > -1) {
        wishlist.splice(index, 1);
        btn.classList.remove('active');
        icon.classList.remove('fas'); icon.classList.add('far');
        showToast('Removed from wishlist', 'success');
    } else {
        wishlist.push(currentProduct.id);
        btn.classList.add('active');
        icon.classList.remove('far'); icon.classList.add('fas');
        showToast('Added to wishlist', 'success');
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

async function loadRelatedProducts(currentProduct) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/`);
        if (!response.ok) return;
        const products = await response.json();

        const related = products
            .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
            .slice(0, 4);

        if (related.length === 0) {
            // Fallback: just show any other products
            const fallback = products.filter(p => p.id !== currentProduct.id).slice(0, 4);
            if (fallback.length === 0) return;
            renderRelated(fallback);
        } else {
            renderRelated(related);
        }
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

function renderRelated(products) {
    relatedSection.style.display = 'block';
    relatedGrid.innerHTML = products.map(product => {
        const imageUrl = product.image_url || product.image || '';
        const hasImage = imageUrl && !imageUrl.includes('placeholder') && imageUrl.trim() !== '';
        return `
            <a href="product-detail.html?id=${product.id}" class="related-card">
                <div class="related-image">
                    ${hasImage 
                        ? `<img src="${imageUrl}" alt="${product.name}" loading="lazy">`
                        : `<i class="fas fa-image placeholder-icon"></i>`
                    }
                </div>
                <div class="related-info">
                    <div class="related-name">${product.name}</div>
                    <div class="related-price">KES ${Number(product.price).toLocaleString()}</div>
                </div>
            </a>
        `;
    }).join('');
}

function showNotFound() {
    productDetail.innerHTML = `
        <div class="not-found" style="grid-column: 1 / -1;">
            <i class="fas fa-search" style="font-size: 4rem; color: #ddd; margin-bottom: 20px;"></i>
            <h2>Product Not Found</h2>
            <p style="color: #888; margin-bottom: 25px;">The product you're looking for doesn't exist or has been removed.</p>
            <a href="products.html" class="btn-shop-now"><i class="fas fa-arrow-left"></i> Browse Products</a>
        </div>
    `;
    breadcrumbName.textContent = 'Not Found';
}

function updateNavCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    navCartCount.textContent = totalItems;
}

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
