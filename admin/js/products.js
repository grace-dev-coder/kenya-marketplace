// Use var with check to prevent redeclaration
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

let allProducts = [];
let productToDelete = null;

function getAdminToken() {
    return localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
}

function getCategoryName(categoryId) {
    const categories = {
        '1': 'Electronics', '2': 'Fashion', '3': 'Home & Garden',
        '4': 'Food & Groceries', '5': 'Sports',
        'Electronics': 'Electronics', 'Fashion': 'Fashion',
        'Home & Garden': 'Home & Garden', 'Food & Groceries': 'Food & Groceries',
        'Sports': 'Sports', 'Beauty': 'Beauty', 'Books': 'Books', 'Other': 'Other'
    };
    return categories[String(categoryId)] || (categoryId || '-');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
        toast.className = 'toast';
    }, 3000);
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
        allProducts = products || [];
        renderProductsTable(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        const tableBody = document.getElementById('productsTable');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#e74c3c;">Failed to load products. Check console.</td></tr>';
        }
    }
}

function renderProductsTable(products) {
    const tableBody = document.getElementById('productsTable');
    if (!tableBody) return;

    if (!products || products.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;">No products found</td></tr>';
        return;
    }

    tableBody.innerHTML = products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>
                <img src="${product.image_url || 'https://via.placeholder.com/50?text=No+Image'}" 
                     alt="${product.name}" 
                     width="50" height="50" 
                     style="object-fit:cover;border-radius:4px;"
                     onerror="this.src='https://via.placeholder.com/50?text=No+Image'">
            </td>
            <td>${product.name}</td>
            <td>KES ${product.price ? product.price.toLocaleString() : '0'}</td>
            <td>
                <span class="badge ${product.stock > 10 ? 'badge-success' : product.stock > 0 ? 'badge-warning' : 'badge-danger'}">
                    ${product.stock || 0}
                </span>
            </td>
            <td>${getCategoryName(product.category)}</td>
            <td>${product.vendor_name || product.vendor_id || 'Admin'}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="showEditProductModal(${product.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="showDeleteModal(${product.id}, '${product.name.replace(/'/g, "\\'")}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterProducts() {
    const search = document.getElementById('productSearch').value.toLowerCase();
    const filtered = allProducts.filter(p => 
        (p.name && p.name.toLowerCase().includes(search)) ||
        (p.category && p.category.toLowerCase().includes(search)) ||
        (p.description && p.description.toLowerCase().includes(search))
    );
    renderProductsTable(filtered);
}

function showAddProductModal() {
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('saveBtn').textContent = 'Save Product';
    document.getElementById('productModal').style.display = 'flex';
}

async function showEditProductModal(productId) {
    const token = getAdminToken();
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        if (!response.ok) throw new Error('Failed to fetch product');
        
        const product = await response.json();
        
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('prodName').value = product.name || '';
        document.getElementById('prodDesc').value = product.description || '';
        document.getElementById('prodImage').value = product.image_url || '';
        document.getElementById('prodPrice').value = product.price || '';
        document.getElementById('prodStock').value = product.stock !== undefined ? product.stock : '';
        document.getElementById('prodCategory').value = product.category || '';
        document.getElementById('prodVendor').value = product.vendor_id || '';
        document.getElementById('saveBtn').textContent = 'Update Product';
        document.getElementById('productModal').style.display = 'flex';
    } catch (error) {
        console.error('Error loading product:', error);
        showToast('Failed to load product details', 'error');
    }
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

function handleFormSubmit(event) {
    event.preventDefault();
    const productId = document.getElementById('productId').value;
    if (productId) {
        handleEditProduct(productId);
    } else {
        handleAddProduct();
    }
}

async function handleAddProduct() {
    const token = getAdminToken();
    if (!token) {
        showToast('Please login first', 'error');
        return;
    }

    const data = {
        name: document.getElementById('prodName').value.trim(),
        description: document.getElementById('prodDesc').value.trim(),
        price: parseFloat(document.getElementById('prodPrice').value),
        stock: parseInt(document.getElementById('prodStock').value),
        category: document.getElementById('prodCategory').value,
        image_url: document.getElementById('prodImage').value.trim() || null
    };

    const vendorId = document.getElementById('prodVendor').value;
    if (vendorId) {
        data.vendor_id = parseInt(vendorId);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/products/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to add product');
        }

        showToast('Product added successfully!');
        closeModal();
        loadAdminProducts();
    } catch (error) {
        console.error('Error adding product:', error);
        showToast(error.message || 'Failed to add product', 'error');
    }
}

async function handleEditProduct(productId) {
    const token = getAdminToken();
    if (!token) {
        showToast('Please login first', 'error');
        return;
    }

    const data = {
        name: document.getElementById('prodName').value.trim(),
        description: document.getElementById('prodDesc').value.trim(),
        price: parseFloat(document.getElementById('prodPrice').value),
        stock: parseInt(document.getElementById('prodStock').value),
        category: document.getElementById('prodCategory').value,
        image_url: document.getElementById('prodImage').value.trim() || null
    };

    const vendorId = document.getElementById('prodVendor').value;
    if (vendorId) {
        data.vendor_id = parseInt(vendorId);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Failed to update product');
        }

        showToast('Product updated successfully!');
        closeModal();
        loadAdminProducts();
    } catch (error) {
        console.error('Error updating product:', error);
        showToast(error.message || 'Failed to update product', 'error');
    }
}

function showDeleteModal(productId, productName) {
    productToDelete = productId;
    document.getElementById('deleteProductName').textContent = productName;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    productToDelete = null;
    document.getElementById('deleteModal').style.display = 'none';
}

async function confirmDelete() {
    if (!productToDelete) return;
    
    const token = getAdminToken();
    try {
        const response = await fetch(`${API_BASE_URL}/api/products/${productToDelete}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });

        if (!response.ok) throw new Error('Failed to delete product');

        showToast('Product deleted successfully!');
        closeDeleteModal();
        loadAdminProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Failed to delete product', 'error');
    }
}

async function importProducts(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const lines = e.target.result.split('\n');
        const token = getAdminToken();
        let added = 0;
        let failed = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = line.split(',');
            if (cols.length < 4) continue;

            const data = {
                name: cols[0].trim(),
                description: cols[1].trim(),
                price: parseFloat(cols[2]),
                stock: parseInt(cols[3]) || 0,
                category: cols[4] || 'Other',
                image_url: cols[5] ? cols[5].trim() : null
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
                if (response.ok) added++;
                else failed++;
            } catch (err) {
                failed++;
            }
        }

        showToast(`Import complete: ${added} added, ${failed} failed`);
        loadAdminProducts();
    };
    reader.readAsText(file);
    input.value = '';
}

// Close modals on outside click
window.onclick = function(event) {
    const productModal = document.getElementById('productModal');
    const deleteModal = document.getElementById('deleteModal');
    if (event.target === productModal) closeModal();
    if (event.target === deleteModal) closeDeleteModal();
};

// Load products on page load
document.addEventListener('DOMContentLoaded', loadAdminProducts);