/* ==========================================================================
   MINI ERP + CRM - PRODUCTS MODULE (products.js)
   List, Search, Category Filter, Add, Edit, Delete Products
   ========================================================================== */

let currentPage = 1;
const limit = 10;
let currentSearch = '';
let currentCategory = '';

document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    loadProducts();
  }
});

async function loadProducts(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center; padding: 1.5rem;">
        Loading products catalog...
      </td>
    </tr>
  `;

  try {
    const params = {
      page: currentPage,
      limit: limit,
      search: currentSearch || undefined,
      category: currentCategory || undefined,
    };

    const res = await api.get('/products', params);

    if (res.success && Array.isArray(res.data)) {
      renderProductsTable(res.data);
      renderPagination(res.meta);
    }
  } catch (error) {
    showToast(error.message || 'Failed to load products', 'error');
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger-color); text-align:center;">Failed to load products data</td></tr>`;
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('products-table-body');
  if (products.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 2rem; color: var(--secondary-text);">
          No products found. Try adjusting search filters or create a new product.
        </td>
      </tr>
    `;
    return;
  }

  const isAdmin = hasRole('ADMIN');
  const canEdit = hasRole('ADMIN', 'WAREHOUSE');

  tbody.innerHTML = products.map(p => {
    // Robust fallbacks for price, stock, and status
    const rawPrice = p.price ?? p.unitPrice ?? p.unit_price;
    const numericPrice = parseFloat(rawPrice);
    const displayPrice = !isNaN(numericPrice)
      ? `₹${numericPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'Price unavailable';

    const stock = p.current_stock ?? p.currentStock;
    const reorder = p.reorder_level ?? p.reorderLevel ?? p.minimumStockAlertQuantity ?? 10;
    
    let stockBadge = '<span class="badge badge-secondary">Stock unavailable</span>';
    if (stock !== undefined && stock !== null && !isNaN(parseInt(stock, 10))) {
      const currentStockNum = parseInt(stock, 10);
      if (currentStockNum === 0) {
        stockBadge = `<span class="badge badge-outofstock">Out Of Stock</span>`;
      } else if (currentStockNum <= parseInt(reorder, 10)) {
        stockBadge = `<span class="badge badge-lowstock">Low Stock (${currentStockNum})</span>`;
      } else {
        stockBadge = `<span class="badge badge-instock">In Stock (${currentStockNum})</span>`;
      }
    }

    const isActive = p.is_active ?? p.isActive;
    let statusBadge = '<span class="badge badge-secondary">Status unavailable</span>';
    if (isActive !== undefined && isActive !== null) {
      statusBadge = isActive
        ? `<span class="badge badge-success">Active</span>`
        : `<span class="badge badge-secondary">Inactive</span>`;
    }

    return `
      <tr>
        <td><strong>${escapeHtml(p.name || 'Unnamed Product')}</strong></td>
        <td><code>${escapeHtml(p.sku || 'N/A')}</code></td>
        <td><span class="badge badge-secondary">${escapeHtml(p.category || 'General')}</span></td>
        <td><strong>${displayPrice}</strong></td>
        <td>${stockBadge}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="table-actions">
            ${canEdit ? `
              <button class="btn btn-sm btn-outline" onclick="openEditProductModal('${p.id}')">
                Edit
              </button>
            ` : ''}
            ${isAdmin ? `
              <button class="btn btn-sm btn-danger" onclick="confirmDeleteProduct('${p.id}', '${escapeJsStr(p.name || '')}')">
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
      <div>Showing ${startItem} to ${endItem} of ${total} products</div>
      <div style="display:flex; gap:0.3rem;">
        <button class="btn btn-sm btn-outline" ${page <= 1 ? 'disabled' : ''} onclick="loadProducts(${page - 1})">Previous</button>
        <button class="btn btn-sm btn-outline" ${page >= totalPages ? 'disabled' : ''} onclick="loadProducts(${page + 1})">Next</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function applyFilters() {
  currentSearch = document.getElementById('product-search-input').value.trim();
  const select = document.getElementById('product-category-filter');
  currentCategory = select ? select.value : '';
  loadProducts(1);
}

function openAddProductModal() {
  document.getElementById('product-modal-title').textContent = 'Add New Product';
  document.getElementById('product-form').reset();
  document.getElementById('product-id').value = '';
  document.getElementById('product-modal-backdrop').classList.add('active');
}

async function openEditProductModal(id) {
  try {
    const res = await api.get(`/products/${id}`);
    if (res.success && res.data) {
      const p = res.data;
      document.getElementById('product-modal-title').textContent = 'Edit Product';
      document.getElementById('product-id').value = p.id;
      document.getElementById('product-sku').value = p.sku || '';
      document.getElementById('product-name').value = p.name || '';
      document.getElementById('product-category').value = p.category || '';
      document.getElementById('product-price').value = p.price ?? p.unitPrice ?? '';
      document.getElementById('product-stock').value = p.current_stock ?? p.currentStock ?? 0;
      document.getElementById('product-reorder').value = p.reorder_level ?? p.reorderLevel ?? 10;
      document.getElementById('product-description').value = p.description || '';

      document.getElementById('product-modal-backdrop').classList.add('active');
    }
  } catch (error) {
    showToast(error.message || 'Failed to fetch product details', 'error');
  }
}

function closeProductModal() {
  document.getElementById('product-modal-backdrop').classList.remove('active');
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('product-id').value;

  const payload = {
    sku: document.getElementById('product-sku').value.trim(),
    name: document.getElementById('product-name').value.trim(),
    category: document.getElementById('product-category').value.trim() || 'General',
    price: parseFloat(document.getElementById('product-price').value),
    current_stock: parseInt(document.getElementById('product-stock').value, 10),
    reorder_level: parseInt(document.getElementById('product-reorder').value, 10),
    description: document.getElementById('product-description').value.trim() || undefined,
  };

  const btn = document.getElementById('btn-save-product');
  btn.disabled = true;

  try {
    if (id) {
      await api.put(`/products/${id}`, payload);
      showToast('Product updated successfully', 'success');
    } else {
      await api.post('/products', payload);
      showToast('Product created successfully', 'success');
    }
    closeProductModal();
    loadProducts(currentPage);
  } catch (error) {
    showToast(error.message || 'Failed to save product', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function confirmDeleteProduct(id, name) {
  if (confirm(`Are you sure you want to delete product "${name}"?`)) {
    try {
      await api.delete(`/products/${id}`);
      showToast(`Product "${name}" deleted`, 'success');
      loadProducts(currentPage);
    } catch (error) {
      showToast(error.message || 'Failed to delete product', 'error');
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
