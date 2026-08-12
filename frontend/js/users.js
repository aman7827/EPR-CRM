/* ==========================================================================
   MINI ERP + CRM - USERS MODULE (users.js)
   User Management, Role Assignments (ADMIN, SALES, WAREHOUSE, ACCOUNTS), CRUD
   ========================================================================== */

let currentPage = 1;
const limit = 10;
let currentSearch = '';
let currentRoleFilter = '';

document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    if (!hasRole('ADMIN')) {
      showToast('Access restricted to Admin users only', 'warning');
      safeRedirect('dashboard.html');
      return;
    }
    loadUsers();
  }
});

async function loadUsers(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align:center; padding: 1.5rem;">
        Loading users list...
      </td>
    </tr>
  `;

  try {
    const params = {
      page: currentPage,
      limit,
      search: currentSearch || undefined,
      role: currentRoleFilter || undefined,
    };

    const res = await api.get('/users', params);

    if (res.success && Array.isArray(res.data)) {
      renderUsersTable(res.data);
      renderPagination(res.meta);
    }
  } catch (error) {
    showToast(error.message || 'Failed to load user list', 'error');
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger-color); text-align:center;">Failed to load users data</td></tr>`;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 2rem; color:var(--secondary-text);">
          No users found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map(u => {
    const isActive = u.is_active ?? u.isActive ?? true;

    return `
      <tr>
        <td><strong>${escapeHtml(u.name || 'User')}</strong></td>
        <td>${escapeHtml(u.email || 'N/A')}</td>
        <td>${getRoleBadge(u.role)}</td>
        <td>
          <span class="badge ${isActive ? 'badge-success' : 'badge-secondary'}">
            ${isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="openEditUserModal('${u.id}')">
              Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="confirmDeleteUser('${u.id}', '${escapeJsStr(u.name || '')}')">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function getRoleBadge(role) {
  switch (role) {
    case 'ADMIN': return `<span class="badge badge-purple">Admin</span>`;
    case 'SALES': return `<span class="badge badge-info">Sales</span>`;
    case 'WAREHOUSE': return `<span class="badge badge-warning">Warehouse</span>`;
    case 'ACCOUNTS': return `<span class="badge badge-success">Accounts</span>`;
    default: return `<span class="badge badge-secondary">${role || 'User'}</span>`;
  }
}

function renderPagination(meta) {
  const container = document.getElementById('users-pagination');
  if (!container || !meta) return;

  const { page, totalPages, total } = meta;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; font-size:13px; color:var(--secondary-text);">
      <div>Showing ${startItem} to ${endItem} of ${total} users</div>
      <div style="display:flex; gap:0.3rem;">
        <button class="btn btn-sm btn-outline" ${page <= 1 ? 'disabled' : ''} onclick="loadUsers(${page - 1})">Previous</button>
        <button class="btn btn-sm btn-outline" ${page >= totalPages ? 'disabled' : ''} onclick="loadUsers(${page + 1})">Next</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function applyFilters() {
  currentSearch = document.getElementById('user-search-input').value.trim();
  currentRoleFilter = document.getElementById('user-role-filter').value;
  loadUsers(1);
}

function openAddUserModal() {
  document.getElementById('user-modal-title').textContent = 'Add New Team User';
  document.getElementById('user-form').reset();
  document.getElementById('user-id').value = '';
  document.getElementById('password-group').style.display = 'block';
  document.getElementById('user-password').required = true;
  document.getElementById('user-modal-backdrop').classList.add('active');
}

async function openEditUserModal(id) {
  try {
    const res = await api.get(`/users/${id}`);
    if (res.success && res.data) {
      const u = res.data;
      document.getElementById('user-modal-title').textContent = 'Edit User Account';
      document.getElementById('user-id').value = u.id;
      document.getElementById('user-name').value = u.name || '';
      document.getElementById('user-email').value = u.email || '';
      document.getElementById('user-role').value = u.role || 'SALES';

      document.getElementById('password-group').style.display = 'block';
      document.getElementById('user-password').required = false;
      document.getElementById('user-password').value = '';

      document.getElementById('user-modal-backdrop').classList.add('active');
    }
  } catch (error) {
    showToast(error.message || 'Failed to fetch user details', 'error');
  }
}

function closeUserModal() {
  document.getElementById('user-modal-backdrop').classList.remove('active');
}

async function handleUserFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('user-id').value;

  const payload = {
    name: document.getElementById('user-name').value.trim(),
    email: document.getElementById('user-email').value.trim(),
    role: document.getElementById('user-role').value,
  };

  const passVal = document.getElementById('user-password').value;
  if (passVal) {
    payload.password = passVal;
  }

  const btn = document.getElementById('btn-save-user');
  btn.disabled = true;

  try {
    if (id) {
      await api.put(`/users/${id}`, payload);
      showToast('User account updated', 'success');
    } else {
      await api.post('/users', payload);
      showToast('New user registered successfully', 'success');
    }
    closeUserModal();
    loadUsers(currentPage);
  } catch (error) {
    showToast(error.message || 'Failed to save user account', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function confirmDeleteUser(id, name) {
  if (confirm(`Are you sure you want to delete user account "${name}"?`)) {
    try {
      await api.delete(`/users/${id}`);
      showToast(`User account "${name}" deleted`, 'success');
      loadUsers(currentPage);
    } catch (error) {
      showToast(error.message || 'Failed to delete user account', 'error');
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJsStr(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'");
}
