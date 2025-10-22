import React, { useState } from "react";
import { useWidgetProps } from "@fractal-mcp/oai-hooks";
import { callTool } from "./utils";

interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  price: number;
  currency: string;
  stock_status?: string;
  attributes?: Record<string, any>;
}

interface Product {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  description?: string;
  long_description?: string;
  image_url?: string;
  images?: string[];
  base_price?: number;
  currency?: string;
  checkout_url?: string;
  affiliate_params?: Record<string, string>;
  active: boolean;
}

interface ProductDetailProps {
  product: Product;
  variants?: ProductVariant[];
  brandName?: string;
}

export default function ProductDetail() {
  const props = useWidgetProps<ProductDetailProps>();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    props.variants?.[0] || null
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    try {
      setLoading('checkout');
      setError(null);

      await callTool("track_event", {
        type: "click",
        payload: {
          product_id: props.product.id,
          variant_id: selectedVariant?.id,
          event_type: "checkout_click",
          checkout_url: props.product.checkout_url
        }
      });

      // Open checkout URL in new window
      if (props.product.checkout_url) {
        const url = new URL(props.product.checkout_url);
        if (props.product.affiliate_params) {
          Object.entries(props.product.affiliate_params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
          });
        }
        window.open(url.toString(), '_blank');
      }

      setLoading(null);
    } catch (err) {
      setError(`Failed to process checkout: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(null);
    }
  };

  const handleLeadCapture = async () => {
    try {
      setLoading('lead');
      setError(null);
      await callTool("show_lead_form", {
        productId: props.product.id,
        brandId: props.product.brand_id,
        variantId: selectedVariant?.id
      });
      setLoading(null);
    } catch (err) {
      setError(`Failed to show lead form: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(null);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  if (!props.product) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Không tìm thấy thông tin sản phẩm.</p>
      </div>
    );
  }

  const displayPrice = selectedVariant?.price || props.product.base_price;
  const displayCurrency = selectedVariant?.currency || props.product.currency || 'VND';

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        {props.brandName && (
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
            {props.brandName}
          </div>
        )}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          margin: '0 0 16px 0',
          lineHeight: '1.2'
        }}>
          {props.product.name}
        </h1>
      </div>

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

      {/* Image Gallery */}
      <div style={{ marginBottom: '24px' }}>
        {props.product.image_url && (
          <img
            src={props.product.image_url}
            alt={props.product.name}
            style={{
              width: '100%',
              maxHeight: '400px',
              objectFit: 'cover',
              borderRadius: '12px',
              marginBottom: '12px'
            }}
          />
        )}
        {props.product.images && props.product.images.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {props.product.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${props.product.name} - ${idx + 1}`}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Price */}
      {displayPrice && (
        <div style={{
          fontSize: '36px',
          fontWeight: '700',
          color: '#2563eb',
          marginBottom: '24px'
        }}>
          {formatPrice(displayPrice, displayCurrency)}
        </div>
      )}

      {/* Variants */}
      {props.variants && props.variants.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            Chọn phiên bản:
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {props.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                style={{
                  padding: '12px 16px',
                  border: selectedVariant?.id === variant.id ? '2px solid #2563eb' : '1px solid #ddd',
                  backgroundColor: selectedVariant?.id === variant.id ? '#eff6ff' : '#fff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: selectedVariant?.id === variant.id ? '600' : '400',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedVariant?.id !== variant.id) {
                    e.currentTarget.style.borderColor = '#999';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedVariant?.id !== variant.id) {
                    e.currentTarget.style.borderColor = '#ddd';
                  }
                }}
              >
                <div>{variant.name}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {formatPrice(variant.price, variant.currency)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {props.product.description && (
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#333',
            margin: 0
          }}>
            {props.product.description}
          </p>
        </div>
      )}

      {/* Long Description */}
      {props.product.long_description && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '12px'
          }}>
            Chi tiết sản phẩm:
          </h3>
          <div style={{
            fontSize: '14px',
            lineHeight: '1.8',
            color: '#555',
            whiteSpace: 'pre-wrap'
          }}>
            {props.product.long_description}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        position: 'sticky',
        bottom: '0',
        backgroundColor: '#fff',
        padding: '16px 0',
        borderTop: '1px solid #ddd',
        display: 'flex',
        gap: '12px'
      }}>
        {props.product.checkout_url && (
          <button
            onClick={handleCheckout}
            disabled={loading === 'checkout'}
            style={{
              flex: 1,
              padding: '16px 24px',
              backgroundColor: loading === 'checkout' ? '#ddd' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading === 'checkout' ? 'wait' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              if (loading !== 'checkout') {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }
            }}
            onMouseLeave={(e) => {
              if (loading !== 'checkout') {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
          >
            {loading === 'checkout' ? 'Đang xử lý...' : 'Mua ngay'}
          </button>
        )}

        <button
          onClick={handleLeadCapture}
          disabled={loading === 'lead'}
          style={{
            flex: 1,
            padding: '16px 24px',
            backgroundColor: loading === 'lead' ? '#ddd' : '#fff',
            color: '#2563eb',
            border: '2px solid #2563eb',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading === 'lead' ? 'wait' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (loading !== 'lead') {
              e.currentTarget.style.backgroundColor = '#eff6ff';
            }
          }}
          onMouseLeave={(e) => {
            if (loading !== 'lead') {
              e.currentTarget.style.backgroundColor = '#fff';
            }
          }}
        >
          {loading === 'lead' ? 'Đang xử lý...' : 'Nhận tư vấn miễn phí'}
        </button>
      </div>
    </div>
  );
}
