// admin/js/admin-auth.js - Admin Authentication

const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com/api';

function getAdminToken() {
    return localStorage.getItem('adminToken') || localStorage.getItem('token');
}

function getAdminUser() {
    const user = localStorage.getItem('adminUser') || localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

function checkAdminAuth() {
    const token = getAdminToken();
    const user = getAdminUser();
    
    // Backend uses is_admin boolean, not role string
    if (!token || !user || !user.is_admin) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Handle admin login form
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('adminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleAdminLogin);
    }
});

async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error-message');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (errorDiv) errorDiv.style.display = 'none';
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 404) {
                showError('Admin not found. Please register first.');
                return;
            }
            throw new Error(data.detail || 'Login failed');
        }
        
        // Check if user is admin
        if (!data.user.is_admin) {
            showError('Access denied. You are not an administrator.');
            return;
        }
        
        // Save admin session
        localStorage.setItem('adminToken', data.access_token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        showSuccess('Login successful! Redirecting...');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        showError(error.message || 'Network error. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login to Dashboard';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = '❌ ' + message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.background = '#fdeaea';
        errorDiv.style.padding = '12px';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.marginBottom = '15px';
    }
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = '✅ ' + message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#27ae60';
        errorDiv.style.background = '#e8f8f5';
        errorDiv.style.padding = '12px';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.marginBottom = '15px';
    }
}
