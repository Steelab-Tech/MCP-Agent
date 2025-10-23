// ChatGPT Apps SDK Style Widgets
// Minimal, clean design theo OpenAI Guidelines

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  description: string;
  website_url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  base_price: number;
  currency: string;
  brand_id?: string;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  stock_status: 'in_stock' | 'out_of_stock' | 'preorder';
}

/**
 * Format price with currency
 */
function formatPrice(price: number, currency: string = 'VND'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(price);
}

/**
 * Generate Brand List Widget - Inline Carousel Style
 * Tương tự Pizzazz restaurant cards trong ChatGPT
 */
export function generateBrandListHTML(brands: Brand[]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
    }

    .carousel-container {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding: 16px;
    }

    .carousel-container::-webkit-scrollbar {
      display: none;
    }

    .carousel {
      display: flex;
      gap: 12px;
    }

    .card {
      flex: 0 0 280px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      transform: translateY(-2px);
    }

    .card-image {
      width: 100%;
      height: 160px;
      object-fit: cover;
      background: #f9fafb;
    }

    .card-content {
      padding: 16px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .card-subtitle {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.4;
      margin-bottom: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .card-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 500;
      color: #0066ff;
    }
  </style>
</head>
<body>
  <div class="carousel-container">
    <div class="carousel">
      ${brands.map(brand => `
        <div class="card" onclick="selectBrand('${brand.id}')">
          <img class="card-image" src="${brand.logo_url}" alt="${brand.name}" onerror="this.src='https://via.placeholder.com/280x160/f3f4f6/9ca3af?text=${encodeURIComponent(brand.name)}'">
          <div class="card-content">
            <div class="card-title">${brand.name}</div>
            <div class="card-subtitle">${brand.description || 'Explore products'}</div>
            <div class="card-action">View products →</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <script>
    function selectBrand(brandId) {
      window.parent.postMessage({ action: 'selectBrand', brandId }, '*');
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * Generate Product List Widget - Vertical Card List
 * Tương tự restaurant detail view with action buttons
 */
export function generateProductListHTML(products: Product[], brand: Brand): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      padding: 16px;
    }

    .header {
      margin-bottom: 20px;
    }

    .brand-name {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .brand-desc {
      font-size: 14px;
      color: #6b7280;
    }

    .product-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .product-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
    }

    .product-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .product-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: #f9fafb;
    }

    .product-content {
      padding: 16px;
    }

    .product-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }

    .product-desc {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
      margin-bottom: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .product-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .product-price {
      font-size: 18px;
      font-weight: 700;
      color: #059669;
    }

    .btn-view {
      background: #0066ff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-view:hover {
      background: #0052cc;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-name">${brand.name}</div>
    <div class="brand-desc">${brand.description || ''}</div>
  </div>

  <div class="product-list">
    ${products.map(product => `
      <div class="product-card" onclick="selectProduct('${product.id}')">
        <img class="product-image" src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/400x200/f3f4f6/9ca3af?text=Product'">
        <div class="product-content">
          <div class="product-title">${product.name}</div>
          <div class="product-desc">${product.description || 'No description'}</div>
          <div class="product-footer">
            <div class="product-price">${formatPrice(product.base_price, product.currency)}</div>
            <button class="btn-view" onclick="event.stopPropagation(); selectProduct('${product.id}')">View details</button>
          </div>
        </div>
      </div>
    `).join('')}
  </div>

  <script>
    function selectProduct(productId) {
      window.parent.postMessage({ action: 'selectProduct', productId }, '*');
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * Generate Product Detail Widget - Fullscreen Modal Style
 * Tương tự Brick & Basil detail page
 */
export function generateProductDetailHTML(
  product: Product,
  variants: ProductVariant[],
  brand: Brand
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
    }

    .detail-container {
      max-width: 600px;
      margin: 0 auto;
    }

    .detail-image {
      width: 100%;
      height: 300px;
      object-fit: cover;
      background: #f9fafb;
      border-radius: 12px 12px 0 0;
    }

    .detail-content {
      padding: 20px;
    }

    .brand-badge {
      display: inline-block;
      background: #e0e7ff;
      color: #4338ca;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .detail-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }

    .detail-price {
      font-size: 28px;
      font-weight: 700;
      color: #059669;
      margin-bottom: 16px;
    }

    .detail-desc {
      font-size: 15px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .variants-section h3 {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
    }

    .variant-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 8px;
      margin-bottom: 24px;
    }

    .variant-option {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .variant-option.in_stock {
      border-color: #10b981;
      background: #d1fae5;
    }

    .variant-option.out_of_stock {
      opacity: 0.5;
    }

    .variant-name {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .variant-price {
      font-size: 13px;
      font-weight: 600;
      color: #059669;
    }

    .variant-status {
      font-size: 11px;
      color: #6b7280;
      margin-top: 4px;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn {
      flex: 1;
      padding: 14px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #0066ff;
      color: white;
    }

    .btn-primary:hover {
      background: #0052cc;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="detail-container">
    <img class="detail-image" src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/600x300/f3f4f6/9ca3af?text=Product'">

    <div class="detail-content">
      <div class="brand-badge">${brand.name}</div>
      <div class="detail-title">${product.name}</div>
      <div class="detail-price">${formatPrice(product.base_price, product.currency)}</div>
      <div class="detail-desc">${product.description || 'No description available'}</div>

      ${variants && variants.length > 0 ? `
        <div class="variants-section">
          <h3>Available options (${variants.length})</h3>
          <div class="variant-grid">
            ${variants.map(v => `
              <div class="variant-option ${v.stock_status}">
                <div class="variant-name">${v.name}</div>
                <div class="variant-price">${formatPrice(v.price, v.currency)}</div>
                <div class="variant-status">
                  ${v.stock_status === 'in_stock' ? '✓ In stock' :
                    v.stock_status === 'out_of_stock' ? '✗ Out of stock' : '⏳ Pre-order'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="action-buttons">
        <button class="btn btn-secondary" onclick="goBack()">← Back</button>
        <button class="btn btn-primary" onclick="submitLead()">Get quote</button>
      </div>
    </div>
  </div>

  <script>
    function goBack() {
      window.parent.postMessage({ action: 'goBack' }, '*');
    }

    function submitLead() {
      window.parent.postMessage({ action: 'submitLead', productId: '${product.id}' }, '*');
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * Generate Lead Form Widget - Simple inline form
 */
export function generateLeadFormHTML(product?: Product): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      padding: 24px;
    }

    .form-container {
      max-width: 480px;
      margin: 0 auto;
    }

    .form-header {
      margin-bottom: 24px;
    }

    .form-title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }

    .form-subtitle {
      font-size: 14px;
      color: #6b7280;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      outline: none;
      border-color: #0066ff;
    }

    textarea.form-input {
      min-height: 80px;
      resize: vertical;
    }

    .form-submit {
      width: 100%;
      background: #0066ff;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .form-submit:hover {
      background: #0052cc;
    }

    .form-submit:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .success-msg {
      background: #d1fae5;
      color: #065f46;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 16px;
      display: none;
    }

    .success-msg.show {
      display: block;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <div class="form-header">
      <div class="form-title">Request a quote</div>
      <div class="form-subtitle">${product ? `For: ${product.name}` : 'Fill in your details'}</div>
    </div>

    <div id="successMsg" class="success-msg">
      ✓ Submitted! We'll contact you soon.
    </div>

    <form id="leadForm">
      <div class="form-group">
        <label class="form-label">Full name *</label>
        <input type="text" name="name" class="form-input" required placeholder="John Doe">
      </div>

      <div class="form-group">
        <label class="form-label">Email *</label>
        <input type="email" name="email" class="form-input" required placeholder="john@example.com">
      </div>

      <div class="form-group">
        <label class="form-label">Phone *</label>
        <input type="tel" name="phone" class="form-input" required placeholder="+84 901234567">
      </div>

      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea name="notes" class="form-input" placeholder="Any specific requirements..."></textarea>
      </div>

      <button type="submit" class="form-submit">Submit request</button>
    </form>
  </div>

  <script>
    const form = document.getElementById('leadForm');
    const submitBtn = form.querySelector('.form-submit');
    const successMsg = document.getElementById('successMsg');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        notes: formData.get('notes'),
        product_id: '${product?.id || ''}',
        created_at: new Date().toISOString()
      };

      window.parent.postMessage({ action: 'submitLead', data }, '*');

      successMsg.classList.add('show');
      form.reset();

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit request';
        successMsg.classList.remove('show');
      }, 3000);
    });
  </script>
</body>
</html>
  `.trim();
}
