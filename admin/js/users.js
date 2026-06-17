const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';

function getAdminToken() {
    return localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
}

let allUsers = [];

function getRoleColor(role) {
    const colors = { admin: 'danger', vendor: 'warning', customer: 'success' };
    return colors[role] || 'secondary';
}

async function loadUsers() {
    const token = getAdminToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users?limit=100`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        allUsers = await response.json();
        renderUsers(allUsers);
        
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers(users) {
    const tableBody = document.getElementById('usersTable');
    if (!tableBody) return;
    
    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;">No users found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.full_name || user.name || '-'}</td>
            <td>${user.email || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td><span class="badge badge-${getRoleColor(user.role)}">${user.role || 'customer'}</span></td>
            <td>
                <span class="badge badge-${user.is_active ? 'success' : 'danger'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
            <td>
                <button class="btn btn-sm ${user.is_active ? 'btn-outline' : 'btn-success'}" 
                        onclick="toggleUser(${user.id})">
                    ${user.is_active ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        </tr>
    `).join('');
}

function filterUsers() {
    const searchInput = document.getElementById('userSearch');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase();
    const filtered = allUsers.filter(user => 
        (user.full_name || user.name || '').toLowerCase().includes(query) ||
        (user.email || '').toLowerCase().includes(query) ||
        (user.phone || '').includes(query)
    );
    renderUsers(filtered);
}

async function toggleUser(userId) {
    const token = getAdminToken();
    try {
        // NOTE: Backend needs PUT /api/admin/users/{user_id}/toggle endpoint
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/toggle`, {
            method: 'PUT',
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        if (response.ok) {
            loadUsers();
        } else {
            const err = await response.json();
            alert('Failed: ' + (err.detail || 'Backend endpoint missing'));
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('usersTable')) {
        loadUsers();
    }
});