import React, { useState } from "react";
import { useWidgetProps } from "@fractal-mcp/oai-hooks";
import { z } from "zod";
import { callTool } from "./utils";

interface LeadFormProps {
  brandId: string;
  brandName?: string;
  productId?: string;
  productName?: string;
  variantId?: string;
}

// Zod schema for client-side validation
const leadSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại phải có ít nhất 10 số").regex(/^[0-9+\-\s()]+$/, "Số điện thoại không hợp lệ"),
  message: z.string().optional(),
  consent: z.boolean().refine(val => val === true, "Bạn phải đồng ý với điều khoản")
});

export default function LeadForm() {
  const props = useWidgetProps<LeadFormProps>();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: "",
    consent: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    // Validate with Zod
    const result = leadSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setLoading(true);

      // Prepare payload
      const payload = {
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        variant_id: props.variantId
      };

      // Submit lead via MCP tool
      await callTool("submit_lead", {
        brand_id: props.brandId,
        product_id: props.productId || null,
        payload: payload,
        consent: formData.consent
      });

      setSuccess(true);
      setLoading(false);

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          message: "",
          consent: false
        });
        setSuccess(false);
      }, 3000);

    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi gửi thông tin');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px'
        }}>
          ✓
        </div>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#059669',
          marginBottom: '12px'
        }}>
          Gửi thành công!
        </h2>
        <p style={{
          fontSize: '16px',
          color: '#666'
        }}>
          Cảm ơn bạn đã quan tâm. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h2 style={{
        fontSize: '28px',
        fontWeight: '700',
        marginBottom: '8px'
      }}>
        Nhận tư vấn miễn phí
      </h2>

      {props.brandName && (
        <div style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '4px'
        }}>
          Thương hiệu: {props.brandName}
        </div>
      )}

      {props.productName && (
        <div style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '20px'
        }}>
          Sản phẩm: {props.productName}
        </div>
      )}

      <p style={{
        fontSize: '14px',
        color: '#666',
        marginBottom: '24px',
        lineHeight: '1.6'
      }}>
        Vui lòng điền thông tin bên dưới để nhận tư vấn từ chuyên gia của chúng tôi.
      </p>

      {submitError && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '6px',
            color: '#333'
          }}>
            Họ và tên <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: errors.fullName ? '2px solid #ef4444' : '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            placeholder="Nguyễn Văn A"
            disabled={loading}
          />
          {errors.fullName && (
            <div style={{
              fontSize: '12px',
              color: '#ef4444',
              marginTop: '4px'
            }}>
              {errors.fullName}
            </div>
          )}
        </div>

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '6px',
            color: '#333'
          }}>
            Email <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: errors.email ? '2px solid #ef4444' : '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            placeholder="email@example.com"
            disabled={loading}
          />
          {errors.email && (
            <div style={{
              fontSize: '12px',
              color: '#ef4444',
              marginTop: '4px'
            }}>
              {errors.email}
            </div>
          )}
        </div>

        {/* Phone */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '6px',
            color: '#333'
          }}>
            Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: errors.phone ? '2px solid #ef4444' : '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            placeholder="0912345678"
            disabled={loading}
          />
          {errors.phone && (
            <div style={{
              fontSize: '12px',
              color: '#ef4444',
              marginTop: '4px'
            }}>
              {errors.phone}
            </div>
          )}
        </div>

        {/* Message */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '6px',
            color: '#333'
          }}>
            Lời nhắn (tùy chọn)
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => handleChange('message', e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              minHeight: '100px',
              resize: 'vertical',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
            placeholder="Để lại lời nhắn hoặc câu hỏi của bạn..."
            disabled={loading}
          />
        </div>

        {/* Consent Checkbox */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'start',
            gap: '8px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={formData.consent}
              onChange={(e) => handleChange('consent', e.target.checked)}
              style={{
                marginTop: '4px',
                width: '18px',
                height: '18px',
                cursor: 'pointer'
              }}
              disabled={loading}
            />
            <span style={{
              fontSize: '14px',
              color: '#555',
              lineHeight: '1.5'
            }}>
              Tôi đồng ý cho phép thu thập và sử dụng thông tin cá nhân để nhận tư vấn.{' '}
              <span style={{ color: '#ef4444' }}>*</span>
            </span>
          </label>
          {errors.consent && (
            <div style={{
              fontSize: '12px',
              color: '#ef4444',
              marginTop: '4px',
              marginLeft: '26px'
            }}>
              {errors.consent}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: loading ? '#ddd' : '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'wait' : 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }
          }}
        >
          {loading ? 'Đang gửi...' : 'Gửi thông tin'}
        </button>
      </form>

      <div style={{
        marginTop: '16px',
        fontSize: '12px',
        color: '#999',
        textAlign: 'center',
        lineHeight: '1.5'
      }}>
        Thông tin của bạn sẽ được bảo mật và chỉ sử dụng cho mục đích tư vấn.
      </div>
    </div>
  );
}
