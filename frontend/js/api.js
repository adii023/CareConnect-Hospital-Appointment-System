// ===================================================================
// CARECONNECT HOSPITAL - API CLIENT & UTILITIES
// ===================================================================
// Central API endpoint:
// Automatically uses '/api' for local development, and your live Render backend for Vercel production
const RENDER_BACKEND_URL = 'https://careconnect-hospital-appointment-system.onrender.com/api';
const API_BASE = window.CARECONNECT_API_URL 
  || localStorage.getItem('careconnect_api_url') 
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '/api' : RENDER_BACKEND_URL);


// Token Management in localStorage
function getAuthToken() {
  return localStorage.getItem('careconnect_token');
}

function setAuthToken(token) {
  if (token) {
    localStorage.setItem('careconnect_token', token);
  } else {
    localStorage.removeItem('careconnect_token');
  }
}

function getCurrentUser() {
  const userStr = localStorage.getItem('careconnect_user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('careconnect_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('careconnect_user');
  }
}

function logout() {
  localStorage.removeItem('careconnect_token');
  localStorage.removeItem('careconnect_user');
  showToast('Logged Out', 'You have been logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 500);
}

// Central API Fetch Wrapper
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401 && !url.includes('/auth/login')) {
        // Session expired or unauthenticated
        setAuthToken(null);
        setCurrentUser(null);
        showToast('Session Expired', 'Please login to continue.', 'warning');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);
      }
      const errorMessage = data && data.message ? data.message : `Request failed with status ${response.status}`;
      const err = new Error(errorMessage);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${endpoint}]:`, error);
    throw error;
  }
}

// Toast Notifications
function showToast(title, message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-circle-exclamation',
    warning: 'fa-solid fa-triangle-exclamation',
    info: 'fa-solid fa-circle-info'
  };

  const iconClass = iconMap[type] || iconMap.info;

  toast.innerHTML = `
    <div class="toast-icon"><i class="${iconClass}"></i></div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-message">${escapeHtml(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Confirmation Dialog Modal Helper
function showConfirmDialog({ title, message, confirmText = 'Yes, Confirm', confirmClass = 'btn-danger', onConfirm }) {
  let modalOverlay = document.getElementById('global-confirm-modal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'global-confirm-modal';
    modalOverlay.className = 'modal-overlay';
    document.body.appendChild(modalOverlay);
  }

  modalOverlay.innerHTML = `
    <div class="modal-container" style="max-width: 440px;">
      <div class="modal-header">
        <h3>${escapeHtml(title)}</h3>
        <button class="modal-close-btn" onclick="closeConfirmModal()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="color: var(--text-muted); font-size: 0.95rem;">${escapeHtml(message)}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline-dark btn-sm" onclick="closeConfirmModal()">No, Keep</button>
        <button class="btn ${confirmClass} btn-sm" id="confirm-action-btn">${escapeHtml(confirmText)}</button>
      </div>
    </div>
  `;

  modalOverlay.classList.add('active');

  document.getElementById('confirm-action-btn').onclick = async () => {
    closeConfirmModal();
    if (typeof onConfirm === 'function') {
      await onConfirm();
    }
  };
}

function closeConfirmModal() {
  const modalOverlay = document.getElementById('global-confirm-modal');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

// Helpers
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return dateStr;
}

// Check Role Access & Auth Guard for Protected Pages
function checkAuthGuard(requiredRoles = []) {
  const user = getCurrentUser();
  const token = getAuthToken();

  if (!user || !token) {
    showToast('Login Required', 'Please login to access this page.', 'warning');
    window.location.href = `login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return null;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    showToast('Access Denied', `This page is restricted to ${requiredRoles.join(' or ')}.`, 'error');
    if (user.role === 'Patient') {
      window.location.href = 'patient-dashboard.html';
    } else if (user.role === 'Admin') {
      window.location.href = 'admin-dashboard.html';
    } else if (user.role === 'Receptionist') {
      window.location.href = 'receptionist-dashboard.html';
    } else {
      window.location.href = 'index.html';
    }
    return null;
  }

  return user;
}
