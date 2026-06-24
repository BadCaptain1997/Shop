// ========== CART CHECKOUT LOGIC ==========

let cart = JSON.parse(localStorage.getItem('neonstore_cart') || '[]');

// Demo UPI ID - shopkeeper can change this in admin settings
const SHOP_SETTINGS = JSON.parse(localStorage.getItem('neonstore_settings') || '{"upiId":"neonstore@paytm","shopName":"NEON STORE"}');

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});

function renderCart() {
  const container = document.getElementById('cartItems');
  const customerForm = document.getElementById('customerForm');
  const paymentSection = document.getElementById('paymentSection');
  const placeBtn = document.getElementById('placeOrderBtn');
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started!</p>
        <a href="index.html" class="btn btn-primary">
          <i class="fas fa-store"></i> Browse Products
        </a>
      </div>
    `;
    customerForm.style.display = 'none';
    paymentSection.style.display = 'none';
    placeBtn.style.display = 'none';
    updateSummary();
    return;
  }
  
  customerForm.style.display = 'block';
  paymentSection.style.display = 'block';
  placeBtn.style.display = 'flex';
  
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-image">
        <i class="fas ${item.icon}"></i>
      </div>
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p class="cart-price">₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}</p>
      </div>
      <div class="cart-item-qty">
        <button onclick="changeQty(${item.id}, -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="changeQty(${item.id}, 1)">+</button>
      </div>
      <button class="remove-btn" onclick="removeFromCart(${item.id})">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
  
  updateSummary();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  localStorage.setItem('neonstore_cart', JSON.stringify(cart));
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  localStorage.setItem('neonstore_cart', JSON.stringify(cart));
  showToast('Item removed from cart');
  renderCart();
}

function updateSummary() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Math.floor(subtotal * 0.05); // 5% discount
  const total = subtotal - discount;
  
  document.getElementById('subtotal').textContent = `₹${subtotal}`;
  document.getElementById('discount').textContent = `- ₹${discount}`;
  document.getElementById('total').textContent = `₹${total}`;
  document.getElementById('upiAmount').textContent = `₹${total}`;
  
  // Update UPI ID display
  const upiIdEl = document.getElementById('upiId');
  if (upiIdEl) upiIdEl.textContent = SHOP_SETTINGS.upiId;
}

function switchPayment(method) {
  document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
  event.currentTarget.closest('.payment-option').classList.add('active');
  
  const upiSection = document.getElementById('upiSection');
  if (method === 'upi') {
    upiSection.style.display = 'block';
    generateQR();
  } else {
    upiSection.style.display = 'none';
  }
}

function generateQR() {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.95;
  const upiId = SHOP_SETTINGS.upiId;
  const shopName = SHOP_SETTINGS.shopName;
  
  // Build UPI payment URL (standard format)
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${Math.floor(total)}&cu=INR&tn=Order Payment`;
  
  // Generate QR using free API (qrserver.com - no API key needed)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiUrl)}&bgcolor=ffffff&color=000000&margin=10`;
  
  const qrBox = document.getElementById('qrCodeBox');
  qrBox.innerHTML = `<img src="${qrUrl}" alt="UPI QR Code" style="width:100%;height:100%;">`;
}

function copyUPI() {
  navigator.clipboard.writeText(SHOP_SETTINGS.upiId).then(() => {
    showToast('✓ UPI ID copied to clipboard!');
  });
}

function placeOrder() {
  // Validate
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const pincode = document.getElementById('custPincode').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  
  if (!name) return showToast('⚠ Please enter your name');
  if (!phone || phone.length !== 10) return showToast('⚠ Please enter a valid 10-digit phone number');
  if (!pincode || pincode.length !== 6) return showToast('⚠ Please enter a valid 6-digit pincode');
  if (!address) return showToast('⚠ Please enter your address');
  
  const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Math.floor(subtotal * 0.05);
  const total = subtotal - discount;
  
  // Create order
  const order = {
    id: 'NS' + Date.now().toString().slice(-8),
    customer: { name, phone, email, pincode, address },
    items: [...cart],
    subtotal,
    discount,
    total,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'awaiting_verification',
    orderStatus: 'new',
    createdAt: new Date().toISOString()
  };
  
  // Save order to localStorage (admin will see these)
  const orders = JSON.parse(localStorage.getItem('neonstore_orders') || '[]');
  orders.unshift(order);
  localStorage.setItem('neonstore_orders', JSON.stringify(orders));
  
  // Save customer
  const customers = JSON.parse(localStorage.getItem('neonstore_customers') || '[]');
  const existingCust = customers.find(c => c.phone === phone);
  if (!existingCust) {
    customers.push({ ...order.customer, totalOrders: 1, totalSpent: total, firstOrder: order.createdAt });
  } else {
    existingCust.totalOrders++;
    existingCust.totalSpent += total;
  }
  localStorage.setItem('neonstore_customers', JSON.stringify(customers));
  
  // Clear cart
  cart = [];
  localStorage.setItem('neonstore_cart', JSON.stringify(cart));
  
  // Show success
  document.getElementById('orderId').textContent = '#' + order.id;
  document.getElementById('successModal').classList.add('active');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
