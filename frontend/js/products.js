const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com/api';

const DEMO_PRODUCTS = [
    {id: 1, name: "Samsung Galaxy A54", description: "6.4 AMOLED, 128GB, 5000mAh", price: 45000, category: "Electronics", stock: 15, image_url: "https://images.unsplash.com/photo-1610945265078-3858a0828671?w=400&auto=format&fit=crop", created_at: "2024-01-15"},
    {id: 2, name: "Nike Air Force 1", description: "Classic white sneakers, size 40-45", price: 8500, category: "Fashion", stock: 30, image_url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&auto=format&fit=crop", created_at: "2024-02-10"},
    {id: 3, name: "Solar Lamp with USB", description: "Solar powered lamp, M-Pesa enabled", price: 2500, category: "Home", stock: 50, image_url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&auto=format&fit=crop", created_at: "2024-01-20"},
    {id: 4, name: "Maize Flour (Ugali) 2kg", description: "Premium grade maize flour", price: 180, category: "Food", stock: 100, image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop", created_at: "2024-03-01"},
    {id: 5, name: "Kenyan Coffee Beans 1kg", description: "Arabica coffee from Nyeri region", price: 1200, category: "Food", stock: 40, image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop", created_at: "2024-02-28"},
    {id: 6, name: "Wireless Bluetooth Speaker", description: "Portable, 12hr battery", price: 3500, category: "Electronics", stock: 25, image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&auto=format&fit=crop", created_at: "2024-01-05"},
    {id: 7, name: "Kitenge Fabric Dress", description: "Traditional African print", price: 2800, category: "Fashion", stock: 20, image_url: "https://images.unsplash.com/photo-1595777457583-95ce0599ab70?w=400&auto=format&fit=crop", created_at: "2024-03-10"},
    {id: 8, name: "Running Shoes - Kenyan Edition", description: "Lightweight running shoes", price: 6500, category: "Sports", stock: 35, image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop", created_at: "2024-02-15"},
];

class ProductManager {
    constructor() {
        this.products = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadProducts();
    }

    bindEvents() {
        document.getElementById('category-filter')?.addEventListener('change', () => this.loadProducts());
        document.getElementById('min-price')?.addEventListener('input', () => this.loadProducts());
        document.getElementById('max-price')?.addEventListener('input', () => this.loadProducts());
        document.getElementById('sort-by')?.addEventListener('change', () => this.loadProducts());
        document.getElementById('apply-filters')?.addEventListener('click', () => this.loadProducts());
        document.getElementById('clear-filters')?.addEventListener('click', () => {
            document.getElementById('category-filter').value = 'All Categories';
            document.getElementById('min-price').value = '';
            document.getElementById('max-price').value = '';
            document.getElementById('sort-by').value = 'newest';
            this.loadProducts();
        });
    }

    loadProducts() {
        const container = document.getElementById('products-container');
        const loadingEl = document.getElementById('loading');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (container) container.innerHTML = '';

        let filtered = [...DEMO_PRODUCTS];

        // ─── FILTER BY CATEGORY ──────────────────────────────────────
        const cat = document.getElementById('category-filter')?.value || 'All Categories';
        if (cat !== 'All Categories') {
            filtered = filtered.filter(p => p.category === cat);
        }

        // ─── FILTER BY PRICE ───────────────────────────────────────────
        const minP = parseFloat(document.getElementById('min-price')?.value);
        const maxP = parseFloat(document.getElementById('max-price')?.value);
        if (!isNaN(minP) && minP > 0) {
            filtered = filtered.filter(p => p.price >= minP);
        }
        if (!isNaN(maxP) && maxP > 0) {
            filtered = filtered.filter(p => p.price <= maxP);
        }

        // ─── SORT ────────────────────────────────────────────────────
        const sortBy = document.getElementById('sort-by')?.value || 'newest';
        switch (sortBy) {
            case 'price_low':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price_high':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }

        this.products = filtered;
        this.renderProducts();
        if (loadingEl) loadingEl.style.display = 'none';

        this.fetchFromAPI();
    }

    async fetchFromAPI() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const response = await fetch(`${API_BASE_URL}/products`, {signal: controller.signal});
            clearTimeout(timeoutId);
            if (response.ok) {
                const apiProducts = await response.json();
                if (apiProducts && apiProducts.length > 0) {
                    // Apply same filters/sort to API results
                    let filtered = [...apiProducts];
                    
                    const cat = document.getElementById('category-filter')?.value || 'All Categories';
                    const minP = parseFloat(document.getElementById('min-price')?.value);
                    const maxP = parseFloat(document.getElementById('max-price')?.value);
                    const sortBy = document.getElementById('sort-by')?.value || 'newest';
                    
                    if (cat !== 'All Categories') filtered = filtered.filter(p => p.category === cat);
                    if (!isNaN(minP) && minP > 0) filtered = filtered.filter(p => p.price >= minP);
                    if (!isNaN(maxP) && maxP > 0) filtered = filtered.filter(p => p.price <= maxP);
                    
                    switch (sortBy) {
                        case 'price_low': filtered.sort((a, b) => a.price - b.price); break;
                        case 'price_high': filtered.sort((a, b) => b.price - a.price); break;
                        case 'newest': default: filtered.sort((a, b) => (b.id || 0) - (a.id || 0)); break;
                    }
                    
                    this.products = filtered;
                    this.renderProducts();
                }
            }
        } catch (e) {
            console.log('API not ready:', e.message);
        }
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;
        if (this.products.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:40px; color:#666;">No products match your filters.</p>';
            return;
        }
        container.innerHTML = this.products.map(product => `
            <div style="border:1px solid #ddd; border-radius:8px; overflow:hidden; background:white; margin-bottom:15px;">
                <div style="width:100%; height:200px; overflow:hidden; background:#f0f0f0; display:flex; align-items:center; justify-content:center;">
                    <img src="${product.image_url || ''}" 
                         alt="${product.name}" 
                         style="width:100%; height:100%; object-fit:cover;"
                         onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'font-size:60px;\\'>📦</div>';"
                         loading="lazy"
                         crossorigin="anonymous">
                </div>
                <div style="padding:15px;">
                    <h3 style="margin:0 0 8px; font-size:1.1rem;">${product.name}</h3>
                    <p style="color:#666; font-size:0.85rem;">${product.description || ''}</p>
                    <p style="font-weight:bold; color:#e67e22; font-size:1.2rem;">KES ${product.price.toLocaleString()}</p>
                    <p style="font-size:0.85rem; color:${product.stock > 0 ? '#27ae60' : '#e74c3c'};">
                        ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </p>
                    <div style="display:flex; gap:10px; margin-top:10px;">
                        <button onclick="window.location.href='product-detail.html?id=${product.id}'" 
                                style="flex:1; padding:10px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer;">View</button>
                        <button onclick="addToCart(${product.id})" 
                                ${product.stock === 0 ? 'disabled' : ''}
                                style="flex:1; padding:10px; background:${product.stock === 0 ? '#95a5a6' : '#27ae60'}; color:white; border:none; border-radius:4px; cursor:${product.stock === 0 ? 'not-allowed' : 'pointer'};">Add to Cart</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// GLOBAL addToCart function
function addToCart(productId) {
    const product = DEMO_PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert(`Added ${product.name} to cart!`);
}

// GLOBAL updateCartCount function
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cartCount, #cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

document.addEventListener('DOMContentLoaded', updateCartCount);

const productManager = new ProductManager();