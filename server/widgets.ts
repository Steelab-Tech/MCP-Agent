// Lightweight HTML Widget Generators
// These replace 400KB React-bundled widgets with ~5KB vanilla HTML/CSS

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
 * Generate Brand List Widget
 * Replaces: BrandList.html (387KB) → ~5KB
 */
export function generateBrandListHTML(brands: Brand[]): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Danh sách thương hiệu</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .header h1 {
      color: #333;
      margin-bottom: 5px;
    }

    .header p {
      color: #666;
      font-size: 14px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
      color: inherit;
      display: block;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 12px rgba(0,0,0,0.2);
    }

    .card img {
      width: 100%;
      height: 150px;
      object-fit: contain;
      border-radius: 8px;
      margin-bottom: 15px;
      background: #f9fafb;
    }

    .card h3 {
      color: #1f2937;
      margin-bottom: 10px;
      font-size: 18px;
    }

    .card p {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 10px;
    }

    .card .cta {
      color: #6366f1;
      font-weight: 600;
      font-size: 14px;
    }

    .empty-state {
      background: white;
      padding: 60px 20px;
      border-radius: 10px;
      text-align: center;
      color: #6b7280;
    }

    .empty-state h2 {
      color: #374151;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏪 Danh sách thương hiệu</h1>
      <p>Chọn thương hiệu để xem sản phẩm</p>
    </div>

    ${brands.length > 0 ? `
      <div class="grid">
        ${brands.map(brand => `
          <div class="card" onclick="selectBrand('${brand.id}')">
            <img src="${brand.logo_url}" alt="${brand.name}" onerror="this.src='https://via.placeholder.com/300x150?text=No+Logo'">
            <h3>${brand.name}</h3>
            <p>${brand.description || 'Không có mô tả'}</p>
            <div class="cta">Xem sản phẩm →</div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <h2>Chưa có thương hiệu nào</h2>
        <p>Vui lòng thêm thương hiệu vào hệ thống</p>
      </div>
    `}
  </div>

  <script>
    function selectBrand(brandId) {
      // Send message to parent window (ChatGPT/Claude)
      window.parent.postMessage({
        action: 'selectBrand',
        brandId: brandId
      }, '*');
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * Generate Product List Widget
 * Replaces: ProductList.html (389KB) → ~5KB
 */
export function generateProductListHTML(products: Product[], brand: Brand): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sản phẩm - ${brand.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .back-button {
      background: #6366f1;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-bottom: 15px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .back-button:hover {
      background: #4f46e5;
    }

    .brand-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .brand-info img {
      width: 60px;
      height: 60px;
      object-fit: contain;
      border-radius: 8px;
      background: #f9fafb;
    }

    .brand-info h1 {
      color: #1f2937;
      font-size: 24px;
    }

    .brand-info p {
      color: #6b7280;
      font-size: 14px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }

    .card {
      background: white;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 12px rgba(0,0,0,0.2);
    }

    .card img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 15px;
    }

    .card h3 {
      color: #1f2937;
      margin-bottom: 10px;
      font-size: 18px;
    }

    .card p {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 10px;
    }

    .card .price {
      color: #059669;
      font-size: 20px;
      font-weight: 700;
      margin-top: 10px;
    }

    .empty-state {
      background: white;
      padding: 60px 20px;
      border-radius: 10px;
      text-align: center;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <button class="back-button" onclick="goBack()">← Quay lại</button>
      <div class="brand-info">
        <img src="${brand.logo_url}" alt="${brand.name}" onerror="this.src='https://via.placeholder.com/60?text=Logo'">
        <div>
          <h1>${brand.name}</h1>
          <p>${brand.description || ''}</p>
        </div>
      </div>
    </div>

    ${products.length > 0 ? `
      <div class="grid">
        ${products.map(product => `
          <div class="card" onclick="selectProduct('${product.id}')">
            <img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x180?text=No+Image'">
            <h3>${product.name}</h3>
            <p>${product.description || 'Không có mô tả'}</p>
            <div class="price">${formatPrice(product.base_price, product.currency)}</div>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <h2>Chưa có sản phẩm nào</h2>
        <p>Thương hiệu này chưa có sản phẩm</p>
      </div>
    `}
  </div>

  <script>
    function goBack() {
      window.parent.postMessage({
        action: 'goBack'
      }, '*');
    }

    function selectProduct(productId) {
      window.parent.postMessage({
        action: 'selectProduct',
        productId: productId
      }, '*');
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * Generate Product Detail Widget
 * Replaces: ProductDetail.html (392KB) → ~8KB
 */
export function generateProductDetailHTML(
  product: Product,
  variants: ProductVariant[],
  brand: Brand
): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    .back-button {
      background: white;
      color: #374151;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      margin-bottom: 20px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .back-button:hover {
      background: #f3f4f6;
    }

    .detail-card {
      background: white;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .product-image {
      width: 100%;
      max-width: 500px;
      border-radius: 10px;
      margin-bottom: 20px;
    }

    .product-header h1 {
      color: #1f2937;
      margin-bottom: 10px;
      font-size: 28px;
    }

    .brand-badge {
      display: inline-block;
      background: #e0e7ff;
      color: #4338ca;
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 15px;
    }

    .price {
      color: #059669;
      font-size: 32px;
      font-weight: 700;
      margin: 15px 0;
    }

    .description {
      color: #4b5563;
      line-height: 1.8;
      margin-bottom: 20px;
    }

    .variants {
      margin-top: 30px;
    }

    .variants h3 {
      color: #374151;
      margin-bottom: 15px;
      font-size: 18px;
    }

    .variant-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }

    .variant {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border: 2px solid #e5e7eb;
      transition: all 0.2s ease;
    }

    .variant:hover {
      border-color: #6366f1;
    }

    .variant.in_stock {
      border-color: #10b981;
      background: #d1fae5;
    }

    .variant.out_of_stock {
      border-color: #ef4444;
      background: #fee2e2;
      opacity: 0.6;
    }

    .variant h4 {
      color: #1f2937;
      margin-bottom: 8px;
    }

    .variant .sku {
      color: #6b7280;
      font-size: 12px;
      margin-bottom: 5px;
    }

    .variant .price {
      color: #059669;
      font-size: 18px;
      font-weight: 600;
      margin: 8px 0;
    }

    .variant .status {
      font-size: 12px;
      font-weight: 600;
    }

    .variant.in_stock .status {
      color: #059669;
    }

    .variant.out_of_stock .status {
      color: #dc2626;
    }

    .cta-button {
      display: inline-block;
      background: #059669;
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
      transition: all 0.2s ease;
    }

    .cta-button:hover {
      background: #047857;
      transform: translateY(-2px);
    }

    .empty-variants {
      color: #6b7280;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="container">
    <button class="back-button" onclick="goBack()">← Quay lại danh sách sản phẩm</button>

    <div class="detail-card">
      <img class="product-image" src="${product.image_url}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/500x300?text=No+Image'">

      <div class="product-header">
        <div class="brand-badge">${brand.name}</div>
        <h1>${product.name}</h1>
        <div class="price">${formatPrice(product.base_price, product.currency)}</div>
      </div>

      <div class="description">
        <p>${product.description || 'Không có mô tả'}</p>
      </div>

      ${variants && variants.length > 0 ? `
        <div class="variants">
          <h3>Các phiên bản (${variants.length})</h3>
          <div class="variant-grid">
            ${variants.map(v => `
              <div class="variant ${v.stock_status}">
                <h4>${v.name}</h4>
                <div class="sku">SKU: ${v.sku}</div>
                <div class="price">${formatPrice(v.price, v.currency)}</div>
                <div class="status">
                  ${v.stock_status === 'in_stock' ? '✓ Còn hàng' :
                    v.stock_status === 'out_of_stock' ? '✗ Hết hàng' : '⏳ Đặt trước'}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : `
        <div class="empty-variants">Không có phiên bản nào</div>
      `}

      <a href="#" class="cta-button" onclick="submitLead(); return false;">
        Đăng ký nhận tư vấn →
      </a>
    </div>
  </div>

  <script>
    function goBack() {
      window.parent.postMessage({
        action: 'goBack'
      }, '*');
    }

    function submitLead() {
      window.parent.postMessage({
        action: 'submitLead',
        productId: '${product.id}'
      }, '*');
    }
  </script>
</body>
</html>
  `.trim();
}

/**
 * Generate Lead Form Widget
 * Replaces: LeadForm.html (447KB) → ~6KB
 */
export function generateLeadFormHTML(product?: Product): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Đăng ký nhận tư vấn</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .form-container {
      background: white;
      border-radius: 10px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      max-width: 500px;
      width: 100%;
    }

    .form-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .form-header h1 {
      color: #1f2937;
      margin-bottom: 10px;
      font-size: 24px;
    }

    .form-header p {
      color: #6b7280;
      font-size: 14px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      color: #374151;
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #6366f1;
    }

    .form-group textarea {
      resize: vertical;
      min-height: 100px;
    }

    .required {
      color: #ef4444;
    }

    .submit-button {
      width: 100%;
      background: #6366f1;
      color: white;
      border: none;
      padding: 14px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .submit-button:hover {
      background: #4f46e5;
      transform: translateY(-2px);
    }

    .submit-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }

    .success-message {
      background: #d1fae5;
      color: #065f46;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 20px;
      display: none;
    }

    .success-message.show {
      display: block;
    }

    .back-button {
      display: block;
      text-align: center;
      color: #6366f1;
      text-decoration: none;
      margin-top: 15px;
      font-size: 14px;
    }

    .back-button:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="form-container">
    <div class="form-header">
      <h1>📝 Đăng ký nhận tư vấn</h1>
      <p>${product ? `Sản phẩm: <strong>${product.name}</strong>` : 'Điền thông tin để được tư vấn'}</p>
    </div>

    <div id="successMessage" class="success-message">
      ✓ Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.
    </div>

    <form id="leadForm">
      <div class="form-group">
        <label>Họ và tên <span class="required">*</span></label>
        <input type="text" name="name" required placeholder="Nguyễn Văn A">
      </div>

      <div class="form-group">
        <label>Email <span class="required">*</span></label>
        <input type="email" name="email" required placeholder="example@email.com">
      </div>

      <div class="form-group">
        <label>Số điện thoại <span class="required">*</span></label>
        <input type="tel" name="phone" required placeholder="0901234567">
      </div>

      <div class="form-group">
        <label>Ghi chú</label>
        <textarea name="notes" placeholder="Nội dung cần tư vấn..."></textarea>
      </div>

      <button type="submit" class="submit-button">Gửi đăng ký</button>
    </form>

    <a href="#" class="back-button" onclick="goBack(); return false;">← Quay lại</a>
  </div>

  <script>
    const form = document.getElementById('leadForm');
    const submitButton = form.querySelector('.submit-button');
    const successMessage = document.getElementById('successMessage');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Disable button
      submitButton.disabled = true;
      submitButton.textContent = 'Đang gửi...';

      // Get form data
      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        notes: formData.get('notes'),
        product_id: '${product?.id || ''}',
        created_at: new Date().toISOString()
      };

      // Send to parent
      window.parent.postMessage({
        action: 'submitLead',
        data: data
      }, '*');

      // Show success
      successMessage.classList.add('show');
      form.reset();

      // Re-enable button
      setTimeout(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'Gửi đăng ký';
        successMessage.classList.remove('show');
      }, 3000);
    });

    function goBack() {
      window.parent.postMessage({
        action: 'goBack'
      }, '*');
    }
  </script>
</body>
</html>
  `.trim();
}
