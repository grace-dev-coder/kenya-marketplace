// Check if API_BASE_URL already exists
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

function getAdminToken() {
    return localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
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

async function loadDashboardStats() {
    const token = getAdminToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
            headers: {'Authorization': `Bearer ${token}`}
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const stats = await response.json();

        const totalUsers = document.getElementById('totalUsers');
        const totalVendors = document.getElementById('totalVendors');
        const totalProducts = document.getElementById('totalProducts');
        const totalOrders = document.getElementById('totalOrders');
        const totalRevenue = document.getElementById('totalRevenue');
        const pendingOrders = document.getElementById('pendingOrders');

        if (totalUsers) totalUsers.textContent = (stats.total_users || 0).toLocaleString();
        if (totalVendors) totalVendors.textContent = (stats.total_vendors || 0).toLocaleString();
        if (totalProducts) totalProducts.textContent = (stats.total_products || 0).toLocaleString();
        if (totalOrders) totalOrders.textContent = (stats.total_orders || 0).toLocaleString();
        if (totalRevenue) totalRevenue.textContent = `KES ${(stats.total_revenue || 0).toLocaleString()}`;
        if (pendingOrders) pendingOrders.textContent = (stats.pending_orders || 0).toLocaleString();

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentOrders() {
    const token = getAdminToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/?limit=5`, {
            headers: {'Authorization': `Bearer ${token}`}
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const orders = await response.json();
        const tableBody = document.getElementById('recentOrdersTable');
        if (!tableBody) return;

        if (!orders || orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">No orders yet</td></tr>';
            return;
        }

        tableBody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>User #${order.user_id || '-'}</td>
                <td>KES ${(order.total_amount || 0).toLocaleString()}</td>
                <td><span class="badge badge-${getStatusColor(order.status)}">${order.status || 'pending'}</span></td>
                <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('totalUsers')) {
        loadDashboardStats();
        loadRecentOrders();
    }
});
