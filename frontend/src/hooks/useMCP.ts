/**
 * useToolCall — TaxSort's React wrapper over the package client.
 *
 * The connection, the npub/proof envelope and the proof-bounce handling are
 * `@tollbooth-dpyc/web`'s `callTool`. This hook only adds the loading/error
 * state a page renders. A proof bounce still reaches the package's
 * `onProofExpired`, which brings back the sign-in gate.
 */

import { useState, useCallback } from "react";
import { callTool } from "@tollbooth-dpyc/web";

export function useToolCall<TResult = unknown>(toolName: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invoke = useCallback(
    async (args: Record<string, unknown> = {}): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      try {
        return await callTool<TResult>(toolName, args);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [toolName],
  );

  return { invoke, loading, error };
}
