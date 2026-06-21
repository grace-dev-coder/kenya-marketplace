// ============================================
// Kenya Marketplace - Products Page JavaScript
// ============================================

const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';

let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

const productsGrid = document.getElementById('products-grid');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categoryFilter = document.getElementById('category-filter');
const resultsCount = document.getElementById('results-count');
const navCartCount = document.getElementById('nav-cart-count');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

document.addEventListener('DOMContentLoaded', () => {
    console.log('API Base URL:', API_BASE_URL);
    loadProducts();
    updateNavCartCount();

    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });
    categoryFilter.addEventListener('change', filterProducts);

    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) { searchInput.value = searchQuery; filterProducts(); }
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

async function loadProducts() {
    console.log('Loading products from:', `${API_BASE_URL}/api/products/`);
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/`);
        console.log('Products response status:', response.status);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const products = await response.json();
        console.log('Products loaded:', products.length);
        allProducts = products;
        populateCategories(products);
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                <h3 style="margin-bottom: 8px;">Failed to load products</h3>
                <p style="color: #666;">${error.message}</p>
                <button onclick="loadProducts()"><i class="fas fa-redo"></i> Retry</button>
            </div>`;
        updateResultsCount(0);
    }
}

function populateCategories(products) {
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => { categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`; });
}

function renderProducts(products) {
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3 style="margin-bottom: 8px;">No products found</h3>
                <p style="color: #666;">Try adjusting your search or filter criteria.</p>
            </div>`;
        updateResultsCount(0);
        return;
    }
    productsGrid.innerHTML = products.map(product => {
        const imageUrl = product.image_url || product.image || '';
        const hasImage = imageUrl && !imageUrl.includes('placeholder') && imageUrl.trim() !== '';
        const stockClass = product.stock <= 5 ? 'low' : (product.stock === 0 ? 'out' : '');
        const stockText = product.stock === 0 ? 'Out of Stock' : `${product.stock} left`;
        const isWishlisted = wishlist.includes(product.id);
        return `
            <div class="product-card" data-id="${product.id}">
                <div class="product-image">
                    ${hasImage ? `<img src="${imageUrl}" alt="${product.name}" loading="lazy" onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<i class=\'fas fa-image placeholder-icon\'></i>';">` : `<i class="fas fa-image placeholder-icon"></i>`}
                    ${product.stock <= 5 && product.stock > 0 ? '<span class="product-badge">Low Stock</span>' : ''}
                    <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist(${product.id})" title="${isWishlisted ? 'Remove from' : 'Add to'} wishlist">
                        <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category || 'General'}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-desc">${product.description || 'No description available'}</p>
                    <div class="product-meta">
                        <span class="product-price">KES ${Number(product.price).toLocaleString()}</span>
                        <span class="product-stock ${stockClass}">${stockText}</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn-add-cart" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                        <a href="product-detail.html?id=${product.id}" class="btn-view" title="View details"><i class="fas fa-eye"></i></a>
                    </div>
                </div>
            </div>`;
    }).join('');
    updateResultsCount(products.length);
}

function toggleFilters() {
    const panel = document.getElementById('filters-panel');
    const btn = document.getElementById('btn-filters');
    panel.classList.toggle('active');
    btn.classList.toggle('active');
}

function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;
    const filtered = allProducts.filter(product => {
        const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm) || (product.description && product.description.toLowerCase().includes(searchTerm)) || (product.category && product.category.toLowerCase().includes(searchTerm));
        const matchesCategory = !category || product.category === category;
        return matchesSearch && matchesCategory;
    });
    renderProducts(filtered);
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;
    const priceMin = parseFloat(document.getElementById('price-min').value) || 0;
    const priceMax = parseFloat(document.getElementById('price-max').value) || Infinity;
    const stockIn = document.getElementById('stock-in').checked;
    const stockLow = document.getElementById('stock-low').checked;
    const stockOut = document.getElementById('stock-out').checked;
    const sortBy = document.getElementById('sort-by').value;
    let filtered = allProducts.filter(product => {
        const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm) || (product.description && product.description.toLowerCase().includes(searchTerm)) || (product.category && product.category.toLowerCase().includes(searchTerm));
        const matchesCategory = !category || product.category === category;
        const matchesPrice = product.price >= priceMin && product.price <= priceMax;
        let matchesStock = false;
        if (stockIn && product.stock > 5) matchesStock = true;
        if (stockLow && product.stock > 0 && product.stock <= 5) matchesStock = true;
        if (stockOut && product.stock === 0) matchesStock = true;
        return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });
    switch(sortBy) {
        case 'price-asc': filtered.sort((a, b) => a.price - b.price); break;
        case 'price-desc': filtered.sort((a, b) => b.price - a.price); break;
        case 'name-asc': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'name-desc': filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
        case 'stock-desc': filtered.sort((a, b) => b.stock - a.stock); break;
    }
    renderProducts(filtered);
    if (window.innerWidth <= 768) { document.getElementById('filters-panel').classList.remove('active'); document.getElementById('btn-filters').classList.remove('active'); }
}

function clearFilters() {
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('stock-in').checked = true;
    document.getElementById('stock-low').checked = false;
    document.getElementById('stock-out').checked = false;
    document.getElementById('sort-by').value = 'default';
    categoryFilter.value = '';
    searchInput.value = '';
    renderProducts(allProducts);
    updateResultsCount(allProducts.length);
    showToast('Filters cleared', 'success');
}

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stock === 0) return;
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.quantity < product.stock) { existingItem.quantity += 1; showToast('Quantity updated in cart!', 'success'); }
        else { showToast('Maximum stock reached!', 'error'); return; }
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, image: product.image_url || product.image || '', quantity: 1 });
        showToast('Item added to cart!', 'success');
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateNavCartCount();
}

function updateNavCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    navCartCount.textContent = totalItems;
}

function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    const btn = document.querySelector(`.product-card[data-id="${productId}"] .wishlist-btn`);
    const icon = btn.querySelector('i');
    if (index > -1) {
        wishlist.splice(index, 1); btn.classList.remove('active'); icon.classList.remove('fas'); icon.classList.add('far');
        showToast('Removed from wishlist', 'success');
    } else {
        wishlist.push(productId); btn.classList.add('active'); icon.classList.remove('far'); icon.classList.add('fas');
        showToast('Added to wishlist', 'success');
    }
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

function updateResultsCount(count) { resultsCount.textContent = count === 1 ? '1 product found' : `${count} products found`; }

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}
