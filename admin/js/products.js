// Use var with check to prevent redeclaration
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

function getAdminToken() {
    return localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
}

function getCategoryName(categoryId) {
    const categories = {
        '1': 'Electronics',
        '2': 'Fashion',
        '3': 'Home & Garden',
        '4': 'Food & Groceries',
        '5': 'Sports'
    };
    return categories[String(categoryId)] || (categoryId || '-');
}

async function loadAdminProducts() {
    const token = getAdminToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/products/?limit=100`, {
            headers: {'Authorization': `Bearer ${token}`}
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const products = await response.json();
        const tableBody = document.getElementById('productsTable');
        if (!tableBody) return;

        if (!products || products.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;">No products found</td></tr>';
            return;
        }

        tableBody.innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td><img src="${product.image_url || 'https://via.placeholder.com/50'}" width="50" height="50" style="object-fit:cover;border-radius:4px;" onerror="this.src='https://via.placeholder.com/50'"></td>
                <td>${product.name}</td>
                <td>KES ${(product.price || 0).toLocaleString()}</td>
                <td>${product.stock || 0}</td>
                <td>${getCategoryName(product.category)}</td>
                <td>${product.vendor_id || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn btn-sm btn-outline" style="color:var(--danger)" onclick="deleteProduct(${product.id})">Delete</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function showAddProductModal() {
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
    
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'flex';
}

function showEditProductModal(product) {
    document.getElementById('modalTitle').textContent = 'Edit Product #' + product.id;
    document.getElementById('productId').value = product.id;
    
    // Pre-fill form
    document.getElementById('prodName').value = product.name || '';
    document.getElementById('prodDesc').value = product.description || '';
    document.getElementById('prodPrice').value = product.price || '';
    document.getElementById('prodStock').value = product.stock || '';
    document.getElementById('prodCategory').value = String(product.category || '');
    document.getElementById('prodVendor').value = product.vendor_id || '';
    
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
}

async function handleAddProduct(e) {
    e.preventDefault();
    const token = getAdminToken();

    const data = {
        name: document.getElementById('prodName').value,
        description: document.getElementById('prodDesc').value,
        price: parseFloat(document.getElementById('prodPrice').value),
        stock: parseInt(document.getElementById('prodStock').value),
        category: document.getElementById('prodCategory').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/products/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal();
            loadAdminProducts();
            document.getElementById('productForm').reset();
        } else {
            const err = await response.json();
            alert('Failed to add product: ' + (err.detail || 'Unknown error'));
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}

async function handleEditProduct(e) {
    e.preventDefault();
    const token = getAdminToken();
    const productId = document.getElementById('productId').value;

    if (!productId) {
        alert('Product ID not found');
        return;
    }

    const data = {
        name: document.getElementById('prodName').value,
        description: document.getElementById('prodDesc').value,
        price: parseFloat(document.getElementById('prodPrice').value),
        stock: parseInt(document.getElementById('prodStock').value),
        category: document.getElementById('prodCategory').value,
        vendor_id: parseInt(document.getElementById('prodVendor').value) || null
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeModal();
            loadAdminProducts();
            alert('Product updated successfully!');
        } else {
            const err = await response.json();
            alert('Failed to update product: ' + (err.detail || 'Unknown error'));
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const token = getAdminToken();
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });

        if (response.ok) {
            loadAdminProducts();
        } else {
            const err = await response.json();
            alert('Failed to delete: ' + (err.detail || 'Unknown error'));
        }
    } catch (error) {
        alert('Error deleting product: ' + error.message);
    }
}

async function editProduct(productId) {
    const token = getAdminToken();
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        if (!response.ok) {
            alert('Failed to load product details');
            return;
        }
        
        const product = await response.json();
        showEditProductModal(product);
        
    } catch (error) {
        alert('Error loading product: ' + error.message);
    }
}

async function importProducts(input) {
    const file = input.files[0];
    if (!file) return;

    const token = getAdminToken();
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/bulk-import/products`, {
            method: 'POST',
            headers: {'Authorization': `Bearer ${token}`},
            body: formData
        });

        const result = await response.json();
        alert(result.message);
        loadAdminProducts();
    } catch (error) {
        alert('Import failed');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsTable')) {
        loadAdminProducts();
    }
    
    // Attach form submit handler
    const form = document.getElementById('productForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            const productId = document.getElementById('productId').value;
            if (productId) {
                handleEditProduct(e);
            } else {
                handleAddProduct(e);
            }
        });
    }
});