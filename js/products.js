// frontend/js/products.js
const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com/api';

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
        document.getElementById('category-filter')?.addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.loadProducts();
        });

        document.getElementById('min-price')?.addEventListener('input', (e) => {
            this.filters.minPrice = e.target.value ? parseFloat(e.target.value) : null;
            this.loadProducts();
        });

        document.getElementById('max-price')?.addEventListener('input', (e) => {
            this.filters.maxPrice = e.target.value ? parseFloat(e.target.value) : null;
            this.loadProducts();
        });

        document.getElementById('sort-by')?.addEventListener('change', (e) => {
            this.filters.sortBy = e.target.value;
            this.loadProducts();
        });

        document.getElementById('search-btn')?.addEventListener('click', () => {
            this.searchProducts();
        });

        document.getElementById('search-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchProducts();
        });
    }

    async loadProducts() {
        const container = document.getElementById('products-container');
        const loadingEl = document.getElementById('loading');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (container) container.innerHTML = '';

        try {
            const params = new URLSearchParams();
            if (this.filters.category !== 'All Categories') {
                params.append('category', this.filters.category);
            }
            if (this.filters.minPrice) params.append('min_price', this.filters.minPrice);
            if (this.filters.maxPrice) params.append('max_price', this.filters.maxPrice);
            params.append('sort_by', this.filters.sortBy);

            const response = await fetch(`${API_BASE_URL}/products?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.products = await response.json();
            this.renderProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            if (container) {
                container.innerHTML = `
                    <div class="error-message" style="text-align:center; padding:40px; color:#e74c3c;">
                        <p>Failed to load products. Backend may be starting up (takes ~30s on free Render).</p>
                        <button onclick="productManager.loadProducts()" style="padding:10px 20px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer;">Retry</button>
                    </div>
                `;
            }
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    renderProducts() {
        const container = document.getElementById('products-container');
        if (!container) return;

        if (this.products.length === 0) {
            container.innerHTML = '<p class="no-products" style="text-align:center; padding:40px; color:#666;">No products found.</p>';
            return;
        }

        container.innerHTML = this.products.map(product => `
            <div class="product-card" data-id="${product.id}" style="border:1px solid #ddd; border-radius:8px; overflow:hidden; transition:box-shadow 0.3s;">
                <div class="product-image" style="width:100%; height:200px; overflow:hidden;">
                    <img src="${product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                         alt="${product.name}" 
                         style="width:100%; height:100%; object-fit:cover;"
                         onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
                </div>
                <div class="product-info" style="padding:15px;">
                    <h3 style="margin:0 0 10px; font-size:1.1rem;">${product.name}</h3>
                    <p class="category" style="color:#666; font-size:0.9rem;">${product.category}</p>
                    <p class="price" style="font-weight:bold; color:#e67e22; font-size:1.2rem;">KES ${product.price.toLocaleString()}</p>
                    <p class="stock" style="font-size:0.9rem; color:${product.stock > 0 ? '#27ae60' : '#e74c3c'};">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
                </div>
                <div class="product-actions" style="padding:15px; display:flex; gap:10px;">
                    <button onclick="window.location.href='product-detail.html?id=${product.id}'" 
                            style="flex:1; padding:10px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:600;">
                        View Details
                    </button>
                    <button onclick="cartManager.addToCart(${product.id})" 
                            ${product.stock === 0 ? 'disabled' : ''}
                            style="flex:1; padding:10px; background:${product.stock === 0 ? '#95a5a6' : '#27ae60'}; color:white; border:none; border-radius:4px; cursor:${product.stock === 0 ? 'not-allowed' : 'pointer'}; font-weight:600;">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');
    }

    async searchProducts() {
        const query = document.getElementById('search-input')?.value.trim();
        if (!query) {
            this.loadProducts();
            return;
        }

        const container = document.getElementById('products-container');
        const loadingEl = document.getElementById('loading');
        
        if (loadingEl) loadingEl.style.display = 'block';

        try {
            const response = await fetch(`${API_BASE_URL}/products?search=${encodeURIComponent(query)}`);
            
            if (!response.ok) throw new Error('Search failed');
            
            this.products = await response.json();
            this.renderProducts();
        } catch (error) {
            await this.loadProducts();
            this.products = this.products.filter(p => 
                p.name.toLowerCase().includes(query.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
            );
            this.renderProducts();
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }
}

const productManager = new ProductManager();