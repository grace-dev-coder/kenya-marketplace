if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

let salesChartInstance = null;

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

function formatKES(amount) {
    return 'KES ' + (amount || 0).toLocaleString('en-KE');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status) {
    const colors = {
        'pending': 'badge-warning',
        'processing': 'badge-info',
        'shipped': 'badge-primary',
        'delivered': 'badge-success',
        'cancelled': 'badge-danger'
    };
    return `<span class="badge ${colors[status] || 'badge-secondary'}">${status || 'unknown'}</span>`;
}

function getPaymentBadge(status) {
    const colors = {
        'pending': 'badge-warning',
        'success': 'badge-success',
        'failed': 'badge-danger',
        'paid': 'badge-success'
    };
    return `<span class="badge ${colors[status] || 'badge-secondary'}">${status || 'pending'}</span>`;
}

async function loadAnalytics() {
    const token = getAdminToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch all data in parallel
        const [statsRes, salesRes, topRes, ordersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/api/admin/sales-chart`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/api/admin/top-products`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/api/admin/recent-orders`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (statsRes.status === 401) { logout(); return; }

        const stats = await statsRes.json();
        const sales = await salesRes.json();
        const topProducts = await topRes.json();
        const recentOrders = await ordersRes.json();

        // Update stat cards
        document.getElementById('monthRevenue').textContent = formatKES(stats.month_revenue);
        document.getElementById('monthOrders').textContent = stats.orders || 0;
        document.getElementById('totalUsers').textContent = stats.users || 0;
        document.getElementById('totalProducts').textContent = stats.products || 0;
        document.getElementById('totalRevenue').textContent = formatKES(stats.total_revenue);
        document.getElementById('pendingOrders').textContent = stats.pending_orders || 0;

        // Render sales chart
        renderSalesChart(sales.labels, sales.data);

        // Render top products
        renderTopProducts(topProducts);

        // Render recent orders
        renderRecentOrders(recentOrders);

    } catch (error) {
        console.error('Error loading analytics:', error);
        showToast('Failed to load analytics data', 'error');
    }
}

function renderSalesChart(labels, data) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue (KES)',
                data: data,
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#1976d2'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'KES ' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function renderTopProducts(products) {
    const container = document.getElementById('topProductsList');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">No sales data yet</p>';
        return;
    }

    container.innerHTML = products.map((p, i) => `
        <div class="top-product-item" style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">
            <span style="font-weight: bold; color: #666; width: 24px;">${i + 1}</span>
            <img src="${p.image_url || 'https://via.placeholder.com/40?text=No+Image'}" 
                 alt="${p.name}" 
                 style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 12px;"
                 onerror="this.src='https://via.placeholder.com/40?text=No+Image'">
            <div style="flex: 1;">
                <div style="font-weight: 500;">${p.name}</div>
                <div style="font-size: 0.85em; color: #888;">${p.total_sold || 0} sold</div>
            </div>
            <div style="font-weight: 600; color: #1976d2;">${formatKES(p.price)}</div>
        </div>
    `).join('');
}

function renderRecentOrders(orders) {
    const tableBody = document.getElementById('recentOrdersTable');
    if (!tableBody) return;

    if (!orders || orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">No orders yet</td></tr>';
        return;
    }

    tableBody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer_name || 'Guest'}</td>
            <td>${formatKES(order.total_amount)}</td>
            <td>${getStatusBadge(order.status)}</td>
            <td>${getPaymentBadge(order.payment_status || order.status)}</td>
            <td>${formatDate(order.created_at)}</td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', loadAnalytics);