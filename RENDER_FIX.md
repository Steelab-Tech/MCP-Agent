# Render Deployment Fix

## Problem
Render was running `node index.js` instead of the correct start command, causing:
```
Error: Cannot find module '/opt/render/project/src/index.js'
```

## Root Cause Analysis
1. **Render auto-detection issue**: Render's Node.js auto-detection was overriding the `render.yaml` configuration
2. **Missing Procfile**: Render prioritizes Procfile over render.yaml for start commands
3. **Incorrect package.json main**: The `main` field was pointing to wrong path

## Solution Applied

### 1. Created `Procfile`
```
web: node build/server/index.js
```
This explicitly tells Render how to start the application.

### 2. Updated `package.json`
- Changed `"main": "index.js"` → `"main": "build/server/index.js"`
- Added `"type": "commonjs"` to explicitly declare module system

### 3. Updated `render.yaml`
- Changed `startCommand: npm run start` → `startCommand: node build/server/index.js`
- Updated `NODE_VERSION: 18` → `NODE_VERSION: 22` (matches runtime)
- Changed `PORT: 8000` → `PORT: 10000` (Render's default)

## Project Structure
```
khanh-mcp/
├── server/
│   └── index.ts          # Source TypeScript file
├── build/
│   └── server/
│       └── index.js      # Compiled output (entry point)
├── dist/                 # Widget HTML bundles
├── package.json          # Fixed main field
├── Procfile             # NEW: Render start command
├── render.yaml          # Updated configuration
└── tsconfig.json        # Compiles to build/
```

## Build Process
1. `npm run bundle:widgets` - Bundles React widgets to HTML
2. `tsc -p tsconfig.json` - Compiles TypeScript to `build/server/index.js`
3. `node build/server/index.js` - Starts the MCP server

## Verification
✅ Local build test passed
✅ Local server starts correctly on port 8080
✅ All dependencies resolved

## Deployment Instructions
```bash
git add Procfile package.json render.yaml
git commit -m "fix: Configure Render deployment with Procfile and correct entry point"
git push origin main
```

## Expected Behavior
After deployment, Render will:
1. Run `npm ci && npm run build` (build command)
2. Execute `node build/server/index.js` (from Procfile)
3. Server starts on PORT specified by Render (env var)
4. Health check at `/health` endpoint

## Environment Variables Required in Render
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `PORT` (auto-provided by Render)
- `NODE_VERSION=22`
