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

// ── Debug log (visible in on-screen panel) ─────────────────────────────────

export interface DebugEntry {
  ts: string;
  type: "info" | "call" | "result" | "error";
  message: string;
}

const _debugLog: DebugEntry[] = [];
const _listeners: Set<() => void> = new Set();
const MAX_LOG = 50;

function debugPush(type: DebugEntry["type"], message: string) {
  const ts = new Date().toLocaleTimeString();
  _debugLog.unshift({ ts, type, message });
  if (_debugLog.length > MAX_LOG) _debugLog.length = MAX_LOG;
  _listeners.forEach((fn) => fn());
}

export function useDebugLog() {
  const [, setTick] = useState(0);
  const ref = useRef<() => void>();

  if (!ref.current) {
    ref.current = () => setTick((t) => t + 1);
    _listeners.add(ref.current);
  }

  return _debugLog;
}

// ── Client ──────────��──────────────────────────────────────────────────────

let client: Client | null = null;
let connecting: Promise<void> | null = null;

async function getClient(): Promise<Client> {
  if (client) return client;
  if (connecting) {
    await connecting;
    return client!;
  }

  connecting = (async () => {
    debugPush("info", `Connecting to ${MCP_URL}`);
    const c = new Client({ name: "taxsort-app", version: "0.1.0" });
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
    await c.connect(transport);
    debugPush("info", "Connected");
    client = c;
    connecting = null;
  })();

  await connecting;
  return client!;
}

async function mcpCall(toolName: string, args: Record<string, unknown>): Promise<unknown> {
  debugPush("call", `taxsort_${toolName}(${JSON.stringify(args).slice(0, 120)})`);
  const c = await getClient();
  let result;
  try {
    result = await c.callTool(
      { name: `taxsort_${toolName}`, arguments: args },
      undefined,
      { timeout: 120_000 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    debugPush("error", `taxsort_${toolName}: ${msg}`);
    throw e;
  }
  debugPush("result", `taxsort_${toolName} → ${JSON.stringify(result).slice(0, 200)}`);

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
