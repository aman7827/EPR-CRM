/* ==========================================================================
   MINI ERP + CRM - INVENTORY MODULE (inventory.js)
   Stock In, Stock Out, Inventory Overview & Movement Audit Logs
   ========================================================================== */

let activeTab = 'overview';
let movementsPage = 1;
const limit = 10;
let productsList = [];

document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    loadInventoryOverview();
    preloadProducts();
  }
});

async function preloadProducts() {
  try {
    const res = await api.get('/products', { limit: 100 });
    if (res.success && Array.isArray(res.data)) {
      productsList = res.data;
      populateProductSelect();
      updateInventoryStatCards(res.data);
    }
  } catch (error) {
    console.error('Failed to preload products list', error);
  }
}

function updateInventoryStatCards(products) {
  const totalProducts = products.length;
  let inStockCount = 0;
  let lowStockCount = 0;

  products.forEach(p => {
    const stock = parseInt(p.current_stock ?? p.currentStock ?? 0, 10);
    const reorder = parseInt(p.reorder_level ?? p.reorderLevel ?? 10, 10);

    if (stock > reorder) {
      inStockCount++;
    } else {
      lowStockCount++;
    }
  });

  const elTotal = document.getElementById('inv-metric-products');
  if (elTotal) elTotal.textContent = totalProducts;

  const elInStock = document.getElementById('inv-metric-instock');
  if (elInStock) elInStock.textContent = inStockCount;

  const elLowStock = document.getElementById('inv-metric-lowstock');
  if (elLowStock) elLowStock.textContent = lowStockCount;

  const elVal = document.getElementById('inv-metric-value');
  if (elVal) elVal.textContent = lowStockCount > 0 ? `${lowStockCount} Alerts` : 'Optimal';
}

function populateProductSelect() {
  const select = document.getElementById('adjust-product-id');
  if (!select) return;
  select.innerHTML = `<option value="">Select a product...</option>` +
    productsList.map(p => {
      const stock = p.current_stock ?? p.currentStock ?? 0;
      return `<option value="${p.id}">${escapeHtml(p.name)} (${p.sku}) - Stock: ${stock}</option>`;
    }).join('');
}

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.segmented-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');

  if (tab === 'overview') {
    document.getElementById('overview-section').style.display = 'block';
    document.getElementById('movements-section').style.display = 'none';
    loadInventoryOverview();
  } else {
    document.getElementById('overview-section').style.display = 'none';
    document.getElementById('movements-section').style.display = 'block';
    loadStockMovements(1);
  }
}

async function loadInventoryOverview() {
  const tbody = document.getElementById('inventory-overview-tbody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center; padding:1.5rem;">
        Loading stock overview...
      </td>
    </tr>
  `;

  try {
    const res = await api.get('/inventory');
    if (res.success && Array.isArray(res.data)) {
      renderOverviewTable(res.data);
    }
  } catch (error) {
    showToast(error.message || 'Failed to load inventory overview', 'error');
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger-color); text-align:center;">Failed to load overview data</td></tr>`;
  }
}

function renderOverviewTable(items) {
  const tbody = document.getElementById('inventory-overview-tbody');
  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:2rem; color:var(--secondary-text);">
          No inventory items available. Add products to track stock levels.
        </td>
      </tr>
    `;
    return;
  }

  const canAdjust = hasRole('ADMIN', 'WAREHOUSE');

  tbody.innerHTML = items.map(item => {
    const stock = item.current_stock ?? item.currentStock ?? 0;
    const reorder = item.reorder_level ?? item.reorderLevel ?? 10;
    const stockNum = parseInt(stock, 10);
    const reorderNum = parseInt(reorder, 10);

    let stockBadge = '<span class="badge badge-instock">Normal Stock</span>';
    if (stockNum === 0) {
      stockBadge = '<span class="badge badge-outofstock">Out Of Stock</span>';
    } else if (stockNum <= reorderNum) {
      stockBadge = '<span class="badge badge-lowstock">Low Stock</span>';
    }

    return `
      <tr>
        <td><strong>${escapeHtml(item.name || 'Product')}</strong></td>
        <td><code>${escapeHtml(item.sku || 'SKU')}</code></td>
        <td><strong>${stockNum}</strong> Units</td>
        <td><span class="badge badge-secondary">${reorderNum} Units</span></td>
        <td>${stockBadge}</td>
        <td>
          <div class="table-actions">
            ${canAdjust ? `
              <button class="btn btn-sm btn-outline" onclick="openAdjustModal('${item.id}', 'IN')">
                Stock In
              </button>
              <button class="btn btn-sm btn-outline" onclick="openAdjustModal('${item.id}', 'OUT')">
                Stock Out
              </button>
            ` : '<span style="font-size:12px; color:var(--secondary-text);">View Only</span>'}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function loadStockMovements(page = 1) {
  movementsPage = page;
  const tbody = document.getElementById('movements-tbody');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align:center; padding:1.5rem;">
        Loading movement history...
      </td>
    </tr>
  `;

  try {
    const res = await api.get('/inventory/movements', { page: movementsPage, limit });
    if (res.success && Array.isArray(res.data)) {
      renderMovementsTable(res.data);
      renderMovementsPagination(res.meta);
    }
  } catch (error) {
    showToast(error.message || 'Failed to load stock movements history', 'error');
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger-color); text-align:center;">Failed to load movement logs</td></tr>`;
  }
}

function renderMovementsTable(movements) {
  const tbody = document.getElementById('movements-tbody');
  if (movements.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:2rem; color:var(--secondary-text);">
          No stock movements recorded yet.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = movements.map(m => {
    const type = m.movement_type || m.movementType;
    const typeBadge = type === 'IN'
      ? `<span class="badge badge-success">IN</span>`
      : `<span class="badge badge-danger">OUT</span>`;

    const productName = m.product_name || m.product?.name || 'Product';
    const sku = m.sku || m.product?.sku || 'SKU';
    const stockBefore = m.stock_before ?? m.stockBefore ?? '-';
    const stockAfter = m.stock_after ?? m.stockAfter ?? '-';
    const notes = m.notes || m.reason || 'Manual Adjustment';
    const createdAt = m.created_at || m.createdAt;
    const dateStr = createdAt ? new Date(createdAt).toLocaleString() : 'N/A';

    return `
      <tr>
        <td>
          <strong>${escapeHtml(productName)}</strong>
          <div style="font-size:12px; color:var(--secondary-text);"><code>${escapeHtml(sku)}</code></div>
        </td>
        <td>${typeBadge}</td>
        <td><strong>${m.quantity}</strong></td>
        <td><span class="badge badge-secondary">${stockBefore} → ${stockAfter}</span></td>
        <td>${escapeHtml(notes)}</td>
        <td><span style="font-size:12px; color:var(--secondary-text);">${dateStr}</span></td>
      </tr>
    `;
  }).join('');
}

function renderMovementsPagination(meta) {
  const container = document.getElementById('movements-pagination');
  if (!container || !meta) return;

  const { page, totalPages, total } = meta;
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  let html = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; font-size:13px; color:var(--secondary-text);">
      <div>Showing ${startItem} to ${endItem} of ${total} movement logs</div>
      <div style="display:flex; gap:0.3rem;">
        <button class="btn btn-sm btn-outline" ${page <= 1 ? 'disabled' : ''} onclick="loadStockMovements(${page - 1})">Previous</button>
        <button class="btn btn-sm btn-outline" ${page >= totalPages ? 'disabled' : ''} onclick="loadStockMovements(${page + 1})">Next</button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function openAdjustModal(productId = '', type = 'IN') {
  document.getElementById('adjust-form').reset();
  document.getElementById('adjust-type').value = type;
  document.getElementById('adjust-modal-title').textContent = type === 'IN' ? 'Stock In (Receive Inventory)' : 'Stock Out (Issue Inventory)';

  populateProductSelect();
  if (productId) {
    document.getElementById('adjust-product-id').value = productId;
  }

  document.getElementById('adjust-modal-backdrop').classList.add('active');
}

function closeAdjustModal() {
  document.getElementById('adjust-modal-backdrop').classList.remove('active');
}

async function handleStockAdjustSubmit(e) {
  e.preventDefault();
  const productId = document.getElementById('adjust-product-id').value;
  const movementType = document.getElementById('adjust-type').value;
  const quantity = parseInt(document.getElementById('adjust-quantity').value, 10);
  const notes = document.getElementById('adjust-notes').value.trim();

  if (!productId) {
    showToast('Please select a product', 'warning');
    return;
  }

  const btn = document.getElementById('btn-submit-adjust');
  btn.disabled = true;

  try {
    await api.post('/inventory/adjust', { productId, movementType, quantity, notes, reason: notes });
    showToast(`Stock ${movementType === 'IN' ? 'added' : 'removed'} successfully`, 'success');
    closeAdjustModal();
    preloadProducts();
    if (activeTab === 'overview') {
      loadInventoryOverview();
    } else {
      loadStockMovements(1);
    }
  } catch (error) {
    showToast(error.message || 'Failed to adjust stock', 'error');
  } finally {
    btn.disabled = false;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
