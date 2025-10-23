# Debug Render Deployment Issues

## Current Status

### ✅ Working:
- Supabase API: ✓ OK (tested via test-supabase.html)
- Local build: ✓ OK
- Code quality: ✓ OK

### ❌ Not Working:
- Render deployment returns 404 for all routes
- ChatGPT cannot connect to MCP server
- Brand list loads very slow in ChatGPT
- Brand detail click shows error

## Issue Analysis

### Server Status:
```bash
$ curl -I https://mcp-agent-hip5.onrender.com/mcp
HTTP/2 404

$ curl https://mcp-agent-hip5.onrender.com/
Not Found
```

**Diagnosis**: Server is running but routes are not registered

### Possible Causes:

1. **Build Failed on Render**
   - TypeScript compilation error
   - Missing dependencies
   - dist/ folder not created

2. **Server Crashed on Startup**
   - Missing environment variables
   - Widget HTML files not found
   - Database connection error

3. **Route Registration Failed**
   - `startOpenAIWidgetHttpServer` not completing
   - Error in `createServer()` function
   - MCP SDK incompatibility

## Required Actions

### 1. Check Render Logs (URGENT!)

Go to Render Dashboard:
1. https://dashboard.render.com
2. Click service: `mcp-agent-hip5`
3. Click **Logs** tab
4. Look for:
   - Build errors
   - Runtime errors
   - "🚀 MCP Server started" message
   - Stack traces

### 2. Check Environment Variables

Verify in Render Dashboard → Settings → Environment:
- `SUPABASE_URL`: https://lcjjnqsoenuhkgfxjwji.supabase.co
- `SUPABASE_SERVICE_KEY`: (should be set)
- `PORT`: (auto-provided by Render)
- `NODE_VERSION`: 22

### 3. Common Error Patterns

#### A. "Widget HTML file not found"
```
Error: Widget HTML file not found: /opt/render/project/src/dist/BrandList.html
```

**Fix**: Check if dist/ is being built
```bash
# In render.yaml
buildCommand: npm ci && npm run build
# Should create dist/BrandList.html etc.
```

#### B. "Missing environment variables"
```
Error: Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY
```

**Fix**: Set in Render Dashboard → Environment

#### C. Stack Overflow (should be fixed now)
```
RangeError: Maximum call stack size exceeded
```

**Fix**: Already implemented in latest code

#### D. Module not found
```
Error: Cannot find module '/opt/render/project/src/build/server/index.js'
```

**Fix**: Already fixed with root index.js

## Quick Debug Commands

### Test if server is actually running:
```bash
curl -v https://mcp-agent-hip5.onrender.com/ 2>&1 | grep -E "(HTTP|Server)"
```

### Test specific endpoints:
```bash
# SSE endpoint
curl -N https://mcp-agent-hip5.onrender.com/mcp

# POST endpoint
curl -X POST https://mcp-agent-hip5.onrender.com/mcp/messages?sessionId=test \
  -H "Content-Type: application/json" \
  -d '{"method":"ping"}'
```

### Test if dist files exist on Render:
Check in logs for:
```
✅ All widgets bundled successfully!
-rw-r--r-- ... dist/BrandList.html
-rw-r--r-- ... dist/ProductList.html
```

## Expected Healthy Logs

When working correctly, you should see:
```
==> Building...
$ npm ci && npm run build

> khanh-mcp@1.0.0 build
> npm run bundle:widgets && tsc -p tsconfig.json && echo '✅ Build completed. Files:' && ls -la build/server/

Bundling BrandList...
Bundling ProductList...
Bundling ProductDetail...
Bundling LeadForm...
✅ All widgets bundled successfully!
✅ Build completed. Files:
-rw-r--r-- 1 render render 18758 index.js

==> Starting...
$ node index.js
🚀 MCP Server started on port 10000
📡 Ready to accept connections from ChatGPT
🔗 Server URL: http://localhost:10000/mcp
```

## If Logs Show Success But Routes Still 404

This could mean:
1. Port mismatch (check if using correct PORT env var)
2. HTTP server not listening on 0.0.0.0
3. Render's health check failing
4. SSE transport issue

### Debug Steps:
1. Check if PORT env var is being read:
   ```javascript
   const port = parseInt(process.env.PORT || "8000", 10);
   console.log(`Using port: ${port}`);
   ```

2. Verify server actually listens:
   ```javascript
   const httpServer = startOpenAIWidgetHttpServer({...});
   console.log(`Server listening: ${httpServer.listening}`);
   ```

## Alternative: Use Render Shell

If you have Render paid plan, use Shell to debug:
```bash
# In Render Shell
cd /opt/render/project/src
ls -la dist/
ls -la build/server/
cat build/server/index.js | head -20
node index.js  # Run manually to see errors
```

## Next Steps

1. **PRIORITY 1**: Get Render logs and share them
2. **PRIORITY 2**: Verify environment variables are set
3. **PRIORITY 3**: Check if build output (dist/, build/) exists
4. **PRIORITY 4**: Test endpoints after fixing issues

## Contact Points

- Render Status: https://status.render.com
- Render Docs: https://render.com/docs/troubleshooting-deploys
- Supabase Status: https://status.supabase.com
