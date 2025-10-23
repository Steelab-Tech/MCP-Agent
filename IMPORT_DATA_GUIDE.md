# Import Fake Data to Supabase

## Các bước import data:

### Option 1: Qua Supabase Dashboard (Recommended)

1. **Mở Supabase Dashboard**
   - Vào https://supabase.com/dashboard
   - Chọn project: `lcjjnqsoenuhkgfxjwji`

2. **Mở SQL Editor**
   - Click **SQL Editor** trong sidebar trái
   - Click **New query**

3. **Copy & Paste SQL**
   - Mở file `/Users/blackpham/Downloads/fake_insert_affiliate_system.sql`
   - Copy toàn bộ nội dung
   - Paste vào SQL Editor

4. **Run Query**
   - Click **Run** hoặc nhấn `Cmd+Enter`
   - Chờ ~10-30 giây để insert hoàn tất

5. **Verify Data**
   ```sql
   SELECT COUNT(*) FROM brands;
   SELECT COUNT(*) FROM products;
   SELECT COUNT(*) FROM product_variants;
   ```

### Option 2: Qua CLI (Nếu có supabase CLI)

```bash
# Install Supabase CLI (nếu chưa có)
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref lcjjnqsoenuhkgfxjwji

# Run SQL file
supabase db execute --file /Users/blackpham/Downloads/fake_insert_affiliate_system.sql
```

### Option 3: Qua Code (Programmatic)

```typescript
// Có thể chạy script này local để insert
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const sql = fs.readFileSync('fake_insert_affiliate_system.sql', 'utf-8')

// Split by INSERT statements and run sequentially
const statements = sql.split(/(?=INSERT INTO)/)
for (const statement of statements) {
  if (statement.trim()) {
    await supabase.rpc('exec_sql', { sql: statement })
  }
}
```

## Verify Data Imported Successfully

### Check via Dashboard:

1. **Table Editor**
   - Click **Table Editor**
   - Select `brands` table
   - You should see 5 brands:
     - Klein-Dominguez
     - Miller, Perry and Baker
     - Reynolds Inc
     - Ellis LLC
     - Johnson-Smith

2. **Products**
   - Select `products` table
   - Should see ~20 products

3. **Product Variants**
   - Select `product_variants` table
   - Should see ~50-100 variants

### Check via SQL:

```sql
-- Total counts
SELECT
  (SELECT COUNT(*) FROM brands) as brands_count,
  (SELECT COUNT(*) FROM products) as products_count,
  (SELECT COUNT(*) FROM product_variants) as variants_count;

-- Sample data
SELECT b.name, COUNT(p.id) as product_count
FROM brands b
LEFT JOIN products p ON p.brand_id = b.id
GROUP BY b.id, b.name
ORDER BY b.name;
```

Expected output:
```
brands_count: 5
products_count: 20
variants_count: ~50
```

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
- Data already exists
- Either skip or run: `TRUNCATE brands, products, product_variants CASCADE;` first

### Error: "permission denied"
- Make sure you're using SERVICE_KEY not ANON_KEY
- Check RLS policies

### Error: "syntax error"
- Check SQL format
- Make sure timestamps are correctly formatted

## After Import: Test MCP Server

Once data is imported, server should work:

1. **Check server is running**:
   ```bash
   curl https://mcp-agent-hip5.onrender.com/health
   # Should return 200 OK (not 502)
   ```

2. **Test brand list**:
   - In ChatGPT/Claude: "Show me affiliate brands"
   - Should see 5 brands with logos

3. **Test brand selection**:
   - Click on any brand (e.g., "Ellis LLC")
   - Should see products for that brand

4. **Test product detail**:
   - Click on any product
   - Should see variants and details

## Data Structure

```
brands (5 items)
├── Klein-Dominguez (304d0119-d522-4403-ab38-64beefe61a8a)
│   └── products: Point If, Next Strong, Great See, etc.
├── Miller, Perry and Baker (aac7168b-0d4d-4d58-89b4-0c66f1577faf)
│   └── products: Various Sister, Should Way, Church Single, etc.
├── Reynolds Inc (130d758e-0e19-44fd-912f-d6e1e56ed659)
│   └── products: None Similar, Dinner Rest
├── Ellis LLC (d44ad4ae-c127-4c85-8818-a0355b32d34d)
│   └── products: Door Yes, Produce Perhaps, About Model, etc.
└── Johnson-Smith (f1c826e6-09b1-4244-aa41-495574c4aa2b)
    └── products: Institution Conference, Prove Range, Social Former, etc.
```

Each product has 1-4 variants with different colors and sizes.
