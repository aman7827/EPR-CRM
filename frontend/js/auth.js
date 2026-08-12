/* ==========================================================================
   MINI ERP + CRM - AUTHENTICATION MODULE (auth.js)
   JWT Storage, Route Protection, Role Control & Session Management
   ========================================================================== */

/**
 * Save auth data to localStorage
 */
function setAuthData(accessToken, user) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('user', JSON.stringify(user));
  sessionStorage.removeItem('crm-last-redirect');
  sessionStorage.removeItem('crm-last-redirect-ts');
}

/**
 * Get current JWT access token
 */
function getToken() {
  return localStorage.getItem('accessToken');
}

/**
 * Get current logged in user object
 */
function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!getToken();
}

/**
 * Check user role permission
 */
function hasRole(...roles) {
  const user = getCurrentUser();
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Protected Page Guard - Run on every page load
 */
function checkAuth() {
  const isLoginPage = window.location.pathname.endsWith('login.html');
  const token = getToken();

  if (!token && !isLoginPage) {
    safeRedirect('login.html');
    return false;
  }

  if (token && isLoginPage) {
    safeRedirect('dashboard.html');
    return false;
  }

  return true;
}

/**
 * Perform Login via API
 */
async function login(email, password) {
  try {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      setAuthData(res.data.accessToken, res.data.user);
      showToast('Logged in successfully', 'success', 'Welcome Back');
      setTimeout(() => {
        safeRedirect('dashboard.html');
      }, 500);
      return true;
    }
  } catch (error) {
    showToast(error.message || 'Invalid email or password', 'error', 'Login Failed');
    throw error;
  }
}

/**
 * Perform Logout
 */
async function logout() {
  try {
    await api.post('/auth/logout', {}).catch(() => {});
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    showToast('Logged out successfully', 'info');
    setTimeout(() => {
      safeRedirect('login.html');
    }, 400);
  }
}

/**
 * Render Sidebar User Profile Widget
 */
function renderUserProfile() {
  const user = getCurrentUser();
  if (!user) return;

  const userAvatar = document.getElementById('user-avatar-text');
  const userName = document.getElementById('user-display-name');
  const userRole = document.getElementById('user-display-role');

  if (userAvatar) {
    const initials = user.name
      ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';
    userAvatar.textContent = initials;
  }

  if (userName) userName.textContent = user.name || 'ERP User';
  if (userRole) userRole.textContent = user.role || 'USER';

  // Apply RBAC hide rules for restricted links if needed
  const adminOnlyElements = document.querySelectorAll('.admin-only');
  adminOnlyElements.forEach(el => {
    if (!hasRole('ADMIN')) {
      el.style.display = 'none';
    }
  });
}

// Auto-initialize auth check when script loads
document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.endsWith('login.html');
  if (!isLoginPage) {
    if (checkAuth()) {
      renderUserProfile();
    }
  }
});

// Export to global scope
window.setAuthData = setAuthData;
window.getToken = getToken;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;
window.hasRole = hasRole;
window.checkAuth = checkAuth;
window.login = login;
window.logout = logout;
