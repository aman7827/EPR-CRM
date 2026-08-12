/* ==========================================================================
   MINI ERP + CRM - DASHBOARD MODULE (dashboard.js)
   Fetches summary metrics and low stock warnings
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    loadDashboardData();
  }
});

async function loadDashboardData() {
  try {
    await Promise.allSettled([
      fetchSummary(),
      fetchLowStock()
    ]);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}

/**
 * Fetch KPI Summary Counts
 */
async function fetchSummary() {
  try {
    const res = await api.get('/dashboard/summary');
    if (res.success && res.data) {
      const data = res.data;

      // Card 1: Total Customers
      const elCustomers = document.getElementById('metric-customers');
      if (elCustomers) elCustomers.textContent = data.totalCustomers ?? 0;

      const elActiveCust = document.getElementById('metric-customers-sub');
      if (elActiveCust) elActiveCust.textContent = `Active accounts`;

      // Card 2: Total Products
      const elProducts = document.getElementById('metric-products');
      if (elProducts) elProducts.textContent = data.totalProducts ?? 0;

      const elLowStockSub = document.getElementById('metric-products-sub');
      if (elLowStockSub) elLowStockSub.textContent = `${data.lowStockProductsCount ?? 0} low stock alerts`;

      // Card 3: Low Stock Items
      const elLowStockCount = document.getElementById('metric-low-stock');
      if (elLowStockCount) elLowStockCount.textContent = data.lowStockProductsCount ?? 0;

      // Card 4: Inventory Status
      const elInventory = document.getElementById('metric-inventory');
      if (elInventory) {
        elInventory.textContent = (data.lowStockProductsCount ?? 0) > 0 ? `${data.lowStockProductsCount} Low Stock` : 'Normal';
      }
    }
  } catch (error) {
    console.error('Error fetching summary:', error);
  }
}

/**
 * Fetch Low Stock Items
 */
async function fetchLowStock() {
  const container = document.getElementById('low-stock-table-body');
  if (!container) return;

  try {
    const res = await api.get('/dashboard/low-stock');
    if (res.success && Array.isArray(res.data)) {
      if (res.data.length === 0) {
        container.innerHTML = `
          <tr>
            <td colspan="4" style="text-align:center; padding: 2rem; color: var(--secondary-text);">
              All stock levels normal. No items are below minimum threshold.
            </td>
          </tr>
        `;
        return;
      }

      container.innerHTML = res.data.map(item => `
        <tr>
          <td><strong>${escapeHtml(item.name || 'Product')}</strong></td>
          <td><code>${escapeHtml(item.sku || 'SKU')}</code></td>
          <td><span class="badge badge-warning">${item.current_stock ?? item.currentStock ?? 0} in stock</span></td>
          <td><span class="badge badge-secondary">Threshold: ${item.reorder_level ?? item.reorderLevel ?? 10}</span></td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error fetching low stock:', error);
    container.innerHTML = `<tr><td colspan="4" style="color:var(--danger-color); text-align:center;">Failed to load low stock alerts</td></tr>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
