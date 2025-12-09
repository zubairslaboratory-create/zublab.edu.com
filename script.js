// Google Apps Script Configuration
const CONFIG = {
    scriptUrl: localStorage.getItem('auth_script_url') || '',
    enableEncryption: localStorage.getItem('auth_enable_encryption') !== 'false',
    saveCredentials: localStorage.getItem('auth_save_credentials') !== 'false'
};

// DOM Elements
const loginForm = document.getElementById('loginFormElement');
const registerForm = document.getElementById('registerFormElement');
const forgotPasswordForm = document.getElementById('forgotPasswordFormElement');
const loginFormBox = document.getElementById('loginForm');
const registerFormBox = document.getElementById('registerForm');
const forgotPasswordFormBox = document.getElementById('forgotPasswordForm');
const themeToggle = document.getElementById('themeToggle');
const configBtn = document.getElementById('configBtn');
const configModal = document.getElementById('configModal');
const termsModal = document.getElementById('termsModal');

// Form Switch Logic
document.querySelectorAll('.switch-form').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.dataset.target;
        
        // Hide all forms
        [loginFormBox, registerFormBox, forgotPasswordFormBox].forEach(form => {
            form.classList.remove('active');
        });
        
        // Show target form
        document.getElementById(`${target}Form`).classList.add('active');
        
        // Reset forms
        if (target === 'login') {
            loginForm.reset();
        } else if (target === 'register') {
            registerForm.reset();
            updatePasswordStrength('');
        }
    });
});

// Forgot Password Link
document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
    e.preventDefault();
    loginFormBox.classList.remove('active');
    forgotPasswordFormBox.classList.add('active');
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.querySelector('i').className = 'fas fa-sun';
}

// Password Strength Indicator
const passwordInput = document.getElementById('registerPassword');
const strengthSegments = document.querySelectorAll('.strength-segment');
const strengthText = document.getElementById('strengthText');

passwordInput.addEventListener('input', (e) => {
    updatePasswordStrength(e.target.value);
});

function updatePasswordStrength(password) {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Cap score at 4 for segment display
    const displayScore = Math.min(score, 4);
    
    // Update segments
    strengthSegments.forEach((segment, index) => {
        if (index < displayScore) {
            segment.classList.add('active');
        } else {
            segment.classList.remove('active');
        }
    });
    
    // Update text
    const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    strengthText.textContent = strengthLevels[displayScore];
    strengthText.style.color = ['#ef4444', '#f59e0b', '#10b981', '#22c55e'][displayScore - 1] || '#6b7280';
}

// Password Toggle Visibility
function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    
    toggle.addEventListener('click', () => {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        toggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
}

setupPasswordToggle('loginPassword', 'toggleLoginPassword');
setupPasswordToggle('registerPassword', 'toggleRegisterPassword');
setupPasswordToggle('registerConfirmPassword', 'toggleRegisterConfirmPassword');

// Form Validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

function clearError(elementId) {
    const element = document.getElementById(elementId);
    element.textContent = '';
    element.style.display = 'none';
}

// Toast Notification System
function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' :
                 type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
    
    // Auto remove animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Button Loading States
function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const loader = button.querySelector('.btn-loader');
    
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Google Sheets API Functions
async function sendToGoogleSheets(data) {
    if (!CONFIG.scriptUrl) {
        showToast('Please configure Google Apps Script URL first', 'error');
        return { success: false, message: 'Configuration missing' };
    }
    
    try {
        const response = await fetch(CONFIG.scriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        return await response.json();
    } catch (error) {
        console.error('Error connecting to Google Sheets:', error);
        return { 
            success: false, 
            message: 'Failed to connect to server. Please check your configuration.' 
        };
    }
}

// Login Form Submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Clear previous errors
    clearError('loginEmailError');
    clearError('loginPasswordError');
    
    // Validation
    let isValid = true;
    
    if (!validateEmail(email)) {
        showError('loginEmailError', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (password.length < 6) {
        showError('loginPasswordError', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Set loading state
    setButtonLoading('loginBtn', true);
    
    // Prepare data
    const loginData = {
        action: 'login',
        email: email,
        password: CONFIG.enableEncryption ? await hashPassword(password) : password
    };
    
    // Send to Google Sheets
    const result = await sendToGoogleSheets(loginData);
    
    setButtonLoading('loginBtn', false);
    
    if (result.success) {
        showToast('Login successful! Redirecting...', 'success');
        
        // Save credentials if remember me is checked
        if (rememberMe && CONFIG.saveCredentials) {
            localStorage.setItem('saved_email', email);
        }
        
        // Simulate redirect (in real app, you'd redirect to dashboard)
        setTimeout(() => {
            showToast(`Welcome back, ${result.name || 'User'}!`, 'success');
        }, 1000);
        
        // Reset form
        loginForm.reset();
    } else {
        showToast(result.message || 'Login failed. Please check your credentials.', 'error');
    }
});

// Register Form Submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const acceptTerms = document.getElementById('acceptTerms').checked;
    
    // Clear previous errors
    ['registerNameError', 'registerEmailError', 'registerPasswordError', 'registerConfirmPasswordError']
        .forEach(id => clearError(id));
    
    // Validation
    let isValid = true;
    
    if (name.length < 2) {
        showError('registerNameError', 'Name must be at least 2 characters');
        isValid = false;
    }
    
    if (!validateEmail(email)) {
        showError('registerEmailError', 'Please enter a valid email address');
        isValid = false;
    }
    
    if (!validatePassword(password)) {
        showError('registerPasswordError', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character');
        isValid = false;
    }
    
    if (password !== confirmPassword) {
        showError('registerConfirmPasswordError', 'Passwords do not match');
        isValid = false;
    }
    
    if (!acceptTerms) {
        showToast('Please accept the terms and conditions', 'warning');
        isValid = false;
    }
    
    if (!isValid) return;
    
    // Set loading state
    setButtonLoading('registerBtn', true);
    
    // Prepare data
    const registerData = {
        action: 'register',
        name: name,
        email: email,
        password: CONFIG.enableEncryption ? await hashPassword(password) : password,
        timestamp: new Date().toISOString()
    };
    
    // Send to Google Sheets
    const result = await sendToGoogleSheets(registerData);
    
    setButtonLoading('registerBtn', false);
    
    if (result.success) {
        showToast('Registration successful! Please login.', 'success');
        
        // Switch to login form
        registerFormBox.classList.remove('active');
        loginFormBox.classList.add('active');
        
        // Pre-fill email in login form
        document.getElementById('loginEmail').value = email;
        
        // Reset register form
        registerForm.reset();
        updatePasswordStrength('');
    } else {
        showToast(result.message || 'Registration failed. Please try again.', 'error');
    }
});

// Forgot Password Form Submission
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('forgotEmail').value.trim();
    
    // Clear previous error
    clearError('forgotEmailError');
    
    // Validation
    if (!validateEmail(email)) {
        showError('forgotEmailError', 'Please enter a valid email address');
        return;
    }
    
    // Set loading state
    setButtonLoading('forgotPasswordBtn', true);
    
    // Prepare data
    const forgotData = {
        action: 'forgot_password',
        email: email
    };
    
    // Send to Google Sheets
    const result = await sendToGoogleSheets(forgotData);
    
    setButtonLoading('forgotPasswordBtn', false);
    
    if (result.success) {
        showToast('Password reset instructions sent to your email', 'success');
        forgotPasswordForm.reset();
        
        // Switch back to login form
        forgotPasswordFormBox.classList.remove('active');
        loginFormBox.classList.add('active');
    } else {
        showToast(result.message || 'Failed to send reset instructions. Please try again.', 'error');
    }
});

// Password Hashing Function
async function hashPassword(password) {
    if (!CONFIG.enableEncryption) return password;
    
    // Simple hash function (in production, use stronger encryption)
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'auth_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Configuration Modal
configBtn.addEventListener('click', () => {
    // Load current config
    document.getElementById('scriptUrl').value = CONFIG.scriptUrl;
    document.getElementById('enableEncryption').checked = CONFIG.enableEncryption;
    document.getElementById('saveCredentials').checked = CONFIG.saveCredentials;
    
    configModal.classList.add('active');
});

// Close modals
document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        closeBtn.closest('.modal').classList.remove('active');
    });
});

// Close modal on outside click
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Save Configuration
document.getElementById('saveConfig').addEventListener('click', () => {
    const scriptUrl = document.getElementById('scriptUrl').value.trim();
    const enableEncryption = document.getElementById('enableEncryption').checked;
    const saveCredentials = document.getElementById('saveCredentials').checked;
    
    // Validate script URL
    if (scriptUrl && !scriptUrl.startsWith('https://script.google.com/')) {
        showToast('Please enter a valid Google Apps Script URL', 'error');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('auth_script_url', scriptUrl);
    localStorage.setItem('auth_enable_encryption', enableEncryption);
    localStorage.setItem('auth_save_credentials', saveCredentials);
    
    // Update config
    CONFIG.scriptUrl = scriptUrl;
    CONFIG.enableEncryption = enableEncryption;
    CONFIG.saveCredentials = saveCredentials;
    
    showToast('Configuration saved successfully!', 'success');
    configModal.classList.remove('active');
});

// Load saved email if remember me was checked
window.addEventListener('DOMContentLoaded', () => {
    const savedEmail = localStorage.getItem('saved_email');
    if (savedEmail && CONFIG.saveCredentials) {
        document.getElementById('loginEmail').value = savedEmail;
        document.getElementById('rememberMe').checked = true;
    }
    
    // Check if config is set
    if (!CONFIG.scriptUrl) {
        setTimeout(() => {
            showToast('Please configure Google Apps Script URL to use the system', 'warning', 10000);
            configBtn.click();
        }, 1000);
    }
});

// Social Login Buttons (Placeholder)
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showToast('Social login would be implemented with OAuth', 'info');
    });
});

// Terms Links
document.querySelectorAll('.terms-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        termsModal.classList.add('active');
    });
});

// Initialize password strength with empty value
updatePasswordStrength('');