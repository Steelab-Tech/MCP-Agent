# Performance Optimization Plan

## Current Performance Issues

### Observations from ChatGPT:
- ✅ Data table renders FAST (~instant)
- ❌ Widget images render SLOW (~5-10 seconds)

### Root Cause:

**Widget HTML files are TOO LARGE:**
```
BrandList.html:     387 KB (inlined React + all deps)
ProductList.html:   389 KB
ProductDetail.html: 392 KB
LeadForm.html:      447 KB
```

**Why it's slow:**
1. ChatGPT must download 400KB HTML per widget
2. HTML contains full inlined React bundle
3. No caching between widgets
4. Network latency for large payloads

**Why data table is fast:**
- Only JSON data (~5KB)
- No HTML overhead
- Simple text rendering

## Solutions (Priority Order)

### Option 1: Use Simpler Widgets (RECOMMENDED - Quick Win)

Instead of full React widgets, use lightweight HTML templates:

**Before:**
```typescript
html: readWidgetHtml("BrandList.html"), // 387KB
```

**After:**
```typescript
html: generateSimpleBrandListHTML(brands), // ~5KB
```

**Benefits:**
- ✅ 98% smaller payload
- ✅ Instant rendering
- ✅ No React overhead
- ✅ Still looks good

**Implementation:**
```typescript
function generateSimpleBrandListHTML(brands: any[]): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: system-ui; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
        .card img { width: 100%; border-radius: 4px; }
        .card h3 { margin: 10px 0 5px; }
        .card p { color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="grid">
        ${brands.map(b => `
          <div class="card" onclick="window.parent.postMessage({action:'selectBrand', id:'${b.id}'}, '*')">
            <img src="${b.logo_url}" alt="${b.name}">
            <h3>${b.name}</h3>
            <p>${b.description}</p>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;
}
```

### Option 2: Pre-render & Cache Widgets

Cache rendered HTML in memory:

```typescript
const widgetCache = new Map<string, string>();

function getOrCreateWidget(key: string, generator: () => string): string {
  if (!widgetCache.has(key)) {
    widgetCache.set(key, generator());
  }
  return widgetCache.get(key)!;
}
```

**Limitations:**
- Still slow on first load
- Cache invalidation complexity

### Option 3: Use External CDN for Widget Assets

Host widgets separately:

```typescript
html: '<iframe src="https://cdn.yoursite.com/widgets/brand-list.html"></iframe>'
```

**Pros:**
- Browser caching
- Separate loading

**Cons:**
- Need CDN setup
- CORS complexity
- Not self-contained

### Option 4: Reduce Bundle Size

Optimize @fractal-mcp/cli bundling:

```bash
# Use production mode
NODE_ENV=production npm run bundle:widgets

# Tree-shaking
# Code splitting
# Minification
```

**Expected savings:**
- 40-50% size reduction
- Still 200KB+ per widget

### Option 5: Lazy Load Images

Use image placeholders:

```html
<img src="data:image/svg+xml,..." loading="lazy" data-src="${brand.logo_url}">
```

**Impact:**
- Slightly faster initial render
- Images still load separately

## Recommended Implementation

### Phase 1: Quick Win (30 minutes)

Replace React widgets with simple HTML generators:

1. Create `server/widgets.ts`:
```typescript
export function generateBrandListHTML(brands: any[]): string { ... }
export function generateProductListHTML(products: any[], brand: any): string { ... }
export function generateProductDetailHTML(product: any, variants: any[]): string { ... }
```

2. Update `server/index.ts`:
```typescript
import { generateBrandListHTML } from './widgets';

registerOpenAIWidget(server, {
  id: "brand-list",
  html: generateBrandListHTML(brands), // Dynamic, small payload
  ...
});
```

**Expected result:**
- ⚡ 5-10x faster rendering
- 📦 98% smaller payload
- ✅ Still looks good

### Phase 2: Polish (1 hour)

Add nice styling to simple widgets:
- Tailwind-inspired CSS
- Hover effects
- Responsive design
- Loading states

### Phase 3: Optimize (if needed)

If still slow:
- Add image CDN (Cloudflare, ImgIX)
- Lazy loading
- Progressive enhancement

## Performance Targets

### Current:
- Widget load: ~5-10 seconds
- Data table: ~instant

### After Phase 1:
- Widget load: ~500ms (10x faster)
- Data table: ~instant (unchanged)

### After Phase 2:
- Widget load: ~200ms (25x faster)
- Data table: ~instant

## Monitoring

Add timing logs:

```typescript
console.time('widget-render');
const html = generateBrandListHTML(brands);
console.timeEnd('widget-render');
```

## Alternative: Use Data Table Instead

If widgets remain slow, fallback to data tables:

```typescript
structuredContent: {
  type: 'table',
  data: brands.map(b => ({
    Logo: `![](${b.logo_url})`,
    Name: b.name,
    Description: b.description
  }))
}
```

**Pros:**
- ✅ Fast rendering
- ✅ No HTML overhead

**Cons:**
- ❌ Less visual appeal
- ❌ Limited interactivity

## Decision Matrix

| Solution | Speed | Effort | Visual | Recommended |
|----------|-------|--------|--------|-------------|
| Simple HTML | ⚡⚡⚡ | 30min | ⭐⭐⭐ | ✅ YES |
| Cache | ⚡⚡ | 1hr | ⭐⭐⭐⭐ | Maybe |
| CDN | ⚡⚡⚡ | 3hr | ⭐⭐⭐⭐ | Later |
| Optimize Bundle | ⚡ | 2hr | ⭐⭐⭐⭐ | No |
| Data Table | ⚡⚡⚡ | 5min | ⭐⭐ | Fallback |

## Conclusion

**Recommend: Phase 1 (Simple HTML widgets)**
- Fastest time to value
- Biggest performance gain
- Minimal code changes
- Can enhance later if needed

Next step: Implement simple HTML generators?
