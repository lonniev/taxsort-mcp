/**
 * Cloudflare Pages Function — proxy /mcp to taxsort-mcp.fastmcp.app/mcp.
 * Avoids CORS by keeping browser requests same-origin.
 *
 * Handles POST (tool calls), GET (SSE streaming), DELETE (session close),
 * and OPTIONS (CORS preflight).
 */

const UPSTREAM = "https://taxsort-mcp.fastmcp.app/mcp";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-session-id, accept, last-event-id",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

export async function onRequest(context) {
  const req = context.request;

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Build upstream request
  const upHeaders = new Headers();

  // Forward relevant headers
  for (const [key, value] of req.headers) {
    const lk = key.toLowerCase();
    if (lk === "content-type" || lk === "accept" || lk === "mcp-session-id" || lk === "last-event-id") {
      upHeaders.set(key, value);
    }
  }
  upHeaders.set("Host", "taxsort-mcp.fastmcp.app");

  const init = {
    method: req.method,
    headers: upHeaders,
  };

  // Forward body for POST/PUT/PATCH
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "DELETE") {
    init.body = req.body;
    init.duplex = "half";
  }

  try {
    const resp = await fetch(UPSTREAM, init);

    // Pass through response with CORS headers
    const respHeaders = new Headers(resp.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      respHeaders.set(k, v);
    }

    return new Response(resp.body, {
      status: resp.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Proxy error", detail: String(err) }), {
      status: 502,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  }
}
