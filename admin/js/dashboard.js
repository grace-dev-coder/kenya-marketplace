if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

function getAdminToken() {
    return localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; toast.className = 'toast'; }, 3000);
}

function getStatusBadge(status) {
    const colors = {
        pending: 'badge-warning',
        paid: 'badge-success',
        shipped: 'badge-info',
        delivered: 'badge-success',
        cancelled: 'badge-danger'
    };
    return `<span class="badge ${colors[status] || 'badge-secondary'}">${status || 'pending'}</span>`;
}

function formatKES(amount) {
    return 'KES ' + (amount || 0).toLocaleString('en-KE');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
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

        if (totalUsers) totalUsers.textContent = (stats.users || 0).toLocaleString();
        if (totalVendors) totalVendors.textContent = (stats.total_vendors || stats.vendors || 0).toLocaleString();
        if (totalProducts) totalProducts.textContent = (stats.products || 0).toLocaleString();
        if (totalOrders) totalOrders.textContent = (stats.orders || 0).toLocaleString();
        if (totalRevenue) totalRevenue.textContent = formatKES(stats.total_revenue);
        if (pendingOrders) pendingOrders.textContent = (stats.pending_orders || 0).toLocaleString();

    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Failed to load dashboard stats', 'error');
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
                <td>${formatKES(order.total_amount)}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${formatDate(order.created_at)}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading recent orders:', error);
        const tableBody = document.getElementById('recentOrdersTable');
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;">Failed to load orders</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('totalUsers')) {
        loadDashboardStats();
        loadRecentOrders();
    }
});