const GOOGLE_DATABASE_URL = "PASTE_YOUR_NEW_EXEC_LINK_HERE";

// CLOUD SYNC: Instantly updates your phone's local memory with your Google Sheet credentials
if (GOOGLE_DATABASE_URL && GOOGLE_DATABASE_URL !== "PASTE_YOUR_NEW_EXEC_LINK_HERE") {
  fetch(GOOGLE_DATABASE_URL)
    .then(res => res.json())
    .then(data => {
      if (data && data.username) {
        let localSettings = JSON.parse(localStorage.getItem('neonstore_settings') || '{}');
        localSettings.username = data.username;
        localSettings.password = data.password;
        localSettings.upiId = data.upiId;
        localStorage.setItem('neonstore_settings', JSON.stringify(localSettings));
      }
    }).catch(e => console.log("Cloud sync paused:", e));
}
// ========== ADMIN DASHBOARD JS ==========

// Check authentication
if (localStorage.getItem('neonstore_admin_logged') !== 'true') {
  window.location.href = 'login.html';
}

let orders = JSON.parse(localStorage.getItem('neonstore_orders') || '[]');
let customers = JSON.parse(localStorage.getItem('neonstore_customers') || '[]');
let products = JSON.parse(localStorage.getItem('neonstore_products') || JSON.stringify(DEFAULT_PRODUCTS));
let settings = JSON.parse(localStorage.getItem('neonstore_settings') || '{"upiId":"neonstore@paytm","shopName":"NEON STORE","phone":"+91 98765 43210","email":"contact@neonstore.com","address":"Main Market, Your City"}');

let salesChartInstance = null;
let categoryChartInstance = null;
let topProductsChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  // Load demo orders if none exist (for first-time admin experience)
  if (orders.length === 0) {
    seedDemoData();
  }
  
  refreshAll();
  loadSettings();
  initCharts();
});

function seedDemoData() {
  const demoCustomers = [
    {name:"Rahul Sharma", phone:"9876543210", email:"rahul@example.com", pincode:"110001", address:"123 Main St, New Delhi"},
    {name:"Priya Patel", phone:"9876543211", email:"priya@example.com", pincode:"400001", address:"45 Park Road, Mumbai"},
    {name:"Amit Kumar", phone:"9876543212", email:"amit@example.com", pincode:"560001", address:"78 MG Road, Bangalore"},
    {name:"Sneha Singh", phone:"9876543213", email:"sneha@example.com", pincode:"700001", address:"34 Park St, Kolkata"},
    {name:"Vikram Joshi", phone:"9876543214", email:"vikram@example.com", pincode:"500001", address:"56 Banjara Hills, Hyderabad"}
  ];
  
  const statuses = ['delivered', 'shipped', 'processing', 'new', 'delivered', 'delivered'];
  const payments = ['cod', 'upi', 'cod', 'upi', 'cod'];
  
  for (let i = 0; i < 8; i++) {
    const cust = demoCustomers[i % demoCustomers.length];
    const prod1 = products[i % products.length];
    const prod2 = products[(i + 3) % products.length];
    const qty1 = Math.floor(Math.random() * 3) + 1;
    const qty2 = Math.floor(Math.random() * 2) + 1;
    const items = [
      {id: prod1.id, name: prod1.name, price: prod1.price, icon: prod1.icon, quantity: qty1},
      {id: prod2.id, name: prod2.name, price: prod2.price, icon: prod2.icon, quantity: qty2}
    ];
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const discount = Math.floor(subtotal * 0.05);
    const daysAgo = Math.floor(Math.random() * 20);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    orders.push({
      id: 'NS' + (Date.now() + i).toString().slice(-8),
      customer: cust,
      items: items,
      subtotal: subtotal,
      discount: discount,
      total: subtotal - discount,
      paymentMethod: payments[i % payments.length],
      paymentStatus: payments[i % payments.length] === 'cod' ? 'pending' : 'verified',
      orderStatus: statuses[i % statuses.length],
      createdAt: date.toISOString()
    });
  }
  
  // Add demo customers
  demoCustomers.forEach(c => {
    const custOrders = orders.filter(o => o.customer.phone === c.phone);
    customers.push({
      ...c,
      totalOrders: custOrders.length,
      totalSpent: custOrders.reduce((s, o) => s + o.total, 0),
      firstOrder: custOrders[0]?.createdAt || new Date().toISOString()
    });
  });
  
  localStorage.setItem('neonstore_orders', JSON.stringify(orders));
  localStorage.setItem('neonstore_customers', JSON.stringify(customers));
}

function refreshAll() {
  // Reload data from storage
  orders = JSON.parse(localStorage.getItem('neonstore_orders') || '[]');
  customers = JSON.parse(localStorage.getItem('neonstore_customers') || '[]');
  products = JSON.parse(localStorage.getItem('neonstore_products') || JSON.stringify(DEFAULT_PRODUCTS));
  
  renderOverviewStats();
  renderRecentOrders();
  renderOrders();
  renderProducts();
  renderCustomers();
  renderReports();
  
  // Update badges
  const newOrders = orders.filter(o => o.orderStatus === 'new').length;
  document.getElementById('ordersBadge').textContent = newOrders;
  if (newOrders > 0) document.getElementById('notifDot').classList.add('show');
}

// ========== TAB SWITCHING ==========
function switchTab(tabName, linkEl) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  if (linkEl) linkEl.classList.add('active');
  
  const titles = {
    overview: ['Dashboard Overview', 'Welcome back, Admin!'],
    orders: ['Orders Management', 'Manage all your orders here'],
    products: ['Product Catalog', 'Add, edit, and manage products'],
    customers: ['Customer Database', 'Your loyal customers'],
    reports: ['Sales Reports', 'Track your business performance'],
    settings: ['Settings', 'Configure your store']
  };
  document.getElementById('pageTitle').textContent = titles[tabName][0];
  document.getElementById('pageSubtitle').textContent = titles[tabName][1];
  
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('active');
  
  // Re-initialize charts when tab is opened
  if (tabName === 'overview') setTimeout(initCharts, 100);
  if (tabName === 'reports') setTimeout(initTopProductsChart, 100);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('neonstore_admin_logged');
    window.location.href = 'login.html';
  }
}

// ========== OVERVIEW STATS ==========
function renderOverviewStats() {
  const totalRev = orders.reduce((s, o) => s + o.total, 0);
  document.getElementById('totalOrders').textContent = orders.length;
  document.getElementById('totalRevenue').textContent = '₹' + totalRev.toLocaleString('en-IN');
  document.getElementById('totalCustomers').textContent = customers.length;
  document.getElementById('totalProducts').textContent = products.length;
}

function renderRecentOrders() {
  const recent = orders.slice(0, 5);
  const container = document.getElementById('recentOrdersList');
  if (recent.length === 0) {
    container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-gray);">No orders yet</div>';
    return;
  }
  container.innerHTML = recent.map(o => `
    <div class="recent-order-item">
      <div class="recent-order-avatar">${o.customer.name.charAt(0)}</div>
      <div class="recent-order-info">
        <h4>${o.customer.name}</h4>
        <p>#${o.id} • ${o.items.length} items • ${formatDate(o.createdAt)}</p>
      </div>
      <span class="status-badge status-${o.orderStatus}">${o.orderStatus}</span>
      <div class="recent-order-amount">₹${o.total}</div>
    </div>
  `).join('');
}

// ========== ORDERS ==========
function renderOrders() {
  filterOrders();
}

function filterOrders() {
  const status = document.getElementById('orderStatusFilter').value;
  const search = document.getElementById('orderSearch').value.toLowerCase();
  
  let filtered = orders;
  if (status !== 'all') filtered = filtered.filter(o => o.orderStatus === status);
  if (search) filtered = filtered.filter(o => 
    o.id.toLowerCase().includes(search) || 
    o.customer.phone.includes(search) ||
    o.customer.name.toLowerCase().includes(search)
  );
  
  const tbody = document.getElementById('ordersTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-gray);">No orders found</td></tr>';
    return;
  }
  
  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>
        <div>${o.customer.name}</div>
        <small style="color:var(--text-gray);">${o.customer.phone}</small>
      </td>
      <td>${o.items.length} items</td>
      <td><strong>₹${o.total}</strong></td>
      <td>
        ${o.paymentMethod === 'cod' ? '<span style="color:#ffc107;"><i class="fas fa-money-bill"></i> COD</span>' : '<span style="color:var(--neon-purple);"><i class="fas fa-qrcode"></i> UPI</span>'}
      </td>
      <td><span class="status-badge status-${o.orderStatus}">${o.orderStatus}</span></td>
      <td>${formatDate(o.createdAt)}</td>
      <td>
        <button class="action-btn" onclick="viewOrder('${o.id}')" title="View"><i class="fas fa-eye"></i></button>
        <button class="action-btn delete" onclick="deleteOrder('${o.id}')" title="Delete"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

function viewOrder(orderId) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  document.getElementById('orderDetailBody').innerHTML = `
    <div class="order-detail">
      <h2>Order #${order.id}</h2>
      <p style="color:var(--text-gray);margin-bottom:1.5rem;">${formatDate(order.createdAt)}</p>
      
      <div class="order-detail-section">
        <h4><i class="fas fa-user"></i> Customer Details</h4>
        <p><strong>Name:</strong> ${order.customer.name}</p>
        <p><strong>Phone:</strong> ${order.customer.phone}</p>
        <p><strong>Email:</strong> ${order.customer.email || 'N/A'}</p>
        <p><strong>Address:</strong> ${order.customer.address}</p>
        <p><strong>Pincode:</strong> ${order.customer.pincode}</p>
      </div>
      
      <div class="order-detail-section">
        <h4><i class="fas fa-box"></i> Order Items</h4>
        ${order.items.map(item => `
          <div class="order-item-row">
            <span><i class="fas ${item.icon}" style="color:var(--neon-blue);"></i> ${item.name} × ${item.quantity}</span>
            <span>₹${item.price * item.quantity}</span>
          </div>
        `).join('')}
        <div class="order-item-row" style="margin-top:0.5rem;font-weight:bold;">
          <span>Total Amount</span>
          <span style="color:var(--neon-blue);font-size:1.2rem;">₹${order.total}</span>
        </div>
      </div>
      
      <div class="order-detail-section">
        <h4><i class="fas fa-credit-card"></i> Payment</h4>
        <p><strong>Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI Payment'}</p>
        <p><strong>Status:</strong> ${order.paymentStatus}</p>
      </div>
      
      <div class="order-detail-section">
        <h4><i class="fas fa-truck"></i> Update Order Status</h4>
        <div class="status-update">
          <button class="btn-primary-small" onclick="updateOrderStatus('${order.id}', 'processing')">Processing</button>
          <button class="btn-primary-small" onclick="updateOrderStatus('${order.id}', 'shipped')">Shipped</button>
          <button class="btn-primary-small" onclick="updateOrderStatus('${order.id}', 'delivered')">Delivered</button>
          <button class="btn-danger" onclick="updateOrderStatus('${order.id}', 'cancelled')">Cancel</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('orderDetailModal').classList.add('active');
}

function closeOrderDetail() {
  document.getElementById('orderDetailModal').classList.remove('active');
}

function updateOrderStatus(orderId, newStatus) {
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.orderStatus = newStatus;
    localStorage.setItem('neonstore_orders', JSON.stringify(orders));
    showToast(`Order status updated to: ${newStatus}`);
    closeOrderDetail();
    refreshAll();
  }
}

function deleteOrder(orderId) {
  if (!confirm('Delete this order?')) return;
  orders = orders.filter(o => o.id !== orderId);
  localStorage.setItem('neonstore_orders', JSON.stringify(orders));
  showToast('Order deleted');
  refreshAll();
}

// ========== PRODUCTS ==========
function renderProducts() {
  const grid = document.getElementById('adminProductsGrid');
  if (!grid) return;
  grid.innerHTML = products.map(p => `
    <div class="admin-product-card">
      <div class="admin-product-image">
        <i class="fas ${p.icon}"></i>
      </div>
      <div class="admin-product-info">
        <h4>${p.name}</h4>
        <div class="price-row">
          <span>₹${p.price}</span>
          <span class="stock">Stock: ${p.stock || 0}</span>
        </div>
        <div class="admin-product-actions">
          <button class="edit-btn" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i> Edit</button>
          <button class="delete-btn" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

function openProductForm(productId = null) {
  document.getElementById('productFormTitle').textContent = productId ? 'Edit Product' : 'Add Product';
  if (productId) {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    document.getElementById('productId').value = p.id;
    document.getElementById('productName').value = p.name;
    document.getElementById('productCategory').value = p.category;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productOriginalPrice').value = p.originalPrice || '';
    document.getElementById('productStock').value = p.stock || 10;
    document.getElementById('productIcon').value = p.icon;
    document.getElementById('productDescription').value = p.description;
    document.getElementById('productBadge').value = p.badge || '';
    document.getElementById('productRating').value = p.rating || 4.5;
  } else {
    document.querySelectorAll('#productFormModal input, #productFormModal textarea').forEach(el => el.value = '');
    document.getElementById('productId').value = '';
    document.getElementById('productIcon').value = 'fa-box';
    document.getElementById('productStock').value = 10;
    document.getElementById('productRating').value = 4.5;
  }
  document.getElementById('productFormModal').classList.add('active');
}

function closeProductForm() {
  document.getElementById('productFormModal').classList.remove('active');
}

function editProduct(id) {
  openProductForm(id);
}

function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const productData = {
    id: id ? parseInt(id) : Date.now(),
    name: document.getElementById('productName').value,
    category: document.getElementById('productCategory').value,
    price: parseInt(document.getElementById('productPrice').value),
    originalPrice: parseInt(document.getElementById('productOriginalPrice').value) || null,
    stock: parseInt(document.getElementById('productStock').value),
    icon: document.getElementById('productIcon').value || 'fa-box',
    description: document.getElementById('productDescription').value,
    badge: document.getElementById('productBadge').value || null,
    rating: parseFloat(document.getElementById('productRating').value),
    reviews: Math.floor(Math.random() * 300) + 50
  };
  
  if (id) {
    const idx = products.findIndex(p => p.id === parseInt(id));
    products[idx] = productData;
    showToast('✓ Product updated successfully!');
  } else {
    products.push(productData);
    showToast('✓ Product added successfully!');
  }
  
  localStorage.setItem('neonstore_products', JSON.stringify(products));
  closeProductForm();
  refreshAll();
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  products = products.filter(p => p.id !== id);
  localStorage.setItem('neonstore_products', JSON.stringify(products));
  showToast('Product deleted');
  refreshAll();
}

// ========== CUSTOMERS ==========
function renderCustomers() {
  const search = (document.getElementById('custSearch')?.value || '').toLowerCase();
  const filtered = customers.filter(c => 
    !search || c.name.toLowerCase().includes(search) || c.phone.includes(search)
  );
  
  const tbody = document.getElementById('customersTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-gray);">No customers yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.phone}</td>
      <td>${c.email || 'N/A'}</td>
      <td>${c.pincode}</td>
      <td>${c.totalOrders}</td>
      <td><strong style="color:var(--neon-blue);">₹${c.totalSpent.toLocaleString('en-IN')}</strong></td>
    </tr>
  `).join('');
}

// ========== REPORTS ==========
function renderReports() {
  const now = new Date();
  const today = now.toDateString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  
  const todayRev = orders.filter(o => new Date(o.createdAt).toDateString() === today).reduce((s, o) => s + o.total, 0);
  const weekRev = orders.filter(o => new Date(o.createdAt) >= weekAgo).reduce((s, o) => s + o.total, 0);
  const monthRev = orders.filter(o => new Date(o.createdAt) >= monthAgo).reduce((s, o) => s + o.total, 0);
  const avgOrder = orders.length > 0 ? Math.floor(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0;
  
  document.getElementById('todayRevenue').textContent = '₹' + todayRev.toLocaleString('en-IN');
  document.getElementById('weekRevenue').textContent = '₹' + weekRev.toLocaleString('en-IN');
  document.getElementById('monthRevenue').textContent = '₹' + monthRev.toLocaleString('en-IN');
  document.getElementById('avgOrder').textContent = '₹' + avgOrder.toLocaleString('en-IN');
}

function initTopProductsChart() {
  const productSales = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
    });
  });
  
  const sorted = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 6);
  
  const ctx = document.getElementById('topProductsChart');
  if (!ctx) return;
  if (topProductsChartInstance) topProductsChartInstance.destroy();
  
  topProductsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map(([name]) => name.length > 20 ? name.substring(0, 20) + '...' : name),
      datasets: [{
        label: 'Units Sold',
        data: sorted.map(([, count]) => count),
        backgroundColor: ['#00d4ff','#b026ff','#ff0080','#00ff88','#ffc107','#ff5722'],
        borderRadius: 8
      }]
    },
    options: chartOptions('bar')
  });
}

// ========== CHARTS ==========
function initCharts() {
  // Sales over time (last 7 days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d);
  }
  
  const salesData = last7Days.map(day => {
    return orders.filter(o => new Date(o.createdAt).toDateString() === day.toDateString())
                 .reduce((s, o) => s + o.total, 0);
  });
  
  const salesCtx = document.getElementById('salesChart');
  if (salesCtx) {
    if (salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: last7Days.map(d => d.toLocaleDateString('en-IN', {weekday: 'short', day: 'numeric'})),
        datasets: [{
          label: 'Daily Revenue (₹)',
          data: salesData,
          borderColor: '#00d4ff',
          backgroundColor: 'rgba(0, 212, 255, 0.15)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#b026ff',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: chartOptions('line')
    });
  }
  
  // Category chart
  const categoryCounts = {};
  orders.forEach(o => o.items.forEach(item => {
    const prod = products.find(p => p.id === item.id);
    if (prod) {
      categoryCounts[prod.category] = (categoryCounts[prod.category] || 0) + item.quantity;
    }
  }));
  
  const catCtx = document.getElementById('categoryChart');
  if (catCtx) {
    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryCounts).map(c => c.charAt(0).toUpperCase() + c.slice(1)),
        datasets: [{
          data: Object.values(categoryCounts),
          backgroundColor: ['#00d4ff','#b026ff','#ff0080','#00ff88','#ffc107'],
          borderWidth: 0
        }]
      },
      options: chartOptions('doughnut')
    });
  }
}

function chartOptions(type) {
  const base = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#a0a0c0', font: { family: 'Poppins' } }
      }
    }
  };
  if (type !== 'doughnut') {
    base.scales = {
      x: {
        ticks: { color: '#a0a0c0' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      },
      y: {
        ticks: { color: '#a0a0c0' },
        grid: { color: 'rgba(255,255,255,0.05)' }
      }
    };
  }
  return base;
}

// ========== EXPORT ==========
function exportData(type) {
  let csv = '';
  let filename = '';
  
  if (type === 'orders') {
    csv = 'Order ID,Customer,Phone,Items,Total,Payment,Status,Date\n';
    orders.forEach(o => {
      csv += `"${o.id}","${o.customer.name}","${o.customer.phone}","${o.items.length}","${o.total}","${o.paymentMethod}","${o.orderStatus}","${formatDate(o.createdAt)}"\n`;
    });
    filename = 'orders.csv';
  } else if (type === 'customers') {
    csv = 'Name,Phone,Email,Pincode,Total Orders,Total Spent\n';
    customers.forEach(c => {
      csv += `"${c.name}","${c.phone}","${c.email || ''}","${c.pincode}","${c.totalOrders}","${c.totalSpent}"\n`;
    });
    filename = 'customers.csv';
  } else if (type === 'products') {
    csv = 'Name,Category,Price,Stock,Description\n';
    products.forEach(p => {
      csv += `"${p.name}","${p.category}","${p.price}","${p.stock || 0}","${p.description}"\n`;
    });
    filename = 'products.csv';
  }
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✓ Data exported successfully!');
}

// ========== SETTINGS ==========
function loadSettings() {
  document.getElementById('settingsShopName').value = settings.shopName || '';
  document.getElementById('settingsUpiId').value = settings.upiId || '';
  document.getElementById('settingsPhone').value = settings.phone || '';
  document.getElementById('settingsEmail').value = settings.email || '';
  document.getElementById('settingsAddress').value = settings.address || '';
}

function saveSettings() {
  settings = {
    shopName: document.getElementById('settingsShopName').value,
    upiId: document.getElementById('settingsUpiId').value,
    phone: document.getElementById('settingsPhone').value,
    email: document.getElementById('settingsEmail').value,
    address: document.getElementById('settingsAddress').value
  };
  localStorage.setItem('neonstore_settings', JSON.stringify(settings));
  showToast('✓ Settings saved successfully!');
}

function changePassword() {
  const newUser = document.getElementById('newUsername').value.trim();
  const newPass = document.getElementById('newPassword').value.trim();
  if (!newUser || !newPass) return showToast('⚠ Please fill both fields');
  if (newPass.length < 6) return showToast('⚠ Password must be at least 6 characters');
  
  localStorage.setItem('neonstore_admin', JSON.stringify({username: newUser, password: newPass}));
  showToast('✓ Credentials updated! Please login again.');
  setTimeout(() => {
    localStorage.removeItem('neonstore_admin_logged');
    window.location.href = 'login.html';
  }, 2000);
}

function resetAllData() {
  if (!confirm('⚠ WARNING: This will delete ALL orders, customers, and products! Continue?')) return;
  if (!confirm('Are you ABSOLUTELY sure? This cannot be undone!')) return;
  
  localStorage.removeItem('neonstore_orders');
  localStorage.removeItem('neonstore_customers');
  localStorage.removeItem('neonstore_products');
  showToast('✓ All data reset. Reloading...');
  setTimeout(() => location.reload(), 1500);
}

// ========== HELPERS ==========
function formatDate(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Close modals on background click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});
