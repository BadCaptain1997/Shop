# 🌟 NEON STORE - Premium Online Shopping Website

## 📂 कैसे चलाएं (How to Run)

1. सभी फाइल्स को एक folder में रखें
2. `index.html` को browser में खोलें
3. बस! आपकी दुकान चालू है 🎉

## 🔐 Admin Login

- **URL**: `admin/login.html` या वेबसाइट पर ऊपर admin icon दबाएं
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Important**: पहले login के बाद Settings → Admin Password में जाकर password बदल लें!

## 💳 Payment Setup

### UPI QR Code Setup:
1. Admin Dashboard में login करें
2. **Settings** tab पर जाएं
3. **UPI ID** field में अपनी UPI ID डालें (e.g., `yourname@paytm`, `yourname@ybl`)
4. **Save Settings** पर click करें
5. अब customers automatically आपके UPI ID का QR code देखेंगे

### Cash on Delivery:
- COD पहले से enabled है, कुछ करने की ज़रूरत नहीं!

## 📦 Features

### Customer Side:
✅ Beautiful Dark Theme with Neon Animations
✅ Product Browsing with Filters
✅ Search functionality
✅ Add to Cart / Quick View
✅ Checkout with Customer Details
✅ COD + UPI QR Payment Options
✅ Order Confirmation
✅ Mobile Responsive

### Admin Dashboard:
✅ Sales Overview with Charts
✅ Order Management (View/Update Status/Delete)
✅ Product Management (Add/Edit/Delete)
✅ Customer Database
✅ Sales Reports (Daily/Weekly/Monthly)
✅ Top Products Analytics
✅ CSV Export (Orders, Customers, Products)
✅ Store Settings
✅ Password Management

## 📁 File Structure

```
shop/
├── index.html              ← Main homepage
├── cart.html               ← Checkout page
├── css/
│   ├── style.css          ← Main styles
│   ├── cart.css           ← Cart styles
│   └── dashboard.css      ← Admin styles
├── js/
│   ├── products.js        ← Product data
│   ├── main.js            ← Homepage logic
│   ├── cart.js            ← Checkout logic
│   └── dashboard.js       ← Admin logic
└── admin/
    ├── login.html         ← Admin login
    └── dashboard.html     ← Admin panel
```

## 🚀 कैसे होस्ट करें (Free Hosting)

### Option 1: GitHub Pages (FREE)
1. github.com पर account बनाएं
2. New repository बनाएं
3. सारी files upload करें
4. Settings → Pages → Enable
5. आपकी website live!

### Option 2: Netlify (FREE - Easiest!)
1. netlify.com पर जाएं
2. "Sites" section में folder को drag-drop करें
3. तुरंत live link मिल जाएगा!

### Option 3: Vercel (FREE)
1. vercel.com पर sign up
2. Project upload करें
3. Deploy click करें

## ⚠️ Important Notes

1. **Data Storage**: सारा data browser के localStorage में save होता है। मतलब:
   - एक device पर जो orders आएंगे, वो उसी device पर admin देखेगा
   - बड़ी scale के लिए, आपको backend (database) चाहिए होगा
   
2. **Production के लिए**: यह demo/starter website है। बड़े business के लिए:
   - Backend database (MongoDB, Firebase) integrate करें
   - SSL certificate लें
   - Payment gateway (Razorpay, Stripe) integrate करें
   - Real UPI integration करें

3. **Demo QR Code**: वर्तमान QR code free API से generate होता है। Settings में अपना actual UPI ID डालें।

## 🎨 Customization

### Logo & Brand Name बदलें:
- `index.html` में "NEON STORE" को search करके अपना shop name डालें
- Admin Settings में भी shop name update करें

### Colors बदलें:
- `css/style.css` के top में `:root` variables को edit करें
- `--neon-blue`, `--neon-purple`, `--neon-pink` के codes बदलें

### Products जोड़ें:
- Admin Dashboard → Products tab → "Add Product" button

## 📞 Help & Support

अगर कोई problem आए तो:
1. Browser में F12 दबाकर Console देखें
2. Cache clear करके फिर try करें
3. Different browser में test करें

---
Made with ❤️ for Indian Shopkeepers
