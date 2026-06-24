// ========== DEMO PRODUCTS DATA ==========
// 🔧 SHOPKEEPER: Yahan apne products edit kar sakte hain
// ya Admin Dashboard se manage karein (recommended)

const DEFAULT_PRODUCTS = [
  // ELECTRONICS
  {
    id: 1,
    name: "Wireless Bluetooth Earbuds",
    category: "electronics",
    icon: "fa-headphones",
    price: 1299,
    originalPrice: 2499,
    rating: 4.5,
    reviews: 234,
    description: "Premium quality wireless earbuds with active noise cancellation and 24-hour battery life.",
    badge: "BESTSELLER",
    stock: 45
  },
  {
    id: 2,
    name: "Smart Watch Pro Series",
    category: "electronics",
    icon: "fa-clock",
    price: 2499,
    originalPrice: 4999,
    rating: 4.7,
    reviews: 189,
    description: "Fitness tracking, heart rate monitor, sleep analysis, and smart notifications.",
    badge: "NEW",
    stock: 30
  },
  {
    id: 3,
    name: "Smartphone Power Bank 20000mAh",
    category: "electronics",
    icon: "fa-battery-full",
    price: 899,
    originalPrice: 1499,
    rating: 4.4,
    reviews: 412,
    description: "Fast charging power bank with dual USB ports and Type-C input.",
    stock: 60
  },
  {
    id: 4,
    name: "Bluetooth Portable Speaker",
    category: "electronics",
    icon: "fa-volume-high",
    price: 1599,
    originalPrice: 2999,
    rating: 4.6,
    reviews: 156,
    description: "Waterproof Bluetooth speaker with deep bass and 12-hour playback.",
    badge: "HOT",
    stock: 25
  },
  
  // ACCESSORIES
  {
    id: 5,
    name: "Fast Charging USB-C Cable",
    category: "accessories",
    icon: "fa-plug",
    price: 199,
    originalPrice: 399,
    rating: 4.3,
    reviews: 567,
    description: "Premium braided cable with fast charging support up to 65W.",
    stock: 100
  },
  {
    id: 6,
    name: "Mobile Phone Tempered Glass",
    category: "accessories",
    icon: "fa-mobile-screen",
    price: 149,
    originalPrice: 299,
    rating: 4.5,
    reviews: 890,
    description: "9H hardness tempered glass screen protector with full coverage.",
    badge: "BESTSELLER",
    stock: 200
  },
  {
    id: 7,
    name: "Premium Phone Case",
    category: "accessories",
    icon: "fa-mobile-alt",
    price: 299,
    originalPrice: 599,
    rating: 4.4,
    reviews: 234,
    description: "Shock-proof phone case with magnetic ring holder.",
    stock: 80
  },
  {
    id: 8,
    name: "Wireless Charger Pad",
    category: "accessories",
    icon: "fa-charging-station",
    price: 799,
    originalPrice: 1599,
    rating: 4.5,
    reviews: 145,
    description: "15W fast wireless charger compatible with all Qi-enabled devices.",
    badge: "NEW",
    stock: 35
  },
  
  // COSMETICS
  {
    id: 9,
    name: "Vitamin C Face Serum",
    category: "cosmetics",
    icon: "fa-spa",
    price: 549,
    originalPrice: 999,
    rating: 4.7,
    reviews: 423,
    description: "Brightening face serum with vitamin C and hyaluronic acid.",
    badge: "BESTSELLER",
    stock: 50
  },
  {
    id: 10,
    name: "Hydrating Face Moisturizer",
    category: "cosmetics",
    icon: "fa-pump-soap",
    price: 399,
    originalPrice: 799,
    rating: 4.6,
    reviews: 312,
    description: "Deep hydration moisturizer for all skin types.",
    stock: 65
  },
  {
    id: 11,
    name: "Premium Lipstick Collection",
    category: "cosmetics",
    icon: "fa-paint-brush",
    price: 299,
    originalPrice: 599,
    rating: 4.5,
    reviews: 567,
    description: "Long-lasting matte lipstick in 8 stunning shades.",
    badge: "HOT",
    stock: 90
  },
  {
    id: 12,
    name: "Hair Care Shampoo Pack",
    category: "cosmetics",
    icon: "fa-leaf",
    price: 449,
    originalPrice: 899,
    rating: 4.4,
    reviews: 198,
    description: "Herbal shampoo with natural ingredients for healthy hair.",
    stock: 55
  },
  
  // HOME & LIVING
  {
    id: 13,
    name: "LED Smart Bulb (RGB)",
    category: "home",
    icon: "fa-lightbulb",
    price: 599,
    originalPrice: 1199,
    rating: 4.5,
    reviews: 289,
    description: "WiFi-enabled smart LED bulb with 16 million colors.",
    badge: "NEW",
    stock: 70
  },
  {
    id: 14,
    name: "Insulated Water Bottle 1L",
    category: "home",
    icon: "fa-bottle-water",
    price: 449,
    originalPrice: 899,
    rating: 4.6,
    reviews: 145,
    description: "Stainless steel double-wall insulated water bottle, keeps drinks hot/cold for 24 hours.",
    stock: 85
  },
  {
    id: 15,
    name: "Aromatic Scented Candles Set",
    category: "home",
    icon: "fa-fire",
    price: 349,
    originalPrice: 699,
    rating: 4.3,
    reviews: 76,
    description: "Set of 3 luxury scented candles with relaxing fragrances.",
    stock: 40
  },
  
  // GADGETS
  {
    id: 16,
    name: "Mini Bluetooth Selfie Stick",
    category: "gadgets",
    icon: "fa-camera",
    price: 249,
    originalPrice: 499,
    rating: 4.2,
    reviews: 234,
    description: "Foldable tripod stand with Bluetooth remote for perfect selfies.",
    stock: 95
  },
  {
    id: 17,
    name: "USB Mini Fan",
    category: "gadgets",
    icon: "fa-fan",
    price: 199,
    originalPrice: 399,
    rating: 4.1,
    reviews: 167,
    description: "Portable USB-powered desk fan with 3 speed settings.",
    stock: 110
  },
  {
    id: 18,
    name: "Smart Door Sensor",
    category: "gadgets",
    icon: "fa-house-lock",
    price: 899,
    originalPrice: 1799,
    rating: 4.6,
    reviews: 89,
    description: "WiFi-enabled smart door/window sensor with app alerts.",
    badge: "NEW",
    stock: 28
  }
];

// Load products from localStorage if shopkeeper has modified them via admin panel
function loadProducts() {
  const stored = localStorage.getItem('neonstore_products');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return DEFAULT_PRODUCTS;
    }
  }
  return DEFAULT_PRODUCTS;
}

// Save products to localStorage (used by admin)
function saveProducts(products) {
  localStorage.setItem('neonstore_products', JSON.stringify(products));
}

// Initialize products if not in storage
if (!localStorage.getItem('neonstore_products')) {
  saveProducts(DEFAULT_PRODUCTS);
}

const PRODUCTS = loadProducts();
