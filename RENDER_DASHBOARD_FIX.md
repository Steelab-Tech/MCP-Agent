# CRITICAL: Render Dashboard Override Issue

## Problem
Despite having correct Procfile and render.yaml, Render is still running:
```
node index.js
```

## Root Cause
**Render Dashboard manual settings override both Procfile and render.yaml!**

## IMMEDIATE FIX REQUIRED

### Go to Render Dashboard NOW:
1. Log into https://dashboard.render.com
2. Click on your service: `khanh-mcp-server`
3. Go to **Settings** tab
4. Find **"Start Command"** field

### You will see one of these scenarios:

#### Scenario A: Start Command is manually set (LIKELY)
```
Start Command: [npm start] or [node index.js] or similar
```
**ACTION:**
- **DELETE/CLEAR** the entire Start Command field
- Click **Save Changes**
- This forces Render to use Procfile instead

#### Scenario B: Start Command is empty
**ACTION:**
- Manually set it to: `node build/server/index.js`
- Click **Save Changes**

### Then Force Redeploy:
1. Go to **"Manual Deploy"** tab
2. Click **"Clear build cache & deploy"**

## Why This Happens
Render priority order:
1. 🔴 **Dashboard manual settings** (HIGHEST - overrides everything)
2. 🟡 **Procfile** (if dashboard is empty)
3. 🟢 **render.yaml** (LOWEST priority)

## Verification Steps
After fixing dashboard:
1. Check deployment logs should show:
   ```
   ==> Running 'node build/server/index.js'
   ```
   NOT:
   ```
   ==> Running 'node index.js'
   ```

2. Server should start successfully:
   ```
   🚀 MCP Server started on port 10000
   ```

## If Still Failing
Check these in Render Dashboard:
- [ ] Build Command: `npm ci && npm run build`
- [ ] Start Command: `node build/server/index.js` OR empty (to use Procfile)
- [ ] Environment: Node
- [ ] Node Version: 22 (in Environment tab)
- [ ] Root Directory: empty or `/`

## Alternative: Use Infrastructure as Code
To prevent dashboard overrides in future:
1. Delete service from Render
2. Create new service using "Infrastructure as Code"
3. Point to your GitHub repo with render.yaml
4. This locks config to files, preventing manual overrides
