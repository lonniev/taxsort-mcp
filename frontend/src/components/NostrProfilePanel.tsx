// Nostr kind-0 profile panel — discovers the patron's self-sovereign identity
// FROM Nostr (via the operator's free get_nostr_profile) and, with a NIP-07
// signer, lets them edit + publish a client-signed kind-0 visible in every
// Nostr client. Distinct from the "Nostr Identity" card above (just the npub).

import { useEffect, useState } from "react";
import { canSignProfile, fetchProfile, publishProfile, type Kind0 } from "../lib/nostrProfile";

const field =
  "w-full rounded-lg px-3 py-2 text-sm bg-white border border-stone-300 focus:outline-none focus:border-emerald-400";

function isUrl(v: string): boolean {
  return /^(https?:\/\/|data:image\/)/i.test(v);
}

export default function NostrProfilePanel({ npub }: { npub: string }) {
  const [picture, setPicture] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [about, setAbout] = useState("");
  const [nip05, setNip05] = useState("");
  const [lud16, setLud16] = useState("");
  const [website, setWebsite] = useState("");

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const signer = canSignProfile();

  useEffect(() => {
    let live = true;
    setLoading(true);
    fetchProfile(npub)
      .then((p: Kind0 | null) => {
        if (!live || !p) return;
        setPicture(p.picture ?? "");
        setDisplayName(p.display_name || p.name || "");
        setAbout(p.about ?? "");
        setNip05(p.nip05 ?? "");
        setLud16(p.lud16 ?? "");
        setWebsite(p.website ?? "");
      })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [npub]);

  async function publish() {
    setPublishing(true);
    setMsg(null);
    try {
      const r = await publishProfile(npub, {
        name: displayName, display_name: displayName, about, nip05, lud16, website, picture,
      });
      if (r.error) {
        setMsg({ tone: "err", text: r.error });
      } else {
        const ok = r.ok ?? 0;
        setMsg({
          tone: ok > 0 ? "ok" : "err",
          text: ok > 0 ? `Published to ${ok}/${r.total} relays.` : "No relay accepted the event.",
        });
      }
    } catch (e) {
      setMsg({ tone: "err", text: (e as Error).message });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
      <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Nostr Profile</div>
      <div className="text-xs text-stone-400 mb-3">
        Read from your kind-0 metadata — shown in every Nostr client. Edits are signed in your browser and relayed.
      </div>

      {loading ? (
        <div className="text-sm text-stone-400 py-2">Reading from relays…</div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-4">
            {picture && isUrl(picture) ? (
              <img src={picture} alt="" className="h-12 w-12 rounded-full object-cover border border-stone-200" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center text-lg">{"\u{1FAAA}"}</div>
            )}
          </div>

          <div className="space-y-3">
            <label className="block text-xs text-stone-500">
              Display name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={`mt-1 ${field}`} placeholder="Satoshi" />
            </label>
            <label className="block text-xs text-stone-500">
              Picture URL
              <input value={picture} onChange={(e) => setPicture(e.target.value)} className={`mt-1 ${field}`} placeholder="https://…/avatar.png" />
            </label>
            <label className="block text-xs text-stone-500">
              Lightning address (lud16)
              <input value={lud16} onChange={(e) => setLud16(e.target.value)} className={`mt-1 ${field}`} placeholder="you@walletofsatoshi.com" />
            </label>
            <label className="block text-xs text-stone-500">
              NIP-05
              <input value={nip05} onChange={(e) => setNip05(e.target.value)} className={`mt-1 ${field}`} placeholder="name@domain.com" />
            </label>
            <label className="block text-xs text-stone-500">
              Website
              <input value={website} onChange={(e) => setWebsite(e.target.value)} className={`mt-1 ${field}`} placeholder="https://…" />
            </label>
            <label className="block text-xs text-stone-500">
              About
              <textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={2} className={`mt-1 ${field} resize-none`} placeholder="A short bio…" />
            </label>
          </div>

          {msg && (
            <div className={`mt-3 rounded-lg p-2.5 text-xs ${
              msg.tone === "ok"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {msg.text}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={publish}
              disabled={publishing || !signer}
              title={signer ? "Sign and publish your kind-0 to relays" : "Needs a NIP-07 browser extension (Alby, nos2x)"}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40 transition-colors"
            >
              {publishing ? "Publishing…" : "Publish to Nostr"}
            </button>
            {!signer && (
              <span className="text-xs text-stone-400" title="Install a NIP-07 extension (Alby, nos2x) to publish. Discovery still works.">
                Read-only — needs a NIP-07 signer to publish.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
