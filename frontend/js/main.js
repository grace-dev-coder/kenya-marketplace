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

    // Setup mobile menu with multiple event types for reliability
    setupMobileMenu();
});

function setupMobileMenu() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (!mobileBtn || !navLinks) return;
    
    // Remove any existing listeners by cloning and replacing
    const newBtn = mobileBtn.cloneNode(true);
    mobileBtn.parentNode.replaceChild(newBtn, mobileBtn);
    
    // Use pointerdown for universal touch/click support
    newBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileMenu();
    });
    
    // Fallback touch handler
    newBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        toggleMobileMenu();
    }, {passive: false});
    
    // Fallback click handler
    newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleMobileMenu();
    });
    
    // Close menu when clicking outside
    document.addEventListener('pointerdown', (e) => {
        if (navLinks.classList.contains('mobile-open')) {
            if (!navLinks.contains(e.target) && !newBtn.contains(e.target)) {
                navLinks.classList.remove('mobile-open');
                updateMenuIcon(false);
            }
        }
    });
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    const isOpen = navLinks.classList.toggle('mobile-open');
    updateMenuIcon(isOpen);
    
    // Debug
    console.log('Menu toggled:', isOpen, 'Classes:', navLinks.className);
}

function updateMenuIcon(isOpen) {
    const icon = document.querySelector('.mobile-menu-btn i, .mobile-menu-btn svg');
    if (!icon) return;
    
    if (isOpen) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
}

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
