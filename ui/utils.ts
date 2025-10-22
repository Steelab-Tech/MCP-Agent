// Utility to call MCP tools from widgets
export async function callTool(name: string, args: Record<string, unknown>): Promise<void> {
  try {
    // Access the webplus/openai API from window
    const win = typeof window !== 'undefined' ? window : undefined;
    const api = (win as any)?.webplus || (win as any)?.openai;

    if (api?.callTool) {
      await api.callTool(name, args);
    } else {
      console.warn('MCP API not available - tool call will not be executed:', name, args);
    }
  } catch (error) {
    console.error('Failed to call tool:', name, error);
    throw error;
  }
}
