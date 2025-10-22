# 🧭 PLAN.md — MCP Server for ChatGPT Widget System

## 🎯 Goal

Triển khai **MCP server** (Model Context Protocol) dùng **Fractal MCP SDK** để ChatGPT có thể hiển thị **UI widgets** cho người dùng.

* Deploy backend (MCP server) lên **Render**
* Sử dụng **Supabase** làm database & event tracking backend
* Dùng **Fractal SDK** để build widget UI và server
* Hỗ trợ 2 flow chính:
  **Flow A: Checkout (affiliate link)**
  **Flow B: Lead capture (form → save to Supabase)**

---

## 🧱 STACK OVERVIEW

| Layer   | Tech                                | Notes                           |
| ------- | ----------------------------------- | ------------------------------- |
| UI      | React + `@fractal-mcp/oai-hooks`    | ChatGPT widget components       |
| Bundler | `@fractal-mcp/cli` + Vite           | Bundle widget → HTML            |
| Server  | Node 18 + `@fractal-mcp/oai-server` | MCP protocol handler            |
| Backend | Supabase (Postgres + RLS)           | Brands, Products, Leads, Events |
| Deploy  | Render                              | Web service (persistent server) |

---

## 🧩 ARCHITECTURE

```
ChatGPT (user ↔ MCP)
       │
       ▼
[Render MCP Server]
  ├─ /server/index.ts (MCP API)
  ├─ /ui/*.tsx → bundled → /dist/*.html
  └─ Supabase API client
       │
       ▼
[Supabase]
  ├─ Tables: brands, products, leads, events
  ├─ RLS policies
  └─ Optional webhooks/email trigger
```

---

## 🧰 STEP-BY-STEP IMPLEMENTATION

### 1️⃣ Init Project

```bash
mkdir mcp-affiliate
cd mcp-affiliate
npm init -y
npm install @fractal-mcp/oai-server @fractal-mcp/oai-hooks @fractal-mcp/cli @supabase/supabase-js zod react react-dom
npm install -D typescript tsx rimraf @types/react @types/react-dom
```

Init TypeScript config:

```bash
npx tsc --init --rootDir . --outDir build --moduleResolution node --module commonjs --target es2020 --esModuleInterop true --resolveJsonModule true --skipLibCheck true
```

Project structure:

```
mcp-affiliate/
├── server/
│   └── index.ts
├── ui/
│   ├── BrandList.tsx
│   ├── ProductList.tsx
│   ├── ProductDetail.tsx
│   └── LeadForm.tsx
├── dist/
├── package.json
├── tsconfig.json
└── render.yaml
```

---

### 2️⃣ Build Widgets (UI Layer)

Each widget dùng `@fractal-mcp/oai-hooks` và giao tiếp với server thông qua MCP tools.

#### Example: `/ui/BrandList.tsx`

```tsx
import { useWidgetProps, useWidgetApi } from "@fractal-mcp/oai-hooks";

export default function BrandList() {
  const props = useWidgetProps<{ brands: any[] }>();
  const { invokeTool } = useWidgetApi();

  const handleSelect = async (brand: any) => {
    await invokeTool("select_brand", { brandId: brand.id });
  };

  return (
    <div>
      <h2>Chọn thương hiệu</h2>
      <ul>
        {props.brands?.map(b => (
          <li key={b.id}>
            <button onClick={() => handleSelect(b)}>
              <img src={b.logo_url} width="24" /> {b.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Thêm script bundle tất cả widget:

```json
"scripts": {
  "bundle:widgets": "rimraf dist && mkdir -p dist && npx @fractal-mcp/cli bundle --entrypoint=./ui/BrandList.tsx --out=./dist && npx @fractal-mcp/cli bundle --entrypoint=./ui/ProductList.tsx --out=./dist && npx @fractal-mcp/cli bundle --entrypoint=./ui/ProductDetail.tsx --out=./dist && npx @fractal-mcp/cli bundle --entrypoint=./ui/LeadForm.tsx --out=./dist"
}
```

> Nếu CLI không hỗ trợ `--glob`, gọi nhiều lần trong script shell.

Build widgets trước khi deploy:

```bash
npm run bundle:widgets
```

Tương tự với `ProductList`, `ProductDetail`, `LeadForm`.

> `LeadForm` cần gọi `invokeTool("submit_lead", data)` sau khi validate đầu vào để gửi thông tin về server; có thể kết hợp `zod` trên client để báo lỗi sớm cho người dùng.

---

### 3️⃣ Implement MCP Server

**File: `/server/index.ts`**

```ts
import { McpServer, registerOpenAIWidget, registerTool, startOpenAIWidgetHttpServer } from "@fractal-mcp/oai-server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import fs from "fs";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

function createServer() {
  const server = new McpServer({ name: "affiliate-mcp", version: "1.0.0" });

  const leadPayload = z.object({
    brand_id: z.string().uuid(),
    product_id: z.string().uuid().nullable().optional(),
    payload: z.record(z.unknown()),
    consent: z.boolean().default(false),
  });

  // --- Widget: Brand List ---
  registerOpenAIWidget(
    server,
    {
      id: "brand-list",
      title: "Chọn thương hiệu",
      html: fs.readFileSync("./dist/BrandList.html", "utf-8"),
      description: "Hiển thị danh sách thương hiệu đang hoạt động",
    },
    async () => {
      const { data } = await supabase.from("brands").select("*").eq("active", true);
      return { structuredContent: { brands: data }, content: [{ type: "text", text: "Danh sách thương hiệu:" }] };
    }
  );

  // --- Tool: chọn thương hiệu ---
  registerTool(server, "select_brand", {
    schema: z.object({ brandId: z.string().uuid() }),
    handler: async ({ brandId }) => {
      const { data: products } = await supabase.from("products").select("*").eq("brand_id", brandId).eq("active", true);
      return { content: [{ type: "text", text: "Đã chọn thương hiệu." }], structuredContent: { products } };
    },
  });

  // --- Widget: Lead Form ---
  registerOpenAIWidget(
    server,
    {
      id: "lead-form",
      title: "Gửi thông tin tư vấn",
      html: fs.readFileSync("./dist/LeadForm.html", "utf-8"),
    },
    async () => ({
      content: [{ type: "text", text: "Điền form và nhấn gửi để lưu lead." }],
    })
  );

  // --- Tool: submit lead ---
  registerTool(server, "submit_lead", {
    schema: leadPayload,
    handler: async (input) => {
      await supabase.from("leads").insert({
        brand_id: input.brand_id,
        product_id: input.product_id,
        payload: input.payload,
        consent: input.consent,
      });
      return { content: [{ type: "text", text: "Thông tin đã được gửi thành công." }] };
    },
  });

  return server;
}

startOpenAIWidgetHttpServer({
  port: process.env.PORT || 8000,
  serverFactory: createServer,
});
```

---

### 4️⃣ Configure Render

**Scripts trong `package.json`:**

```json
"scripts": {
  "dev": "tsx watch server/index.ts",
  "bundle:widgets": "rimraf dist && mkdir -p dist && npx @fractal-mcp/cli bundle --entrypoint=./ui/BrandList.tsx --out=./dist && npx @fractal-mcp/cli bundle --entrypoint=./ui/ProductList.tsx --out=./dist && npx @fractal-mcp/cli bundle --entrypoint=./ui/ProductDetail.tsx --out=./dist && npx @fractal-mcp/cli bundle --entrypoint=./ui/LeadForm.tsx --out=./dist",
  "build": "npm run bundle:widgets && tsc -p tsconfig.json",
  "start": "node build/server/index.js"
}
```

> Có thể dùng `npm-run-all` hoặc script shell riêng để rút gọn chuỗi lệnh bundle, miễn đảm bảo tất cả widget được build trước khi chạy `tsc`.

Tạo file `render.yaml` (hoặc cấu hình trực tiếp trên dashboard Render):

```yaml
services:
  - type: web
    name: affiliate-mcp
    env: node
    plan: starter
    nodeVersion: 18
    buildCommand: npm ci && npm run build
    startCommand: npm run start
    autoDeploy: true
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
```

Deploy:

1. Push repo lên GitHub.
2. Trên Render, tạo Web Service mới trỏ tới repo.
3. Chọn branch, nhập build/start command như trên, khai báo env vars.
4. Deploy. Render giữ process chạy liên tục và hỗ trợ WebSocket ổn định cho MCP.

---

### 5️⃣ Configure Supabase

**Schema** (dựa trên script hiện có, chỉ cần kiểm tra lại):

* `brands`, `products`, `product_variants`, `leads`, `click_events`, `search_events`
* Kích hoạt extensions `pg_trgm` + `uuid-ossp`
* Bật RLS:
  * Public read: `brands`, `products`, `product_variants`
  * Service-only insert: `leads`, `click_events`, `search_events`
* Tạo policies cho phép role `service_role` ghi, các role khác chỉ đọc.
* Tạo index cần thiết cho tra cứu theo `brand_id`, `slug`, `created_at`.

---

### 6️⃣ Event Tracking

Đăng ký tool trong server:

```ts
registerTool(server, "track_event", {
  schema: z.object({
    type: z.enum(["search", "click"]),
    payload: z.record(z.unknown()),
  }),
  handler: async ({ type, payload }) => {
    const table = type === "search" ? "search_events" : "click_events";
    await supabase.from(table).insert(payload);
    return { content: [{ type: "text", text: "Đã ghi event." }] };
  },
});
```

Widget gọi `invokeTool("track_event", { ... })` khi cần log search/click. Với form submit, `LeadForm` đã dùng `submit_lead` nên không cần gọi thêm tại đây.

---

### 7️⃣ Testing

* Local dev: `npm run dev` (tsx hot-reload), đồng thời chạy `npm run bundle:widgets` mỗi khi cập nhật UI hoặc dùng watch script tùy chọn.
* Kết nối ChatGPT → “Add MCP server”.
* Dùng URL Render (`https://<service>.onrender.com`) trong file cấu hình MCP của ChatGPT.
* Test prompt:

  > “Hiển thị danh sách thương hiệu checkout.”
  > “Tôi muốn gửi thông tin tư vấn cho [brand].”

* Kiểm tra log Render & Supabase khi tạo lead/event.

---

## 🔐 Security

* Supabase RLS chặn mọi ghi ngoài `service_role`.
* `service_role` key chỉ đặt trong env của Render (không commit).
* Không xử lý payment, chỉ redirect checkout URL (kèm UTM/aff param).

---

## 🧾 Deliverables

* ✅ Repo deployable (Render-ready)
* ✅ Supabase `schema.sql`
* ✅ MCP server kết nối ChatGPT được
* ✅ Event tracking & Lead capture qua tools
* ✅ Secure env setup

---

## ⚙️ Optional Next Plan

> (để dành cho phase sau — không implement trong plan này)

* Admin dashboard (Next.js / Supabase Auth)
* Per-brand API keys
* Email webhook on new lead
* Analytics dashboard

---

## 🧠 PROMPT FOR AGENT

Nếu bạn dùng Agent để thực thi kế hoạch này, hãy dùng prompt sau:

> **Prompt cho Agent:**
>
> “Hãy implement toàn bộ dự án theo `plan.md` này.
>
> * Dự án: MCP Server cho ChatGPT widgets (checkout + lead capture).
> * Stack: Fractal MCP SDK, Supabase, Render, TypeScript.
> * Nhiệm vụ: Tạo folder cấu trúc, viết code server, widgets, bundle setup, config Supabase, file deploy.
> * Kết quả: Repo deployable trên Render, có thể connect vào ChatGPT qua MCP.
> * Làm theo từng bước trong plan.md.”
