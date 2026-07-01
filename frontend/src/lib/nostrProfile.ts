// Nostr kind-0 profile. Relay I/O lives in the wheel (get_nostr_profile /
// publish_nostr_profile); the FE only does the part that MUST stay client-side:
// SIGNING. taxsort logs in with npub + DM (no in-browser nsec), so the only
// signer is a NIP-07 browser extension. Discovery (read) is public and works
// for everyone; publishing needs a NIP-07 signer.

import { mcpCall } from "../hooks/useMCP";

export interface Kind0 {
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  website?: string;
  lud16?: string;
}

interface Nip07 {
  getPublicKey(): Promise<string>;
  signEvent(event: {
    kind: number;
    created_at: number;
    tags: string[][];
    content: string;
    pubkey: string;
  }): Promise<{ id: string; sig: string; [k: string]: unknown }>;
}
declare global {
  interface Window {
    nostr?: Nip07;
  }
}

export interface PublishResult {
  success?: boolean;
  ok?: number;
  total?: number;
  error?: string;
}

/// Publishing needs a browser Nostr signer (NIP-07). Discovery does not.
export function canSignProfile(): boolean {
  return typeof window !== "undefined" && !!window.nostr;
}

/// Read the npub's public kind-0 via the operator MCP (free, no proof).
export async function fetchProfile(npub: string): Promise<Kind0 | null> {
  try {
    const r = (await mcpCall("get_nostr_profile", { npub })) as { profile?: Kind0 };
    return r?.profile && Object.keys(r.profile).length ? r.profile : null;
  } catch {
    return null;
  }
}

/// Sign a kind-0 with the patron's NIP-07 extension and hand the signed event to
/// the wheel to relay. Throws when no NIP-07 signer is present.
export async function publishProfile(npub: string, content: Kind0): Promise<PublishResult> {
  const clean: Kind0 = {};
  for (const [k, v] of Object.entries(content)) {
    if (typeof v === "string" && v.trim()) clean[k as keyof Kind0] = v.trim();
  }
  if (typeof window === "undefined" || !window.nostr) {
    throw new Error(
      "No signer — a NIP-07 browser extension (e.g. Alby, nos2x) is required to publish your Nostr profile.",
    );
  }
  const pubkey = await window.nostr.getPublicKey();
  const signed = await window.nostr.signEvent({
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: JSON.stringify(clean),
    pubkey,
  });
  return (await mcpCall("publish_nostr_profile", {
    npub,
    signed_event: JSON.stringify(signed),
  })) as PublishResult;
}
