// ========== MAIN APPLICATION LOGIC ==========

let currentFilter = 'all';
let cart = JSON.parse(localStorage.getItem('neonstore_cart') || '[]');

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  renderProducts(PRODUCTS);
  updateCartCount();
  initScrollAnimations();
  initNavbarScroll();
});

// ========== PRODUCT RENDERING ==========
function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  
  if (products.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-gray);"><i class="fas fa-box-open" style="font-size:4rem;margin-bottom:1rem;display:block;"></i><h3>No products found</h3></div>';
    return;
  }
  
  grid.innerHTML = products.map((p, index) => `
    <div class="product-card" style="animation-delay: ${index * 0.1}s" onclick="openProductModal(${p.id})">
      <div class="product-image">
        ${p.badge ? `<div class="product-badge ${p.badge === 'NEW' ? 'new' : ''}">${p.badge}</div>` : ''}
        <i class="fas ${p.icon} product-icon"></i>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description.substring(0, 60)}...</p>
        <div class="product-rating">
          ${getStars(p.rating)}
          <span>(${p.reviews})</span>
        </div>
        <div class="product-footer">
          <div class="product-price">
            <span class="price-current">₹${p.price}</span>
            ${p.originalPrice ? `<span class="price-original">₹${p.originalPrice}</span>` : ''}
          </div>
          <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${p.id})">
            <i class="fas fa-cart-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function getStars(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
  if (halfStar) stars += '<i class="fas fa-star-half-alt"></i>';
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star"></i>';
  return stars;
}

// ========== FILTERING ==========
function filterProducts(category, btnEl) {
  currentFilter = category;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  
  let filtered = category === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.category === category);
  renderProducts(filtered);
}

function filterByCategory(category) {
  document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => {
    const btn = document.querySelector(`.filter-tab[data-filter="${category}"]`);
    filterProducts(category, btn);
  }, 500);
}

function searchProducts() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  if (!query) {
    renderProducts(PRODUCTS);
    return;
  }
  const filtered = PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query) ||
    p.category.toLowerCase().includes(query)
  );
  renderProducts(filtered);
}

// ========== CART MANAGEMENT ==========
function addToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      icon: product.icon,
      quantity: 1
    });
  }
  
  localStorage.setItem('neonstore_cart', JSON.stringify(cart));
  updateCartCount();
  showToast(`✓ ${product.name} added to cart!`);
}

function updateCartCount() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const el = document.getElementById('cartCount');
  if (el) el.textContent = count;
}

// ========== MODAL ==========
function openProductModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  const modal = document.getElementById('productModal');
  const body = document.getElementById('modalBody');
  
  body.innerHTML = `
    <div class="modal-product">
      <div class="modal-image">
        <i class="fas ${product.icon}" style="background:var(--gradient);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;"></i>
      </div>
      <div class="modal-info">
        <div class="product-category">${product.category}</div>
        <h2>${product.name}</h2>
        <div class="product-rating">
          ${getStars(product.rating)}
          <span>(${product.reviews} reviews)</span>
        </div>
        <div class="modal-price">
          ₹${product.price}
          ${product.originalPrice ? `<span style="font-size:1.2rem;color:var(--text-dim);text-decoration:line-through;margin-left:1rem;-webkit-text-fill-color:var(--text-dim);">₹${product.originalPrice}</span>` : ''}
        </div>
        <p>${product.description}</p>
        <p style="color:var(--neon-blue);"><i class="fas fa-box"></i> In Stock: ${product.stock} units</p>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="addToCart(${product.id}); closeModal();">
            <i class="fas fa-cart-plus"></i> Add to Cart
          </button>
          <button class="btn btn-secondary" onclick="buyNow(${product.id})">
            <i class="fas fa-bolt"></i> Buy Now
          </button>
        </div>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('productModal').classList.remove('active');
}

function buyNow(productId) {
  addToCart(productId);
  closeModal();
  setTimeout(() => window.location.href = 'cart.html', 500);
}

// Close modal on background click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('productModal');
  if (modal && e.target === modal) closeModal();
});

// ========== UI HELPERS ==========
function toggleMenu() {
  document.getElementById('navMenu').classList.toggle('active');
}

function toggleSearch() {
  document.getElementById('searchBar').classList.toggle('active');
  setTimeout(() => {
    const input = document.getElementById('searchInput');
    if (input) input.focus();
  }, 100);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = `<i class="fas fa-check-circle"></i><span>${message}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ========== SCROLL EFFECTS ==========
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.category-card, .feature-card, .contact-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease-out';
    observer.observe(el);
  });
}

function initNavbarScroll() {
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    if (window.scrollY > 100) {
      navbar.style.padding = '0.5rem 0';
      navbar.style.background = 'rgba(5, 5, 20, 0.95)';
    } else {
      navbar.style.padding = '0';
      navbar.style.background = 'rgba(10, 10, 31, 0.85)';
    }
    
    // Highlight active nav link based on section
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 150 && rect.bottom >= 150) {
        current = section.getAttribute('id');
      }
    });
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}
