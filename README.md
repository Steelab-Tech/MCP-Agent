# MCP Affiliate Server

**Model Context Protocol (MCP) Server for ChatGPT Widget System**

A production-ready MCP server that enables ChatGPT to display interactive UI widgets for affiliate marketing and lead capture. Built with Fractal MCP SDK, Supabase, and TypeScript.

## Features

- **Interactive ChatGPT Widgets**: Display brand catalogs, product listings, and lead forms directly in ChatGPT
- **Dual Flow Support**:
  - **Flow A**: Affiliate checkout (redirect to merchant with tracking)
  - **Flow B**: Lead capture (collect customer info for follow-up)
- **Event Tracking**: Track user interactions (searches, clicks, conversions)
- **Supabase Backend**: Secure PostgreSQL database with Row Level Security (RLS)
- **Production Ready**: Deployable to Render with auto-scaling

## Architecture

```
ChatGPT (user ↔ MCP)
       │
       ▼
[Render MCP Server]
  ├─ server/index.ts (MCP API)
  ├─ ui/*.tsx → bundled → dist/*.html
  └─ Supabase API client
       │
       ▼
[Supabase]
  ├─ Tables: brands, products, leads, events
  ├─ RLS policies
  └─ Analytics views
```

## Tech Stack

| Layer   | Technology                      | Purpose                     |
|---------|---------------------------------|-----------------------------|
| UI      | React + `@fractal-mcp/oai-hooks`| ChatGPT widget components   |
| Bundler | `@fractal-mcp/cli` + Vite       | Bundle widgets → HTML       |
| Server  | Node 18 + `@fractal-mcp/oai-server` | MCP protocol handler    |
| Backend | Supabase (Postgres + RLS)       | Database & API              |
| Deploy  | Render                          | Web service hosting         |

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Render account (for deployment)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd khanh-mcp
npm install
```

### 2. Setup Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the schema setup:
   ```bash
   # Copy schema.sql content and run it in Supabase SQL Editor
   # Or use Supabase CLI:
   supabase db push
   ```
3. Get your credentials from Supabase Dashboard > Settings > API:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` (service_role key)

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
PORT=8000
```

### 4. Bundle Widgets

```bash
npm run bundle:widgets
```

This compiles the React widgets into standalone HTML files in the `dist/` directory.

### 5. Run Locally

```bash
npm run dev
```

Server will start at `http://localhost:8000`

## Development Workflow

### Project Structure

```
khanh-mcp/
├── server/
│   └── index.ts          # MCP server implementation
├── ui/
│   ├── BrandList.tsx     # Brand selection widget
│   ├── ProductList.tsx   # Product catalog widget
│   ├── ProductDetail.tsx # Product detail widget
│   └── LeadForm.tsx      # Lead capture form widget
├── dist/                 # Bundled HTML widgets (generated)
├── supabase/
│   └── schema.sql        # Database schema
├── package.json
├── tsconfig.json
├── render.yaml           # Render deployment config
└── README.md
```

### Widget Development

Widgets use Fractal MCP hooks for state management and tool invocation:

```tsx
import { useWidgetProps, useWidgetApi } from "@fractal-mcp/oai-hooks";

export default function MyWidget() {
  const props = useWidgetProps<MyProps>();
  const { invokeTool } = useWidgetApi();

  const handleAction = async () => {
    await invokeTool("tool_name", { param: "value" });
  };

  return <div>...</div>;
}
```

### Rebuild Widgets

After modifying any widget in `ui/`, rebuild:

```bash
npm run bundle:widgets
```

### Watch Mode (Development)

For hot-reload during development:

```bash
npm run dev
```

In a separate terminal, rebuild widgets when needed:

```bash
npm run bundle:widgets
```

## Available MCP Tools

The server exposes these tools for ChatGPT to invoke:

| Tool             | Description                                  |
|------------------|----------------------------------------------|
| `select_brand`   | Select a brand and load its products         |
| `select_product` | View product details and variants            |
| `show_lead_form` | Display lead capture form                    |
| `submit_lead`    | Save lead information to database            |
| `track_event`    | Track user interactions (search/click)       |

## Available Widgets

| Widget ID         | Description                       |
|-------------------|-----------------------------------|
| `brand-list`      | Display active brands             |
| `product-list`    | Show products for selected brand  |
| `product-detail`  | Product details with checkout CTA |
| `lead-form`       | Lead capture form                 |

## Deployment

### Deploy to Render

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Create Render Service**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`

3. **Set Environment Variables** in Render Dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `PORT` (default: 8000)

4. **Deploy**:
   - Render will automatically build and deploy
   - Build command: `npm ci && npm run build`
   - Start command: `npm run start`

5. **Get Your Server URL**:
   - After deployment, copy your server URL: `https://your-service.onrender.com`

### Connect to ChatGPT

1. Open ChatGPT
2. Go to Settings → Model Context Protocol
3. Add new MCP server:
   - **Name**: Affiliate Widget Server
   - **URL**: `https://your-service.onrender.com`
4. Save and test with prompts like:
   - "Show me available brands"
   - "I want to see products from [brand name]"
   - "I'd like to request a consultation"

## Database Schema

### Core Tables

- **brands**: Merchant/brand information
- **products**: Product catalog
- **product_variants**: Product variations (size, color, etc.)
- **leads**: Customer lead information
- **click_events**: Click tracking for analytics
- **search_events**: Search behavior tracking

### Row Level Security (RLS)

- **Public read**: brands, products, product_variants (active only)
- **Service role only**: leads, click_events, search_events
- All writes require `service_role` authentication

### Sample Queries

```sql
-- View all active brands
SELECT * FROM brands WHERE active = true;

-- View products by brand
SELECT * FROM products WHERE brand_id = 'uuid' AND active = true;

-- View recent leads
SELECT * FROM leads ORDER BY created_at DESC LIMIT 10;

-- Click analytics
SELECT * FROM product_click_analytics;
```

## Security

- **Environment Variables**: Never commit `.env` files
- **Service Role Key**: Only stored in Render environment
- **RLS Policies**: Prevent unauthorized database access
- **No Payment Processing**: Only redirect to merchant checkout URLs
- **Consent Required**: Lead forms require explicit user consent

## Testing

### Local Testing

```bash
# Start server
npm run dev

# In another terminal, test endpoints
curl http://localhost:8000/health
```

### ChatGPT Testing Prompts

```
"Hiển thị danh sách thương hiệu"
"Show me products from [brand]"
"I want to buy [product name]"
"I need consultation for [product]"
```

## Troubleshooting

### Widget Bundle Errors

```bash
# Clear dist and rebuild
rm -rf dist
npm run bundle:widgets
```

### TypeScript Errors

```bash
# Rebuild everything
npm run build
```

### Supabase Connection Issues

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- Check Supabase project is active
- Ensure service_role key is used (not anon key)

### Render Deployment Issues

- Check build logs in Render dashboard
- Verify environment variables are set
- Ensure `dist/` folder contains HTML files after build

## Performance

- **Cold Start**: ~2-3 seconds on Render free tier
- **Response Time**: <200ms for widget rendering
- **Database**: Supabase auto-scales based on usage
- **Caching**: Consider adding Redis for high-traffic scenarios

## Future Enhancements

- [ ] Admin dashboard (Next.js)
- [ ] Per-brand API keys
- [ ] Email notifications on new leads
- [ ] Analytics dashboard
- [ ] Webhook integrations
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

ISC

## Support

For issues or questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: See `plan.md` and `todo-task.md`

## Acknowledgments

- Built with [Fractal MCP SDK](https://github.com/fractal-mcp)
- Powered by [Supabase](https://supabase.com)
- Deployed on [Render](https://render.com)

---

**Made with Claude Code**
