import React, { useState } from "react";
import { useWidgetProps } from "@fractal-mcp/oai-hooks";
import { callTool } from "./utils";

interface Product {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  base_price?: number;
  currency?: string;
  active: boolean;
}

interface ProductListProps {
  products: Product[];
  brandName?: string;
}

export default function ProductList() {
  const props = useWidgetProps<ProductListProps>();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectProduct = async (product: Product) => {
    try {
      setLoading(product.id);
      setError(null);
      await callTool("select_product", { productId: product.id });
      setLoading(null);
    } catch (err) {
      setError(`Failed to select product: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(null);
    }
  };

  const handleLeadCapture = async (product: Product) => {
    try {
      setLoading(`lead-${product.id}`);
      setError(null);
      await callTool("show_lead_form", {
        productId: product.id,
        brandId: product.brand_id
      });
      setLoading(null);
    } catch (err) {
      setError(`Failed to show lead form: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(null);
    }
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return null;
    const curr = currency || 'VND';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: curr
    }).format(price);
  };

  if (!props.products || props.products.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Không có sản phẩm nào khả dụng.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
        {props.brandName ? `Sản phẩm - ${props.brandName}` : 'Danh Sách Sản Phẩm'}
      </h2>

      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        {props.products.map((product) => (
          <div
            key={product.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '12px',
              padding: '16px',
              backgroundColor: '#fff',
              display: 'flex',
              gap: '16px'
            }}
          >
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  flexShrink: 0
                }}
              />
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '8px',
                margin: 0
              }}>
                {product.name}
              </h3>

              {product.description && (
                <p style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '12px',
                  margin: '8px 0 12px 0',
                  lineHeight: '1.5'
                }}>
                  {product.description}
                </p>
              )}

              {product.base_price && (
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#2563eb',
                  marginBottom: '12px'
                }}>
                  {formatPrice(product.base_price, product.currency)}
                </div>
              )}

              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: 'auto'
              }}>
                <button
                  onClick={() => handleSelectProduct(product)}
                  disabled={loading === product.id}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading === product.id ? '#ddd' : '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading === product.id ? 'wait' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (loading !== product.id) {
                      e.currentTarget.style.backgroundColor = '#1d4ed8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (loading !== product.id) {
                      e.currentTarget.style.backgroundColor = '#2563eb';
                    }
                  }}
                >
                  {loading === product.id ? 'Đang tải...' : 'Xem chi tiết'}
                </button>

                <button
                  onClick={() => handleLeadCapture(product)}
                  disabled={loading === `lead-${product.id}`}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: loading === `lead-${product.id}` ? '#ddd' : '#fff',
                    color: '#2563eb',
                    border: '2px solid #2563eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: loading === `lead-${product.id}` ? 'wait' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (loading !== `lead-${product.id}`) {
                      e.currentTarget.style.backgroundColor = '#eff6ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (loading !== `lead-${product.id}`) {
                      e.currentTarget.style.backgroundColor = '#fff';
                    }
                  }}
                >
                  {loading === `lead-${product.id}` ? 'Đang tải...' : 'Nhận tư vấn'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
