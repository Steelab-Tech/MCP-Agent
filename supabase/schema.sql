-- ============================================
-- MCP Affiliate System - Supabase Schema
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- Table: brands
-- ============================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  website_url TEXT,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(active);
CREATE INDEX IF NOT EXISTS idx_brands_name_trgm ON brands USING gin(name gin_trgm_ops);

-- ============================================
-- Table: products
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  long_description TEXT,
  image_url TEXT,
  images TEXT[],
  base_price NUMERIC(10, 2),
  currency VARCHAR(3) DEFAULT 'VND',
  checkout_url TEXT,
  affiliate_params JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- ============================================
-- Table: product_variants
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  price NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'VND',
  stock_status VARCHAR(50) DEFAULT 'in_stock',
  attributes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);

-- ============================================
-- Table: leads
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  payload JSONB NOT NULL,
  consent BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_brand_id ON leads(brand_id);
CREATE INDEX IF NOT EXISTS idx_leads_product_id ON leads(product_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_payload_gin ON leads USING gin(payload);

-- ============================================
-- Table: click_events
-- ============================================
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  event_type VARCHAR(100),
  checkout_url TEXT,
  user_agent TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_click_events_product_id ON click_events(product_id);
CREATE INDEX IF NOT EXISTS idx_click_events_created_at ON click_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_click_events_event_type ON click_events(event_type);

-- ============================================
-- Table: search_events
-- ============================================
CREATE TABLE IF NOT EXISTS search_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_query TEXT NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  results_count INTEGER,
  user_agent TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_events_brand_id ON search_events(brand_id);
CREATE INDEX IF NOT EXISTS idx_search_events_created_at ON search_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_events_query_trgm ON search_events USING gin(search_query gin_trgm_ops);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;

-- Brands: Public read, service_role write
CREATE POLICY "Public can read active brands"
  ON brands FOR SELECT
  USING (active = true);

CREATE POLICY "Service role can manage brands"
  ON brands FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Products: Public read, service_role write
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (active = true);

CREATE POLICY "Service role can manage products"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Product Variants: Public read, service_role write
CREATE POLICY "Public can read product variants"
  ON product_variants FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage product variants"
  ON product_variants FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Leads: Service role only
CREATE POLICY "Service role can manage leads"
  ON leads FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Click Events: Service role only
CREATE POLICY "Service role can manage click events"
  ON click_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Search Events: Service role only
CREATE POLICY "Service role can manage search events"
  ON search_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- Functions & Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert sample brand
INSERT INTO brands (name, slug, logo_url, description, active)
VALUES (
  'Sample Brand',
  'sample-brand',
  'https://via.placeholder.com/100',
  'This is a sample brand for testing purposes',
  true
) ON CONFLICT (slug) DO NOTHING;

-- Insert sample product
INSERT INTO products (brand_id, name, slug, description, base_price, currency, active)
SELECT
  id,
  'Sample Product',
  'sample-product',
  'This is a sample product for testing',
  99000,
  'VND',
  true
FROM brands
WHERE slug = 'sample-brand'
ON CONFLICT (brand_id, slug) DO NOTHING;

-- ============================================
-- Views for Analytics (Optional)
-- ============================================

-- View: Lead summary by brand
CREATE OR REPLACE VIEW lead_summary_by_brand AS
SELECT
  b.id AS brand_id,
  b.name AS brand_name,
  COUNT(l.id) AS total_leads,
  COUNT(CASE WHEN l.status = 'new' THEN 1 END) AS new_leads,
  COUNT(CASE WHEN l.status = 'contacted' THEN 1 END) AS contacted_leads,
  COUNT(CASE WHEN l.status = 'converted' THEN 1 END) AS converted_leads,
  MIN(l.created_at) AS first_lead_at,
  MAX(l.created_at) AS last_lead_at
FROM brands b
LEFT JOIN leads l ON b.id = l.brand_id
GROUP BY b.id, b.name;

-- View: Product click analytics
CREATE OR REPLACE VIEW product_click_analytics AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  b.name AS brand_name,
  COUNT(ce.id) AS total_clicks,
  COUNT(CASE WHEN ce.event_type = 'checkout_click' THEN 1 END) AS checkout_clicks,
  MIN(ce.created_at) AS first_click_at,
  MAX(ce.created_at) AS last_click_at
FROM products p
LEFT JOIN click_events ce ON p.id = ce.product_id
LEFT JOIN brands b ON p.brand_id = b.id
GROUP BY p.id, p.name, b.name;

-- ============================================
-- Grants (if needed)
-- ============================================

-- Grant permissions to authenticated users (adjust as needed)
-- GRANT SELECT ON brands, products, product_variants TO authenticated;
-- GRANT ALL ON leads, click_events, search_events TO service_role;

COMMENT ON TABLE brands IS 'Stores brand/merchant information';
COMMENT ON TABLE products IS 'Stores product catalog information';
COMMENT ON TABLE product_variants IS 'Stores product variants (sizes, colors, etc.)';
COMMENT ON TABLE leads IS 'Stores customer lead information for follow-up';
COMMENT ON TABLE click_events IS 'Tracks user click events for analytics';
COMMENT ON TABLE search_events IS 'Tracks user search behavior for analytics';
