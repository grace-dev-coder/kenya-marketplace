if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

let currentOrderId = null;

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

async function loadOrders() {
    const token = getAdminToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const statusFilter = document.getElementById('statusFilter');
    const status = statusFilter?.value || '';

    let url = `${API_BASE_URL}/api/orders/`;
    if (status) url += `?status=${status}`;

    try {
        const response = await fetch(url, {
            headers: {'Authorization': `Bearer ${token}`}
        });

        if (response.status === 401) {
            logout();
            return;
        }

        const orders = await response.json();
        const tableBody = document.getElementById('ordersTable');
        if (!tableBody) return;

        if (!orders || orders.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">No orders found</td></tr>';
            return;
        }

        tableBody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.user_id || '-'}</td>
                <td>${formatKES(order.total_amount)}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${order.shipping_address || '-'}</td>
                <td>${formatDate(order.created_at)}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="showStatusModal(${order.id}, '${order.status}')" title="Change Status">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info" onclick="viewOrderDetails(${order.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading orders:', error);
        const tableBody = document.getElementById('ordersTable');
        if (tableBody) tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#e74c3c;">Failed to load orders</td></tr>';
    }
}

function showStatusModal(orderId, currentStatus) {
    currentOrderId = orderId;
    document.getElementById('updateOrderId').textContent = orderId;
    document.getElementById('newStatus').value = currentStatus;
    document.getElementById('statusModal').style.display = 'flex';
}

function closeStatusModal() {
    currentOrderId = null;
    document.getElementById('statusModal').style.display = 'none';
}

async function confirmUpdateStatus() {
    if (!currentOrderId) return;
    
    const newStatus = document.getElementById('newStatus').value;
    const token = getAdminToken();

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/${currentOrderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showToast('Order status updated successfully!');
            closeStatusModal();
            loadOrders();
        } else {
            const err = await response.json();
            showToast('Failed: ' + (err.detail || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error: ' + error.message, 'error');
    }
}

function viewOrderDetails(orderId) {
    alert(`Order details for #${orderId} - implement modal or detail page`);
}

window.onclick = function(event) {
    const modal = document.getElementById('statusModal');
    if (event.target === modal) closeStatusModal();
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ordersTable')) {
        loadOrders();
    }
});