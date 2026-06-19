if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = 'https://kenya-marketplace-api.onrender.com';
}

function getToken() {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
        return null;
    }
}

function updateAuthUI() {
    const token = getToken();
    const user = getUser();

    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    const authButtons = document.getElementById('authButtons');

    if (token && user) {
        if (userMenu) userMenu.style.display = 'flex';
        if (userName) userName.textContent = user.full_name || user.email || 'User';
        if (authButtons) authButtons.style.display = 'none';
    } else {
        if (userMenu) userMenu.style.display = 'none';
        if (userName) userName.textContent = '';
        if (authButtons) authButtons.style.display = 'flex';
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Login function
async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token in BOTH keys for compatibility
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirect based on user type
            if (data.is_admin) {
                window.location.href = 'admin/dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
            return { success: true };
        } else {
            return { success: false, error: data.detail || 'Login failed' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

// Register function
async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            // Store token in BOTH keys for compatibility
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            window.location.href = 'index.html';
            return { success: true };
        } else {
            return { success: false, error: data.detail || 'Registration failed' };
        }
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    loginUser(email, password).then(result => {
        if (!result.success) {
            alert(result.error);
        }
    });
}

// Handle register form submission
function handleRegister(event) {
    event.preventDefault();
    const fullName = document.getElementById('registerName')?.value.trim();
    const email = document.getElementById('registerEmail')?.value.trim();
    const phone = document.getElementById('registerPhone')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const confirmPassword = document.getElementById('registerConfirmPassword')?.value;

    if (!fullName || !email || !phone || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    registerUser({
        full_name: fullName,
        email: email,
        phone: phone,
        password: password
    }).then(result => {
        if (!result.success) {
            alert(result.error);
        }
    });
}

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', updateAuthUI);