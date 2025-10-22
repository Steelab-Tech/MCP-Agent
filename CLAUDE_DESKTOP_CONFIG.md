# Claude Desktop MCP Configuration

## Prerequisites
- Server phải chạy thành công và trả về 200 OK
- URL: https://mcp-agent-hip5.onrender.com/mcp

## Configuration Steps

### 1. Locate Claude Desktop Config File

**macOS:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 2. Add MCP Server Configuration

Open the config file and add:

```json
{
  "mcpServers": {
    "khanh-affiliate": {
      "url": "https://mcp-agent-hip5.onrender.com/mcp",
      "transport": "sse"
    }
  }
}
```

**Full example with multiple servers:**
```json
{
  "mcpServers": {
    "khanh-affiliate": {
      "url": "https://mcp-agent-hip5.onrender.com/mcp",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_IF_NEEDED"
      }
    },
    "other-server": {
      "command": "node",
      "args": ["/path/to/other-server/index.js"]
    }
  }
}
```

### 3. Restart Claude Desktop

1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. The MCP server will auto-connect on startup

### 4. Verify Connection

In Claude Desktop chat, you should see:
- 🔌 A connection indicator showing MCP servers
- New tools available from your server

### 5. Test MCP Tools

Try asking Claude to use your MCP tools:

```
"Show me affiliate brands"
"Display product list for brand X"
"Create a lead capture form"
```

## Available Tools

Your MCP server provides these tools:

1. **get_widget_html**
   - Get rendered HTML for widgets
   - Widgets: BrandList, ProductList, ProductDetail, LeadForm

2. **list_brands**
   - List all affiliate brands from Supabase

3. **get_products_by_brand**
   - Get products for a specific brand

4. **create_lead**
   - Capture lead information

5. **track_click**
   - Track affiliate link clicks

## Troubleshooting

### Server not connecting
```bash
# Test MCP endpoint manually
curl https://mcp-agent-hip5.onrender.com/mcp

# Should return SSE stream headers:
# Content-Type: text/event-stream
# Connection: keep-alive
```

### Tools not appearing
1. Check Claude Desktop logs:
   ```bash
   # macOS
   ~/Library/Logs/Claude/

   # Check for MCP errors
   grep -i "mcp" ~/Library/Logs/Claude/main.log
   ```

2. Verify config syntax:
   ```bash
   # Validate JSON
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python -m json.tool
   ```

### 502 Bad Gateway
- Server crashed or deployment failed
- Check Render logs for errors
- Verify environment variables are set

## Testing with curl

### Test SSE endpoint:
```bash
curl -N https://mcp-agent-hip5.onrender.com/mcp
```

Expected output (SSE stream):
```
data: {"type":"session","id":"..."}

data: {"type":"tools","tools":[...]}
```

### Test with session:
```bash
curl -X POST \
  https://mcp-agent-hip5.onrender.com/mcp/messages?sessionId=test123 \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list"}'
```

## Security Notes

1. **HTTPS Required**: Claude Desktop requires HTTPS for remote MCP servers
2. **Authentication**: Add API keys via headers if needed
3. **CORS**: Your server already has CORS enabled
4. **Rate Limiting**: Consider adding rate limits for production

## Next Steps

Once server is running:
1. ✅ Verify health endpoint returns 200
2. ✅ Test MCP SSE stream
3. ✅ Add config to Claude Desktop
4. ✅ Restart Claude Desktop
5. ✅ Test tools in conversation
