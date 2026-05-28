// Dashboard functionality

async function loadDashboardStats() {
    const token = getAdminToken();
    try {
        const response = await fetch('http://localhost:8000/api/admin/dashboard', {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const stats = await response.json();
        
        document.getElementById('totalUsers').textContent = stats.total_users.toLocaleString();
        document.getElementById('totalVendors').textContent = stats.total_vendors.toLocaleString();
        document.getElementById('totalProducts').textContent = stats.total_products.toLocaleString();
        document.getElementById('totalOrders').textContent = stats.total_orders.toLocaleString();
        document.getElementById('totalRevenue').textContent = `KES ${stats.total_revenue.toLocaleString()}`;
        document.getElementById('pendingOrders').textContent = stats.pending_orders.toLocaleString();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentOrders() {
    const token = getAdminToken();
    try {
        const response = await fetch('http://localhost:8000/api/admin/orders?limit=5', {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const orders = await response.json();
        
        document.getElementById('recentOrdersTable').innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>User #${order.user_id}</td>
                <td>KES ${order.total_amount.toLocaleString()}</td>
                <td><span class="badge badge-${getStatusColor(order.status)}">${order.status}</span></td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

function getStatusColor(status) {
    const colors = {
        pending: 'warning',
        paid: 'success',
        shipped: 'info',
        delivered: 'success',
        cancelled: 'danger'
    };
    return colors[status] || 'secondary';
}

async function handleBulkImport(input) {
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
    } catch (error) {
        alert('Import failed');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('totalUsers')) {
        loadDashboardStats();
        loadRecentOrders();
    }
});