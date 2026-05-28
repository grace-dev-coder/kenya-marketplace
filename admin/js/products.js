// Products management

async function loadAdminProducts() {
    const token = getAdminToken();
    try {
        const response = await fetch('http://localhost:8000/api/products/?limit=100', {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const products = await response.json();
        
        document.getElementById('productsTable').innerHTML = products.map(product => `
            <tr>
                <td>${product.id}</td>
                <td><img src="${product.images || 'https://via.placeholder.com/50'}" width="50" height="50" style="object-fit:cover;border-radius:4px;"></td>
                <td>${product.name}</td>
                <td>KES ${product.price.toLocaleString()}</td>
                <td>${product.stock_quantity}</td>
                <td>${product.category_name}</td>
                <td>${product.vendor_name}</td>
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
    document.getElementById('productModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

async function handleAddProduct(e) {
    e.preventDefault();
    const token = getAdminToken();
    
    const data = {
        name: document.getElementById('prodName').value,
        description: document.getElementById('prodDesc').value,
        price: parseFloat(document.getElementById('prodPrice').value),
        stock_quantity: parseInt(document.getElementById('prodStock').value),
        category_id: parseInt(document.getElementById('prodCategory').value)
    };
    
    try {
        const response = await fetch('http://localhost:8000/api/products/', {
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
            document.getElementById('addProductForm').reset();
        } else {
            alert('Failed to add product');
        }
    } catch (error) {
        alert('Network error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const token = getAdminToken();
    try {
        await fetch(`http://localhost:8000/api/products/${productId}`, {
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });
        loadAdminProducts();
    } catch (error) {
        alert('Error deleting product');
    }
}

async function importProducts(input) {
    const file = input.files[0];
    if (!file) return;
    
    const token = getAdminToken();
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('http://localhost:8000/api/admin/bulk-import/products', {
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

function editProduct(productId) {
    alert('Edit functionality - implement as needed');
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('productsTable')) {
        loadAdminProducts();
    }
});