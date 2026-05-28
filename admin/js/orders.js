// Orders management

async function loadOrders() {
    const token = getAdminToken();
    const status = document.getElementById('statusFilter')?.value || '';
    
    let url = 'http://localhost:8000/api/admin/orders?limit=100';
    if (status) url += `&status=${status}`;
    
    try {
        const response = await fetch(url, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        const orders = await response.json();
        
        document.getElementById('ordersTable').innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id}</td>
                <td>${order.user_id}</td>
                <td>KES ${order.total_amount.toLocaleString()}</td>
                <td>
                    <select onchange="updateOrderStatus(${order.id}, this.value)" class="status-select">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>${order.shipping_address}</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
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
        await fetch(`http://localhost:8000/api/admin/orders/${orderId}/status?status=${status}`, {
            method: 'PUT',
            headers: {'Authorization': `Bearer ${token}`}
        });
        alert('Order status updated');
    } catch (error) {
        alert('Error updating status');
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