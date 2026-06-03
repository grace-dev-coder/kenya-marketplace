// js/auth.js - Authentication with registration enforcement

const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com/api';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.background = '#fdeaea';
        errorDiv.style.border = '1px solid #e74c3c';
    }
}

// Show success message
function showSuccess(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#27ae60';
        errorDiv.style.background = '#e8f8f5';
        errorDiv.style.border = '1px solid #27ae60';
    }
}

// Clear messages
function clearMessage() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    clearMessage();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('button[type="submit"]');
    
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
            // User not found - force redirect to register
            if (response.status === 404 || data.detail?.toLowerCase().includes('not found') || data.detail?.toLowerCase().includes('register')) {
                showError('❌ ' + (data.detail || 'User not found. Please register first.'));
                setTimeout(() => {
                    window.location.href = 'register.html';
                }, 2500);
                return;
            }
            throw new Error(data.detail || 'Login failed');
        }
        
        // Success
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showSuccess('✅ Login successful! Redirecting...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        showError('❌ ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    clearMessage();
    
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const submitBtn = document.querySelector('button[type="submit"]');
    
    // Validation
    if (!fullName || !email || !password) {
        showError('Please fill in all required fields');
        return;
    }
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                full_name: fullName,
                phone: phone
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Registration failed');
        }
        
        // Success
        showSuccess('✅ ' + (data.message || 'Registration successful!'));
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        showError('❌ ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
    }
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}
