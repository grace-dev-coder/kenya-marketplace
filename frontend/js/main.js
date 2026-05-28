// Main JavaScript for Kenya Marketplace

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
});

function searchProducts() {
    const query = document.getElementById('searchInput').value.trim();
    if (query) {
        window.location.href = `products.html?search=${encodeURIComponent(query)}`;
    }
}

function toggleMobileMenu() {
    // Mobile menu toggle implementation
    alert('Mobile menu - implement as needed');
}