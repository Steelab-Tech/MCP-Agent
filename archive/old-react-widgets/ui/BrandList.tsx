import React, { useState } from "react";
import { useWidgetProps } from "@fractal-mcp/oai-hooks";
import { callTool } from "./utils";

interface Brand {
  id: string;
  name: string;
  logo_url: string;
  description?: string;
  active: boolean;
}

interface BrandListProps {
  brands: Brand[];
}

export default function BrandList() {
  const props = useWidgetProps<BrandListProps>();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (brand: Brand) => {
    try {
      setLoading(brand.id);
      setError(null);
      await callTool("select_brand", { brandId: brand.id });
      setLoading(null);
    } catch (err) {
      setError(`Failed to select brand: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(null);
    }
  };

  if (!props.brands || props.brands.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Không có thương hiệu nào khả dụng.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
        Chọn Thương Hiệu
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

      <div style={{ display: 'grid', gap: '12px' }}>
        {props.brands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => handleSelect(brand)}
            disabled={loading === brand.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              backgroundColor: loading === brand.id ? '#f5f5f5' : '#fff',
              cursor: loading === brand.id ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              if (loading !== brand.id) {
                e.currentTarget.style.backgroundColor = '#f9f9f9';
                e.currentTarget.style.borderColor = '#999';
              }
            }}
            onMouseLeave={(e) => {
              if (loading !== brand.id) {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.borderColor = '#ddd';
              }
            }}
          >
            {brand.logo_url && (
              <img
                src={brand.logo_url}
                alt={`${brand.name} logo`}
                style={{
                  width: '48px',
                  height: '48px',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>
                {brand.name}
              </div>
              {brand.description && (
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {brand.description}
                </div>
              )}
            </div>
            {loading === brand.id && (
              <div style={{ fontSize: '14px', color: '#666' }}>Đang tải...</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
