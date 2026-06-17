if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

function getAdminToken() {
    return localStorage.getItem('admin_token') || localStorage.getItem('access_token') || localStorage.getItem('token');
}

async function loadVendors() {
    const token = getAdminToken();
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/vendors/`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        const vendors = await response.json();
        const tableBody = document.getElementById('vendorsTable');
        if (!tableBody) return;
        
        if (!vendors || vendors.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;">No vendors found</td></tr>';
            return;
        }
        
        tableBody.innerHTML = vendors.map(vendor => `
            <tr>
                <td>${vendor.id}</td>
                <td>${vendor.business_name || '-'}</td>
                <td>${vendor.user_id || '-'}</td>
                <td>${vendor.kra_pin || '-'}</td>
                <td>${vendor.business_phone || '-'}</td>
                <td>
                    <span class="badge badge-${vendor.is_verified ? 'success' : 'warning'}">
                        ${vendor.is_verified ? 'Verified' : 'Pending'}
                    </span>
                </td>
                <td>${vendor.rating || '-'}</td>
                <td>
                    ${!vendor.is_verified ? 
                        `<button class="btn btn-sm btn-success" onclick="verifyVendor(${vendor.id})">Verify</button>` : 
                        '<span class="text-success"><i class="fas fa-check"></i></span>'
                    }
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading vendors:', error);
    }
}

async function verifyVendor(vendorId) {
    const token = getAdminToken();
    try {
        const response = await fetch(`${API_BASE_URL}/api/vendors/${vendorId}/verify`, {
            method: 'PUT',
            headers: {'Authorization': `Bearer ${token}`}
        });
        
        if (response.ok) {
            loadVendors();
        } else {
            alert('Failed to verify vendor');
        }
    } catch (error) {
        alert('Error verifying vendor: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('vendorsTable')) {
        loadVendors();
    }
});
