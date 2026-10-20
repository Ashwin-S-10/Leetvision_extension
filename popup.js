// popup controller for Leetvision extension


// DOM elements
const loading = document.getElementById('loading');
const setupTutorial = document.getElementById('setup-tutorial');
const signinForm = document.getElementById('signin-form');
const userDashboard = document.getElementById('user-dashboard');
const authFormElement = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const userEmail = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const gotoSignupBtn = document.getElementById('goto-signup');
const showSigninBtn = document.getElementById('show-signin');
const backToTutorialBtn = document.getElementById('back-to-tutorial');
const openWebsiteBtn = document.getElementById('open-website');

const AUTH_KEYS = [
    'access_token',
    'authenticated_user',
    'access_token_expires_at',
    'session_expires_at',
    'refresh_token',
    'user_email'
];

let currentUser = null;
let currentToken = null;

// Remove only authentication keys, leaving other storage intact
async function clearAuthData() {
    await chrome.storage.local.remove(AUTH_KEYS);
    currentToken = null;
    currentUser = null;
}

// Backend authentication helper
async function authRequest(endpoint, body = {}, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${CONFIG.BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    const raw = await response.text();
    let data;
    try {
        data = raw ? JSON.parse(raw) : {};
    } catch {
        data = { error: raw.slice(0, 300) || `Backend returned ${response.status}` };
    }

    return { ok: response.ok, status: response.status, data };
}

// Check for existing session on load
document.addEventListener('DOMContentLoaded', async () => {
    showLoading();

    try {
        chrome.storage.local.get([
            'access_token',
            'authenticated_user',
            'access_token_expires_at',
            'refresh_token',
            'supabase_token',
            'supabase_user',
            'token_expires_at'
        ], async (result) => {
            const accessToken = result?.access_token || result?.supabase_token;
            const authUser = result?.authenticated_user || result?.supabase_user;
            const tokenExpiresAt = result?.access_token_expires_at || result?.token_expires_at;
            const refreshToken = result?.refresh_token;

            // Safe migration: if legacy keys exist and new keys do not, migrate them
            if (!result?.access_token && result?.supabase_token) {
                await chrome.storage.local.set({
                    access_token: accessToken,
                    authenticated_user: authUser,
                    access_token_expires_at: tokenExpiresAt
                });
                await chrome.storage.local.remove(['supabase_token', 'supabase_user', 'token_expires_at', 'session_expires']);
            }

            if (!accessToken || !authUser) {
                showTutorial();
                return;
            }

            const now = Date.now();
            const userObj = typeof authUser === 'string' ? JSON.parse(authUser) : authUser;

            // 1. If access token is still valid (with 60s buffer), show dashboard
            if (tokenExpiresAt && (tokenExpiresAt - 60000) > now) {
                currentToken = accessToken;
                currentUser = userObj;
                showDashboard(currentUser);
                return;
            }

            // 2. If access token expired, attempt silent refresh using refresh_token
            if (refreshToken) {
                try {
                    const res = await authRequest('/auth/refresh', { refresh_token: refreshToken });
                    if (res.ok && res.data?.access_token) {
                        const data = res.data;
                        const newExpiresAt = data.expires_at
                            ? data.expires_at * 1000
                            : Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600 * 1000);

                        await chrome.storage.local.set({
                            access_token: data.access_token,
                            access_token_expires_at: newExpiresAt,
                            refresh_token: data.refresh_token || refreshToken
                        });

                        currentToken = data.access_token;
                        currentUser = userObj;
                        showDashboard(currentUser);
                        return;
                    }
                } catch {
                    // Network or refresh failure, proceed to clean up
                }
            }

            // 3. Token expired and cannot be refreshed; clean up auth data only
            await clearAuthData();
            showTutorial();
        });
    } catch {
        showTutorial();
    }
});

// Button event listeners
gotoSignupBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: CONFIG.WEBSITE_URL });
});

showSigninBtn.addEventListener('click', () => {
    showSigninForm();
});

backToTutorialBtn.addEventListener('click', () => {
    showTutorial();
});

openWebsiteBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: CONFIG.WEBSITE_URL });
});

// Handle form submission
authFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    clearMessages();

    try {
        await handleSignIn(email, password);
    } catch (error) {
        const message = error.name === 'TypeError' || error.message?.includes('fetch')
            ? 'Unable to connect to backend server. Please check your network connection or server status.'
            : (error.message || 'An error occurred during sign in.');
        showError(message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
});

// Handle sign in via backend
async function handleSignIn(email, password) {
    const result = await authRequest('/auth/signin', { email, password });

    if (!result.ok || !result.data?.access_token) {
        showError(result.data?.error || result.data?.message || 'Sign in failed. Please check your credentials.');
        return;
    }

    const response = result.data;
    const user = response.user;

    const tokenExpiresAt = response.expires_at
        ? response.expires_at * 1000
        : Date.now() + (response.expires_in ? response.expires_in * 1000 : 3600 * 1000);

    await chrome.storage.local.set({
        access_token: response.access_token,
        authenticated_user: JSON.stringify(user),
        access_token_expires_at: tokenExpiresAt,
        user_email: user?.email || email,
        refresh_token: response.refresh_token
    });

    currentToken = response.access_token;
    currentUser = user;

    showDashboard(user);
    showSuccess('Successfully signed in!');
}

// Handle logout via backend
logoutBtn.addEventListener('click', async () => {
    try {
        showLoading();

        const result = await chrome.storage.local.get(['access_token', 'supabase_token']);
        const token = result.access_token || result.supabase_token;
        if (token) {
            await authRequest('/auth/signout', {}, token);
        }
    } catch (error) {
        // Proceed with local storage cleanup regardless of network error
    } finally {
        await clearAuthData();
        showTutorial();
    }
});

// Utility functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';

    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

function clearMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// UI state management functions
function showTutorial() {
    loading.style.display = 'none';
    setupTutorial.style.display = 'block';
    signinForm.style.display = 'none';
    userDashboard.style.display = 'none';
    clearMessages();
}

function showSigninForm() {
    loading.style.display = 'none';
    setupTutorial.style.display = 'none';
    signinForm.style.display = 'block';
    userDashboard.style.display = 'none';
    clearMessages();
}

function showDashboard(user) {
    loading.style.display = 'none';
    setupTutorial.style.display = 'none';
    signinForm.style.display = 'none';
    userDashboard.style.display = 'block';

    userEmail.textContent = user?.email || '';
}

function showLoading() {
    loading.style.display = 'block';
    setupTutorial.style.display = 'none';
    signinForm.style.display = 'none';
    userDashboard.style.display = 'none';
}