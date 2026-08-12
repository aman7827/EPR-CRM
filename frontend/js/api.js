/* ==========================================================================
   MINI ERP + CRM - CENTRALIZED API SERVICE (api.js)
   Handles all HTTP communications with backend running at http://localhost:5000/api/v1
   ========================================================================== */

   const API_BASE_URL = "https://erm-crm-backend.onrender.com/api/v1";
function safeRedirect(target) {
  const currentPage = (window.location.pathname || '/').split('/').pop() || 'index.html';
  if (currentPage === target) {
    return;
  }

  const lastTarget = sessionStorage.getItem('crm-last-redirect');
  const lastTimestamp = Number(sessionStorage.getItem('crm-last-redirect-ts') || '0');
  const now = performance.now();

  if (lastTarget === target && now - lastTimestamp < 5000) {
    return;
  }

  sessionStorage.setItem('crm-last-redirect', target);
  sessionStorage.setItem('crm-last-redirect-ts', String(now));
  window.location.href = target;
}

/**
 * Core fetch wrapper with JWT header injection & error normalization
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, config);

    // Handle 401 Unauthorized globally
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      safeRedirect('login.html');
      throw new Error('Session expired. Please log in again.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.error?.message || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Toast Notification Utility
 */
function showToast(message, type = 'info', title = '') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  toast.innerHTML = `
    <div class="toast-icon">${iconMap[type] || 'ℹ'}</div>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${title}</div>` : ''}
      <div class="toast-message">${message}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Helper object providing GET, POST, PUT, PATCH, DELETE operations
 */
const api = {
  get: (endpoint, params = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    ).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return apiFetch(url, { method: 'GET' });
  },

  post: (endpoint, body) => {
    return apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put: (endpoint, body) => {
    return apiFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  patch: (endpoint, body) => {
    return apiFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete: (endpoint) => {
    return apiFetch(endpoint, { method: 'DELETE' });
  },
};

// Export to global scope
window.API_BASE_URL = API_BASE_URL;
window.apiFetch = apiFetch;
window.api = api;
window.showToast = showToast;
