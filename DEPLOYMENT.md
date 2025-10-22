# Deployment Guide

## Prerequisites

✅ **Completed**: Project has been fully built and tested locally

## Step-by-Step Deployment

### 1. Setup Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in Supabase Dashboard
3. Copy and paste the entire content of [`supabase/schema.sql`](supabase/schema.sql)
4. Click **Run** to create all tables, indexes, RLS policies, and sample data
5. Get your credentials from **Settings → API**:
   - `SUPABASE_URL`: Project URL
   - `SUPABASE_SERVICE_KEY`: `service_role` key (NOT `anon` key)

### 2. Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: MCP Affiliate Server"

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml` configuration
5. Or manually configure:
   - **Name**: `khanh-mcp-server`
   - **Environment**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free (or Starter for better performance)

6. Add Environment Variables:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key-here
   PORT=8000
   ```

7. Click **Create Web Service**

### 4. Wait for Deployment

- Render will install dependencies and build your project
- Watch the logs for any errors
- Once deployed, you'll get a URL like: `https://khanh-mcp-server.onrender.com`

### 5. Test Your Server

```bash
# Health check (should return 200)
curl https://your-service.onrender.com/mcp

# Or visit in browser - should see SSE connection
```

### 6. Connect to ChatGPT

1. Open ChatGPT
2. Go to **Settings** → **Model Context Protocol**
3. Click **Add Server**
4. Enter:
   - **Name**: Affiliate Widget Server
   - **URL**: `https://your-service.onrender.com/mcp`
5. Click **Save**

### 7. Test in ChatGPT

Try these prompts:

```
"Show me available brands"
"Hiển thị danh sách thương hiệu"
"I want to see products from [brand name]"
"Tôi muốn tư vấn về sản phẩm này"
```

## Troubleshooting

### Build Fails on Render

**Check logs** in Render dashboard for specific errors:

- **Missing dist files**: Ensure `npm run bundle:widgets` runs in build command
- **TypeScript errors**: Server code should compile without UI folder
- **Missing dependencies**: Check `package.json` has all required packages

### Server Starts But Widgets Don't Load

1. **Check widget HTML files exist**: `ls dist/*.html` should show 4 files
2. **Verify Supabase credentials**: Wrong URL or key will cause silent failures
3. **Check Render logs**: Look for "Widget HTML file not found" errors

### ChatGPT Can't Connect

1. **Verify server is running**: Visit `https://your-service.onrender.com/mcp` in browser
2. **Check URL format**: Must end with `/mcp` path
3. **Wait for cold start**: Free tier Render services sleep after inactivity (15-30 second startup)

### Supabase Errors

1. **Check RLS policies**: Ensure `service_role` can insert into leads/events tables
2. **Verify schema**: Run the full `schema.sql` script again
3. **Check table names**: Must match exactly: `brands`, `products`, `leads`, etc.

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SUPABASE_URL` | ✅ Yes | Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_KEY` | ✅ Yes | Service role API key (NOT anon key) | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |
| `PORT` | ⚠️ Auto | Server port (Render sets automatically) | `8000` |
| `NODE_ENV` | ❌ Optional | Node environment | `production` |

## Local Testing Before Deploy

```bash
# 1. Setup local .env file
cp .env.example .env
# Edit .env with your Supabase credentials

# 2. Build widgets
npm run bundle:widgets

# 3. Build server
npm run build

# 4. Start server
npm start

# 5. Test at http://localhost:8000/mcp
```

## Updating After Deployment

```bash
# Make your changes
git add .
git commit -m "Your change description"
git push

# Render will auto-deploy (if autoDeploy: true in render.yaml)
```

## Performance Tips

### Render Free Tier

- **Cold starts**: 15-30 seconds after inactivity
- **Always-on**: Upgrade to Starter plan ($7/month)
- **Regions**: Choose closest to your users (Singapore for Asia)

### Supabase Free Tier

- **500MB database**: Plenty for thousands of leads
- **API requests**: 50,000/month (generous for most use cases)
- **Upgrade**: When you hit limits or need more performance

## Security Checklist

- ✅ Never commit `.env` file (in `.gitignore`)
- ✅ Use `service_role` key (for server), never `anon` key
- ✅ RLS policies enabled on all Supabase tables
- ✅ Environment variables set in Render dashboard (not in code)
- ✅ HTTPS only (Render provides this automatically)

## Support

- **Issues**: [Create an issue](https://github.com/your-repo/issues)
- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **MCP Docs**: https://github.com/fractal-mcp/sdk

---

**Deployment Status**: ✅ Ready to Deploy

Built with Fractal MCP SDK • Powered by Supabase • Hosted on Render
