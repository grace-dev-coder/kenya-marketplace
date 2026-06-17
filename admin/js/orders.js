const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';

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

async function loadOrders() {
    const token = getAdminToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    const statusFilter = document.getElementById('statusFilter');
    const status = statusFilter?.value || '';
    
    let url = `${API_BASE_URL}/api/orders/?limit=100`;
    if (status) url += `&status=${status}`;
    
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
                <td>KES ${(order.total_amount || 0).toLocaleString()}</td>
                <td>
                    <select onchange="updateOrderStatus(${order.id}, this.value)" class="status-select">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>${order.shipping_address || '-'}</td>
                <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="viewOrderDetails(${order.id})">View</button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

async function updateOrderStatus(orderId, status) {
    const token = getAdminToken();
    try {
        // NOTE: Backend needs PUT /api/orders/{order_id} endpoint
        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            alert('Order status updated');
        } else {
            const err = await response.json();
            alert('Failed: ' + (err.detail || 'Backend endpoint missing. Add PUT /api/orders/{id}'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function viewOrderDetails(orderId) {
    alert(`Order details for #${orderId} - implement modal or detail page`);
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ordersTable')) {
        loadOrders();
    }
});