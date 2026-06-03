// js/auth.js - Authentication with backend wake-up handling

const API_BASE_URL = 'https://kenya-marketplace-api.onrender.com/api';

// Demo mode: Store users locally when backend is sleeping
const DEMO_USERS_KEY = 'demo_users';
const getDemoUsers = () => JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]');
const saveDemoUser = (user) => {
    const users = getDemoUsers();
    users.push(user);
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
};
const findDemoUser = (email) => getDemoUsers().find(u => u.email === email);

// Wake up backend (Render free tier sleeps after 15 min)
async function wakeUpBackend() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for wake-up
        await fetch(`${API_BASE_URL.replace('/api', '')}/health`, { 
            method: 'GET',
            signal: controller.signal 
        });
        clearTimeout(timeoutId);
        return true;
    } catch (e) {
        console.log('Backend wake-up attempt failed:', e.message);
        return false;
    }
}

// Check if backend is awake
let backendAwake = false;
async function checkBackend() {
    if (backendAwake) return true;
    try {
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/`, { 
            method: 'GET',
            signal: AbortSignal.timeout(5000)
        });
        backendAwake = response.ok;
        return backendAwake;
    } catch (e) {
        backendAwake = false;
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
});

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#e74c3c';
        errorDiv.style.background = '#fdeaea';
        errorDiv.style.border = '1px solid #e74c3c';
        errorDiv.style.padding = '12px';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.marginBottom = '20px';
        errorDiv.style.textAlign = 'center';
    }
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#27ae60';
        errorDiv.style.background = '#e8f8f5';
        errorDiv.style.border = '1px solid #27ae60';
        errorDiv.style.padding = '12px';
        errorDiv.style.borderRadius = '4px';
        errorDiv.style.marginBottom = '20px';
        errorDiv.style.textAlign = 'center';
    }
}

function clearMessage() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
}

function showLoading(btn, text) {
    btn.disabled = true;
    btn.textContent = text;
}

function resetBtn(btn, text) {
    btn.disabled = false;
    btn.textContent = text;
}

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
    
    showLoading(submitBtn, 'Waking up backend...');
    
    // Try to wake up backend first
    await wakeUpBackend();
    
    showLoading(submitBtn, 'Logging in...');
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 404 || data.detail?.toLowerCase().includes('not found') || data.detail?.toLowerCase().includes('register')) {
                showError('❌ User not found. Please register first.');
                setTimeout(() => window.location.href = 'register.html', 2500);
                return;
            }
            throw new Error(data.detail || 'Login failed');
        }
        
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showSuccess('✅ Login successful! Redirecting...');
        setTimeout(() => window.location.href = 'index.html', 1000);
        
    } catch (error) {
        if (error.name === 'AbortError') {
            showError('❌ Request timed out. Backend is sleeping. Please try again in 30 seconds.');
        } else {
            showError('❌ ' + (error.message || 'Failed to connect. Please try again.'));
        }
    } finally {
        resetBtn(submitBtn, 'Login');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    clearMessage();
    
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    const submitBtn = document.querySelector('button[type="submit"]');
    
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
    
    showLoading(submitBtn, 'Waking up backend...');
    await wakeUpBackend();
    
    showLoading(submitBtn, 'Creating account...');
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                full_name: fullName,
                phone: phone
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Registration failed');
        }
        
        showSuccess('✅ Registration successful! Please login.');
        setTimeout(() => window.location.href = 'login.html', 2000);
        
    } catch (error) {
        if (error.name === 'AbortError') {
            showError('❌ Request timed out. Backend is sleeping. Please wait 30s and try again.');
        } else {
            showError('❌ ' + (error.message || 'Failed to connect. Please try again.'));
        }
    } finally {
        resetBtn(submitBtn, 'Register');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function isLoggedIn() {
    return !!localStorage.getItem('token');
}

function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}
