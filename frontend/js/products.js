// ============================================
// Kenya Marketplace - Products Page JavaScript
// ============================================

const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';

// State
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

// DOM Elements
const productsGrid = document.getElementById('products-grid');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const cartCount = document.getElementById('cart-count');
const navUser = document.getElementById('nav-user');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('API Base URL:', API_BASE_URL);
    loadProducts();
    updateCartCount();
    checkAuth();
});

// ============================================
// AUTHENTICATION
// ============================================

function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.name) {
        navUser.innerHTML = `
            <span><i class="fas fa-user-circle"></i> ${user.name}</span>
            <button class="btn-logout" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// ============================================
// PRODUCT LOADING
// ============================================

async function loadProducts() {
    console.log('Loading products from:', `${API_BASE_URL}/api/products/`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/`);
        console.log('Products response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('Products loaded:', products.length);
        
        allProducts = products;
        populateCategories(products);
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <h3>Failed to load products</h3>
                <p>${error.message}</p>
                <button onclick="loadProducts()">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>
        `;
    }
}

// ============================================
// CATEGORY FILTER
// ============================================

function populateCategories(products) {
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

// ============================================
// PRODUCT RENDERING
// ============================================

function renderProducts(products) {
    if (products.length === 0) {
        productsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No products found</h3>
                <p>Try adjusting your search or filter criteria.</p>
            </div>
        `;
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
                    ${hasImage 
                        ? `<img src="${imageUrl}" alt="${product.name}" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<i class=\\'fas fa-image placeholder-icon\\'></i>';">`
                        : `<i class="fas fa-image placeholder-icon"></i>`
                    }
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
                        <a href="product-detail.html?id=${product.id}" class="btn-view" title="View details">
                            <i class="fas fa-eye"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// FILTERING
// ============================================

function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;
    
    const filtered = allProducts.filter(product => {
        const matchesSearch = !searchTerm || 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm)) ||
            (product.category && product.category.toLowerCase().includes(searchTerm));
        const matchesCategory = !category || product.category === category;
        return matchesSearch && matchesCategory;
    });
    
    renderProducts(filtered);
}

// Event listeners
searchInput.addEventListener('input', debounce(filterProducts, 300));
categoryFilter.addEventListener('change', filterProducts);

// Debounce helper for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// CART FUNCTIONS
// ============================================

function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || product.stock === 0) return;
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
            showToast('Quantity updated in cart!', 'success');
        } else {
            showToast('Maximum stock reached!', 'error');
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image_url || product.image || '',
            quantity: 1
        });
        showToast('Item added to cart!', 'success');
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = `(${totalItems})`;
}

// ============================================
// WISHLIST FUNCTIONS
// ============================================

function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    const btn = document.querySelector(`.product-card[data-id="${productId}"] .wishlist-btn`);
    const icon = btn.querySelector('i');
    
    if (index > -1) {
        wishlist.splice(index, 1);
        btn.classList.remove('active');
        icon.classList.remove('fas');
        icon.classList.add('far');
        showToast('Removed from wishlist', 'success');
    } else {
        wishlist.push(productId);
        btn.classList.add('active');
        icon.classList.remove('far');
        icon.classList.add('fas');
        showToast('Added to wishlist', 'success');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}