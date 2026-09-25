// Cloudflare Pages Function: /mcp → the taxsort-mcp operator on Horizon.
import { makeMcpProxy } from "@tollbooth-dpyc/web/pages-proxy";

export const onRequest = makeMcpProxy("https://taxsort-mcp.fastmcp.app/mcp");
