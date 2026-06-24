// ========================================================
// CART CHECKOUT LOGIC (Cleaned & Fixed)
// ========================================================

// Cloud database (paste your exec link if you use it)
const GOOGLE_DATABASE_URL = "https://script.google.com/macros/s/AKfycbzJ2o3lIwuTiyyBqxZwDoVM6Lw59KLxnsLmSxvLsUOZauOAol2_4tnyWRMuZnsXL2U/exec";

// Load cart from localStorage and coerce numbers
let cart = (function(){
  try {
    return (JSON.parse(localStorage.getItem('neonstore_cart') || '[]')).map(i => ({
      id: i.id,
      name: i.name,
      icon: i.icon,
      price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 0
    }));
  } catch (e) {
    return [];
  }
})();

// Demo settings
const SHOP_SETTINGS = JSON.parse(localStorage.getItem('neonstore_settings') || '{"upiId":"neonstore@paytm","shopName":"NEON STORE"}');
let generatedOTP = null;
let temporaryOrderData = null;
const MY_WHATSAPP_NUMBER = "7509277793";

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
});

function renderCart() {
  const container = document.getElementById('cartItems');
  const customerForm = document.getElementById('customerForm');
  const paymentSection = document.getElementById('paymentSection');
  const placeBtn = document.getElementById('placeOrderBtn');

  if (!container) return;

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
    if (customerForm) customerForm.style.display = 'none';
    if (paymentSection) paymentSection.style.display = 'none';
    if (placeBtn) placeBtn.style.display = 'none';
    updateSummary();
    return;
  }

  if (customerForm) customerForm.style.display = 'block';
  if (paymentSection) paymentSection.style.display = 'block';
  if (placeBtn) placeBtn.style.display = 'flex';

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
  item.quantity = Number(item.quantity) + Number(delta);
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
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const discount = Math.floor(subtotal * 0.05);
  const total = subtotal - discount;

  const subtotalEl = document.getElementById('subtotal');
  const discountEl = document.getElementById('discount');
  const totalEl = document.getElementById('total');
  const upiAmountEl = document.getElementById('upiAmount');

  if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
  if (discountEl) discountEl.textContent = `- ₹${discount}`;
  if (totalEl) totalEl.textContent = `₹${total}`;
  if (upiAmountEl) upiAmountEl.textContent = `₹${total}`;

  const upiIdEl = document.getElementById('upiId');
  if (upiIdEl) upiIdEl.textContent = SHOP_SETTINGS.upiId;
}

function switchPayment(method, evt) {
  if (evt && evt.preventDefault) evt.preventDefault();
  document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
  if (evt && evt.currentTarget) {
    const closestOpt = evt.currentTarget.closest('.payment-option');
    if (closestOpt) closestOpt.classList.add('active');
  }

  const upiSection = document.getElementById('upiSection');
  if (!upiSection) return;
  if (method === 'upi') {
    upiSection.style.display = 'block';
    generateQR();
  } else {
    upiSection.style.display = 'none';
  }
}

function generateQR() {
  const total = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0) * 0.95;
  const upiId = SHOP_SETTINGS.upiId;
  const shopName = SHOP_SETTINGS.shopName;

  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${Math.floor(total)}&cu=INR&tn=Order Payment`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiUrl)}&bgcolor=ffffff&color=000000&margin=10`;

  const qrBox = document.getElementById('qrCodeBox');
  if (qrBox) qrBox.innerHTML = `<img src="${qrUrl}" alt="UPI QR Code" style="width:100%;height:100%;">`;
}

function copyUPI() {
  navigator.clipboard.writeText(SHOP_SETTINGS.upiId).then(() => {
    showToast('✓ UPI ID copied to clipboard!');
  });
}

function placeOrder() {
  if (event && event.preventDefault) event.preventDefault();

  const name = document.getElementById('custName')?.value.trim() || '';
  const phone = document.getElementById('custPhone')?.value.trim() || '';
  const email = document.getElementById('custEmail')?.value.trim() || '';
  const pincode = document.getElementById('custPincode')?.value.trim() || '';
  const address = document.getElementById('custAddress')?.value.trim() || '';

  if (!name) return showToast('⚠ Please enter your name');
  if (!phone || phone.length !== 10) return showToast('⚠ Please enter a valid 10-digit phone number');
  if (!pincode || pincode.length !== 6) return showToast('⚠ Please enter a valid 6-digit pincode');
  if (!address) return showToast('⚠ Please enter your address');

  const paymentElement = document.querySelector('input[name="payment"]:checked');
  const paymentMethod = paymentElement ? paymentElement.value : 'cod';

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  const discount = Math.floor(subtotal * 0.05);
  const total = subtotal - discount;

  if (!generatedOTP) {
    generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
    temporaryOrderData = { name, phone, email, pincode, address, subtotal, discount, total, paymentMethod };

    let verificationText = `Hello! I am confirming my phone number for ${SHOP_SETTINGS.shopName}. My 4-Digit Verification Code is: ${generatedOTP}`;
    let whatsappUrl = `https://api.whatsapp.com/send?phone=${MY_WHATSAPP_NUMBER}&text=${encodeURIComponent(verificationText)}`;

    window.open(whatsappUrl, '_blank');
    showOTPInterface();
    showToast('💬 Verification code sent to WhatsApp draft!');
    return;
  }
}

function showOTPInterface() {
  const placeBtn = document.getElementById('placeOrderBtn');
  if (!placeBtn || document.getElementById('otpVerificationBox')) return;

  const otpBox = document.createElement('div');
  otpBox.id = 'otpVerificationBox';
  otpBox.style.margin = '20px 0';
  otpBox.style.padding = '15px';
  otpBox.style.background = '#1a1a2e';
  otpBox.style.border = '2px dashed #00fff5';
  otpBox.style.borderRadius = '8px';
  otpBox.style.textAlign = 'center';

  otpBox.innerHTML = `
    <h4 style="color:#00fff5;margin-bottom:10px;"><i class="fab fa-whatsapp"></i> Phone Verification</h4>
    <p style="font-size:13px;color:#fff;margin-bottom:10px;">We opened a chat layout on your WhatsApp. Look at the message text, copy the 4-digit code, and enter it here:</p>
    <input type="number" id="enteredOTP" placeholder="XXXX" style="width:60%;padding:10px;border-radius:4px;border:1px solid #00fff5;text-align:center;font-size:18px;letter-spacing:6px;margin-bottom:12px;">
    <br>
    <button onclick="confirmOTPVerification()" style="width:80%;padding:12px;background:#00fff5;color:#000;border:none;border-radius:4px;font-weight:bold;cursor:pointer;text-transform:uppercase;">Verify Code</button>
  `;

  placeBtn.parentNode.insertBefore(otpBox, placeBtn);
  placeBtn.style.display = 'none';
}

function confirmOTPVerification() {
  const userEntered = document.getElementById('enteredOTP')?.value.trim() || '';

  if (userEntered === generatedOTP) {
    showToast('✅ Phone Verified Successfully!');

    let orderIdGenerated = 'NS' + Date.now().toString().slice(-8);
    let itemDetails = cart.map(item => `• ${item.name} (Qty: ${item.quantity}) = ₹${Number(item.price) * Number(item.quantity)}`).join('\n');
    let simpleItemsList = cart.map(item => `${item.name} (x${item.quantity})`).join(', ');

    if (GOOGLE_DATABASE_URL) {
      fetch(GOOGLE_DATABASE_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "placeOrder",
          orderId: orderIdGenerated,
          name: temporaryOrderData.name,
          phone: temporaryOrderData.phone,
          email: temporaryOrderData.email,
          pincode: temporaryOrderData.pincode,
          address: temporaryOrderData.address,
          items: simpleItemsList,
          total: temporaryOrderData.total,
          paymentMethod: temporaryOrderData.paymentMethod,
          date: new Date().toLocaleString('en-IN')
        })
      }).catch(err => console.log("Cloud Save Error: ", err));
    }

    let finalOrderMessage = `*📦 NEW VERIFIED ORDER (${orderIdGenerated})*\n\n` +
                            `*Customer Information:*\n` +
                            `👤 Name: ${temporaryOrderData.name}\n` +
                            `📞 Stated Mobile: ${temporaryOrderData.phone}\n` +
                            `📧 Email: ${temporaryOrderData.email || 'N/A'}\n` +
                            `📍 Address: ${temporaryOrderData.address}, PIN: ${temporaryOrderData.pincode}\n\n` +
                            `*Items Purchased:*\n${itemDetails}\n\n` +
                            `*Financial Total Summary:*\n` +
                            `💰 Subtotal: ₹${temporaryOrderData.subtotal}\n` +
                            `🏷 Discount Applied: ₹${temporaryOrderData.discount}\n` +
                            `💳 Total Amount Payable: ₹${temporaryOrderData.total}\n` +
                            `💵 Payment Choice: ${temporaryOrderData.paymentMethod.toUpperCase()}\n\n` +
                            `*System Verification Token:* ${generatedOTP} (SUCCESS)`;

    let whatsappUrl = `https://api.whatsapp.com/send?phone=${MY_WHATSAPP_NUMBER}&text=${encodeURIComponent(finalOrderMessage)}`;

    cart = [];
    localStorage.setItem('neonstore_cart', JSON.stringify(cart));

    window.open(whatsappUrl, '_blank');

    const verificationBox = document.getElementById('otpVerificationBox');
    if (verificationBox) verificationBox.remove();

    const orderIdEl = document.getElementById('orderId');
    if (orderIdEl) orderIdEl.textContent = '#' + orderIdGenerated;

    const successModal = document.getElementById('successModal');
    if (successModal) successModal.classList.add('active');

    generatedOTP = null;
    temporaryOrderData = null;
  } else {
    showToast('❌ Incorrect Code! Look closely at the text inside your open WhatsApp chat and try again.');
  }
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}
