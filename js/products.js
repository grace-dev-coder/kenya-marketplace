const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com/api';

// Demo products that show immediately if API fails/sleeps
const DEMO_PRODUCTS = [
    {id: 1, name: "Samsung Galaxy A54", description: "6.4 AMOLED, 128GB, 5000mAh", price: 45000, category: "Electronics", stock: 15, image_url: "https://images.unsplash.com/photo-1610945265078-3858a0828671?w=400"},
    {id: 2, name: "Nike Air Force 1", description: "Classic white sneakers, size 40-45", price: 8500, category: "Fashion", stock: 30, image_url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400"},
    {id: 3, name: "Solar Lamp with USB", description: "Solar powered lamp, M-Pesa enabled", price: 2500, category: "Home", stock: 50, image_url: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400"},
    {id: 4, name: "Maize Flour (Ugali) 2kg", description: "Premium grade maize flour", price: 180, category: "Food", stock: 100, image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"},
    {id: 5, name: "Kenyan Coffee Beans 1kg", description: "Arabica coffee from Nyeri region", price: 1200, category: "Food", stock: 40, image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400"},
    {id: 6, name: "Wireless Bluetooth Speaker", description: "Portable, 12hr battery", price: 3500, category: "Electronics", stock: 25, image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"},
    {id: 7, name: "Kitenge Fabric Dress", description: "Traditional African print", price: 2800, category: "Fashion", stock: 20, image_url: "https://images.unsplash.com/photo-1595777457583-95ce0599ab70?w=400"},
    {id: 8, name: "Running Shoes - Kenyan Edition", description: "Lightweight running shoes", price: 6500, category: "Sports", stock: 35, image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"},
];

class ProductManager {
    constructor() {
        this.products = [];
        this.filters = {
            category: 'All Categories',
            minPrice: null,
            maxPrice: null,
            sortBy: 'newest'
        };
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

    async loadProducts() {
        const container = document.getElementById('products-container');
        const loadingEl = document.getElementById('loading');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (container) container.innerHTML = '';

        // Show demo products immediately (no wait)
        let filtered = [...DEMO_PRODUCTS];

        // Apply filters
        const cat = document.getElementById('category-filter')?.value || 'All Categories';
        const minP = parseFloat(document.getElementById('min-price')?.value) || null;
        const maxP = parseFloat(document.getElementById('max-price')?.value) || null;

        if (cat !== 'All Categories') {
            filtered = filtered.filter(p => p.category === cat);
        }
        if (minP !== null) filtered = filtered.filter(p => p.price >= minP);
        if (maxP !== null) filtered = filtered.filter(p => p.price <= maxP);

        this.products = filtered;
        this.renderProducts();
        if (loadingEl) loadingEl.style.display = 'none';

        // Try API in background (with timeout for Render free tier cold start)
        this.fetchFromAPI();
    }

    async fetchFromAPI() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

            const response = await fetch(`${API_BASE_URL}/products`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const apiProducts = await response.json();
                if (apiProducts && apiProducts.length > 0) {
                    this.products = apiProducts;
                    this.renderProducts();
                    console.log('Loaded from API');
                }
            }
        } catch (e) {
            console.log('API unavailable (Render sleeping or CORS):', e.message);
            // Demo products already showing, no action needed
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
            <div class="product-card" style="border:1px solid #ddd; border-radius:8px; overflow:hidden; background:white; margin-bottom:15px;">
                <div style="width:100%; height:200px; overflow:hidden;">
                    <img src="${product.image_url || 'https://via.placeholder.com/400x300'}" 
                         alt="${product.name}" 
                         style="width:100%; height:100%; object-fit:cover;"
                         onerror="this.src='https://via.placeholder.com/400x300'">
                </div>
                <div style="padding:15px;">
                    <h3 style="margin:0 0 8px; font-size:1.1rem; color:#2c3e50;">${product.name}</h3>
                    <p style="color:#666; font-size:0.85rem; margin:0 0 8px;">${product.description || ''}</p>
                    <p style="font-weight:bold; color:#e67e22; font-size:1.2rem; margin:0 0 8px;">KES ${product.price.toLocaleString()}</p>
                    <p style="font-size:0.85rem; color:${product.stock > 0 ? '#27ae60' : '#e74c3c'}; margin:0 0 12px;">
                        ${product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                    </p>
                    <div style="display:flex; gap:10px;">
                        <button onclick="window.location.href='product-detail.html?id=${product.id}'" 
                                style="flex:1; padding:10px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:600;">
                            View
                        </button>
                        <button onclick="alert('Added to cart!')" 
                                ${product.stock === 0 ? 'disabled' : ''}
                                style="flex:1; padding:10px; background:${product.stock === 0 ? '#95a5a6' : '#27ae60'}; color:white; border:none; border-radius:4px; cursor:${product.stock === 0 ? 'not-allowed' : 'pointer'}; font-weight:600;">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

const productManager = new ProductManager();
