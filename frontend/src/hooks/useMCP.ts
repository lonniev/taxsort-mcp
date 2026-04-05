/**
 * useMCP — React hooks for calling taxsort-mcp tools.
 *
 * Uses the official @modelcontextprotocol/sdk Client with
 * StreamableHTTPClientTransport. The SDK handles the initialize
 * handshake, session tracking, SSE parsing, and reconnection.
 */

import { useState, useCallback, useRef } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const _envUrl = import.meta.env.VITE_MCP_URL as string;
const MCP_URL = _envUrl.startsWith("/")
  ? `${window.location.origin}${_envUrl}`
  : _envUrl;

let client: Client | null = null;
let connecting: Promise<void> | null = null;

async function getClient(): Promise<Client> {
  if (client) return client;
  if (connecting) {
    await connecting;
    return client!;
  }

  connecting = (async () => {
    console.log(`[MCP] connecting to ${MCP_URL}`);
    const c = new Client({ name: "taxsort-app", version: "0.1.0" });
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
    await c.connect(transport);
    console.log("[MCP] connected");
    client = c;
    connecting = null;
  })();

  await connecting;
  return client!;
}

async function mcpCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
  console.log(`[MCP] calling taxsort_${toolName}`, args);
  const c = await getClient();
  const result = await c.callTool({
    name: `taxsort_${toolName}`,
    arguments: args,
  });
  console.log(`[MCP] result for taxsort_${toolName}`, result);

  if (result.isError) {
    const content = result.content as Array<Record<string, unknown>> | undefined;
    const errText = content
      ?.filter((b) => b.type === "text")
      .map((b) => String(b.text))
      .join("\n") ?? "Tool call failed";
    throw new Error(errText);
  }

  // Prefer structuredContent if available
  const structured = (result as Record<string, unknown>).structuredContent;
  if (structured) {
    return structured;
  }

  // Parse content[0].text as JSON
  const content = result.content as Array<Record<string, unknown>> | undefined;
  const textBlocks = content?.filter((b) => b.type === "text");
  if (textBlocks?.length) {
    const text = String(textBlocks[0].text);
    try { return JSON.parse(text); } catch { return text; }
  }

  return result;
}

/**
 * Hook for calling a specific MCP tool with typed result.
 */
export function useToolCall<TResult = unknown>(toolName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invoke = useCallback(
    async (args: Record<string, unknown> = {}): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await mcpCall(toolName, args);
        return result as TResult;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toolName],
  );

  return { invoke, loading, error };
}

/**
 * Hook for polling a tool at an interval.
 */
export function useToolPoll<TResult = unknown>(
  toolName: string,
  intervalMs: number = 3000,
) {
  const [data, setData] = useState<TResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(
    (args: Record<string, unknown> = {}) => {
      setLoading(true);
      setError(null);

      const poll = async () => {
        try {
          const result = await mcpCall(toolName, args);
          setData(result as TResult);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          setError(msg);
        }
      };

      poll();
      timerRef.current = setInterval(poll, intervalMs);
    },
    [toolName, intervalMs],
  );

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setLoading(false);
  }, []);

  return { data, loading, error, start, stop };
}
