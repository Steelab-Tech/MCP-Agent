# ✅ TODO cho MCP Affiliate (Fractal SDK)

## 1. Chuẩn bị môi trường
- [ ] Đọc nhanh README + docs chính thức của `@fractal-mcp/oai-server` và `@fractal-mcp/cli` (bundle, widget API, tool API).
- [ ] Tạo repo trống `mcp-affiliate`; chạy `npm init -y`.
- [ ] Cài deps runtime: `@fractal-mcp/oai-server`, `@fractal-mcp/oai-hooks`, `@fractal-mcp/cli`, `@supabase/supabase-js`, `react`, `react-dom`, `zod`.
- [ ] Cài dev deps: `typescript`, `tsx`, `rimraf`, `@types/react`, `@types/react-dom`.
- [ ] Khởi tạo `tsconfig.json` theo cấu hình trong `plan.md` (outDir `build`, module `commonjs`, target `es2020`, v.v.).

## 2. Tạo cấu trúc dự án
- [ ] Tạo thư mục + file rỗng:
  - `server/index.ts`
  - `ui/BrandList.tsx`
  - `ui/ProductList.tsx`
  - `ui/ProductDetail.tsx`
  - `ui/LeadForm.tsx`
  - `dist/` (để chứa bundle)
  - `render.yaml`
- [ ] Cập nhật `package.json` với các script:
  - `bundle:widgets` (bundle 4 widget → `dist`)
  - `build` (gọi `bundle:widgets` rồi `tsc`)
  - `start` (chạy `node build/server/index.js`)
  - `dev` (dùng `tsx watch server/index.ts`)

## 3. Phát triển UI Widgets (dùng Fractal Hooks)
- [ ] `BrandList.tsx`: sử dụng `useWidgetProps` để nhận danh sách brands, `useWidgetApi().invokeTool("select_brand")` khi chọn thương hiệu.
- [ ] `ProductList.tsx` + `ProductDetail.tsx`: hiển thị dữ liệu từ `props`, format theo nhu cầu, gọi tool phù hợp nếu người dùng chọn sản phẩm/checkout.
- [ ] `LeadForm.tsx`: build form nhập thông tin, validate client (có thể dùng `zod`), gọi `invokeTool("submit_lead", payload)` khi submit thành công.
- [ ] Bổ sung UI nhỏ (loading/error state) dựa trên hướng dẫn hooks của Fractal để tránh tự ý xử lý DOM.

## 4. Bundle widgets
- [ ] Chạy thử `npm run bundle:widgets`, đảm bảo Fractal CLI tạo `dist/*.html`.
- [ ] Nếu CLI hỗ trợ glob, cân nhắc tối ưu script; nếu không, giữ các lệnh `bundle` tuần tự theo plan.

## 5. MCP Server (`server/index.ts`)
- [ ] Import `McpServer`, `registerOpenAIWidget`, `registerTool`, `startOpenAIWidgetHttpServer` theo docs.
- [ ] Khởi tạo Supabase client với env `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
- [ ] Định nghĩa schema `leadPayload` bằng `zod` (brand_id, product_id?, payload record, consent).
- [ ] Đăng ký widget `brand-list` (đọc HTML từ `dist`, fetch brands active = true) trả về `structuredContent` + message.
- [ ] Đăng ký tool `select_brand` (schema uuid) → fetch products, trả `structuredContent`.
- [ ] Đăng ký widget `lead-form` (serve HTML, trả message hướng dẫn).
- [ ] Đăng ký tool `submit_lead` (schema `leadPayload`) → insert Supabase `leads`, trả message xác nhận.
- [ ] Đăng ký tool `track_event` với schema `{ type: "search" | "click", payload }` → insert vào bảng tương ứng.
- [ ] `startOpenAIWidgetHttpServer` với port `process.env.PORT || 8000`.
- [ ] Đảm bảo mọi đường dẫn `fs.readFileSync` trỏ đúng tới bundle HTML.

## 6. Cấu hình Render deploy
- [ ] Tạo `render.yaml` đúng thông số (node 18, build/start command, autoDeploy, env vars placeholder).
- [ ] Kiểm tra `package.json` scripts tương thích Render build environment (`npm ci`, `npm run build`).

## 7. Supabase setup
- [ ] Chuẩn bị file `supabase/schema.sql` (hoặc README hướng dẫn) tạo bảng `brands`, `products`, `product_variants`, `leads`, `click_events`, `search_events`.
- [ ] Kích hoạt extensions `pg_trgm`, `uuid-ossp`.
- [ ] Thêm RLS policies:
  - Public read (`select`) cho brands/products/variants.
  - Chỉ `service_role` được insert leads/events.
- [ ] Tạo index theo nhu cầu (ví dụ: `brand_id`, `slug`, `created_at`).

## 8. Testing & QA
- [ ] Chạy `npm run dev` + `npm run bundle:widgets` để kiểm tra hot reload và bundle không lỗi.
- [ ] Viết ghi chú test ChatGPT: kết nối MCP qua URL Render, chạy prompt mẫu (hiển thị brand, gửi lead).
- [ ] Kiểm tra log Supabase khi submit lead/tracking.
- [ ] Rà soát bảo mật: không commit env, đảm bảo chỉ dùng `service_role` phía server, không xử lý thanh toán.

## 9. Chuẩn bị deploy & tài liệu
- [ ] Push repo lên GitHub.
- [ ] Thiết lập dịch vụ Render trỏ tới repo, nhập env vars.
- [ ] Sau deploy, xác nhận endpoint hoạt động (health check, log).
- [ ] Cập nhật README/tài liệu hướng dẫn chạy local & deploy.
