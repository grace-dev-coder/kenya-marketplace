// Users management

let allUsers = [];

async function loadUsers() {
    const token = getAdminToken();
    try {
        const response = await fetch('http://localhost:8000/api/admin/users?limit=100', {
            headers: {'Authorization': `Bearer ${token}`}
        });
        allUsers = await response.json();
        renderUsers(allUsers);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers(users) {
    document.getElementById('usersTable').innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.full_name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td><span class="badge badge-${getRoleColor(user.role)}">${user.role}</span></td>
            <td>
                <span class="badge badge-${user.is_active ? 'success' : 'danger'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm ${user.is_active ? 'btn-outline' : 'btn-success'}" 
                        onclick="toggleUser(${user.id})">
                    ${user.is_active ? 'Deactivate' : 'Activate'}
                </button>
            </td>
        </tr>
    `).join('');
}

function getRoleColor(role) {
    const colors = { admin: 'danger', vendor: 'warning', customer: 'success' };
    return colors[role] || 'secondary';
}

function filterUsers() {
    const query = document.getElementById('userSearch').value.toLowerCase();
    const filtered = allUsers.filter(user => 
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.includes(query)
    );
    renderUsers(filtered);
}

async function toggleUser(userId) {
    const token = getAdminToken();
    try {
        await fetch(`http://localhost:8000/api/admin/users/${userId}/toggle`, {
            method: 'PUT',
            headers: {'Authorization': `Bearer ${token}`}
        });
        loadUsers();
    } catch (error) {
        alert('Error updating user');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('usersTable')) {
        loadUsers();
    }
});