/* ==========================================================================
   MINI ERP + CRM - CUSTOMERS MODULE (customers.js)
   List, Search, Pagination, Add, Edit, Delete Customers
   ========================================================================== */

let currentPage = 1;
const limit = 10;
let currentSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    loadCustomers();
  }
});

async function loadCustomers(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('customers-table-body');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center; padding: 1.5rem;">
        Loading customers data...
      </td>
    </tr>
  `;

  try {
    const params = {
      page: currentPage,
      limit: limit,
      search: currentSearch,
    };

    const res = await api.get('/customers', params);

    if (res.success && Array.isArray(res.data)) {
      renderCustomersTable(res.data);
      renderPagination(res.meta);
    }
  } catch (error) {
    showToast(error.message || 'Failed to load customers', 'error');
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger-color); text-align:center;">Failed to load customers data</td></tr>`;
  }
}

function renderCustomersTable(customers) {
  const tbody = document.getElementById('customers-table-body');
  if (customers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 2rem; color: var(--secondary-text);">
          No customers found. Try adjusting your search query or add a new customer.
        </td>
      </tr>
    `;
    return;
  }

  const isAdmin = hasRole('ADMIN');

  tbody.innerHTML = customers.map(c => {
    const name = c.name || c.customerName || 'N/A';
    const company = c.company_name || c.businessName || 'N/A';
    const email = c.email || 'N/A';
    const phone = c.phone || c.mobile || 'N/A';
    const gst = c.gst_number || c.gstNumber || 'N/A';
    const rawStatus = c.status || (c.is_active === false ? 'INACTIVE' : 'ACTIVE');
    
    let statusBadge = '<span class="badge badge-active">Active</span>';
    if (rawStatus === 'LEAD') {
      statusBadge = '<span class="badge badge-lead">Lead</span>';
    } else if (rawStatus === 'INACTIVE' || c.is_active === false) {
      statusBadge = '<span class="badge badge-inactive">Inactive</span>';
    }

    return `
      <tr>
        <td><strong>${escapeHtml(name)}</strong></td>
        <td>${escapeHtml(company)}</td>
        <td>${escapeHtml(email)}</td>
        <td><code>${escapeHtml(phone)}</code></td>
        <td><code>${escapeHtml(gst)}</code></td>
        <td>${statusBadge}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-outline" onclick="openEditCustomerModal('${c.id}')">
              Edit
            </button>
            ${isAdmin ? `
              <button class="btn btn-sm btn-danger" onclick="confirmDeleteCustomer('${c.id}', '${escapeJsStr(name)}')">
                Delete
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPagination(meta) {
  const container = document.getElementById('pagination-container');
  if (!container || !meta) return;

  const { page, totalPages, total } = meta;

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; font-size:13px; color:var(--secondary-text);">
      <div>Showing ${startItem} to ${endItem} of ${total} customers</div>
      <div style="display:flex; gap:0.3rem;">
        <button class="btn btn-sm btn-outline" ${page <= 1 ? 'disabled' : ''} onclick="loadCustomers(${page - 1})">Previous</button>
        <button class="btn btn-sm btn-outline" ${page >= totalPages ? 'disabled' : ''} onclick="loadCustomers(${page + 1})">Next</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function applyFilters() {
  currentSearch = document.getElementById('customer-search-input').value.trim();
  loadCustomers(1);
}

function openAddCustomerModal() {
  document.getElementById('customer-modal-title').textContent = 'Add New Customer';
  document.getElementById('customer-form').reset();
  document.getElementById('customer-id').value = '';
  document.getElementById('customer-modal-backdrop').classList.add('active');
}

async function openEditCustomerModal(id) {
  try {
    const res = await api.get(`/customers/${id}`);
    if (res.success && res.data) {
      const c = res.data;
      document.getElementById('customer-modal-title').textContent = 'Edit Customer';
      document.getElementById('customer-id').value = c.id;
      document.getElementById('customer-name').value = c.name || c.customerName || '';
      document.getElementById('customer-phone').value = c.phone || c.mobile || '';
      document.getElementById('customer-email').value = c.email || '';
      document.getElementById('customer-company').value = c.company_name || c.businessName || '';
      document.getElementById('customer-gst').value = c.gst_number || c.gstNumber || '';
      document.getElementById('customer-address').value = c.address || '';

      document.getElementById('customer-modal-backdrop').classList.add('active');
    }
  } catch (error) {
    showToast(error.message || 'Failed to fetch customer details', 'error');
  }
}

function closeCustomerModal() {
  document.getElementById('customer-modal-backdrop').classList.remove('active');
}

async function handleCustomerFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('customer-id').value;

  const payload = {
    name: document.getElementById('customer-name').value.trim(),
    phone: document.getElementById('customer-phone').value.trim(),
    email: document.getElementById('customer-email').value.trim() || undefined,
    company_name: document.getElementById('customer-company').value.trim() || undefined,
    gst_number: document.getElementById('customer-gst').value.trim() || undefined,
    address: document.getElementById('customer-address').value.trim() || undefined,
  };

  const btn = document.getElementById('btn-save-customer');
  btn.disabled = true;

  try {
    if (id) {
      await api.put(`/customers/${id}`, payload);
      showToast('Customer updated successfully', 'success');
    } else {
      await api.post('/customers', payload);
      showToast('Customer created successfully', 'success');
    }
    closeCustomerModal();
    loadCustomers(currentPage);
  } catch (error) {
    showToast(error.message || 'Failed to save customer', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function confirmDeleteCustomer(id, name) {
  if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
    try {
      await api.delete(`/customers/${id}`);
      showToast(`Customer "${name}" deleted`, 'success');
      loadCustomers(currentPage);
    } catch (error) {
      showToast(error.message || 'Failed to delete customer', 'error');
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
