/**
 * Cloudflare Pages Function — proxy /mcp to taxsort-mcp.fastmcp.app/mcp.
 * Avoids CORS by keeping browser requests same-origin.
 */

const UPSTREAM = "https://taxsort-mcp.fastmcp.app/mcp";

export async function onRequest(context) {
  const req = context.request;

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, mcp-session-id, accept",
        "Access-Control-Expose-Headers": "mcp-session-id",
      },
    });
  }

  // Forward to upstream
  const upHeaders = new Headers(req.headers);
  upHeaders.set("Host", "taxsort-mcp.fastmcp.app");
  // Remove CF-specific headers that upstream doesn't need
  upHeaders.delete("cf-connecting-ip");
  upHeaders.delete("cf-ray");

  const upstream = new Request(UPSTREAM, {
    method: req.method,
    headers: upHeaders,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    duplex: "half",
  });

  const resp = await fetch(upstream);

  // Pass through response with CORS headers
  const respHeaders = new Headers(resp.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Expose-Headers", "mcp-session-id");

  return new Response(resp.body, {
    status: resp.status,
    headers: respHeaders,
  });
}
