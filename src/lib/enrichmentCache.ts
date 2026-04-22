// 60s in-memory + localStorage cache for GeckoTerminal enrichment per token address.
// Saves the embedded chart from re-fetching when the user re-runs Decide.

import type { TokenEnrichment } from "@/lib/bscscan.functions";

const TTL_MS = 60_000;
const KEY = "cc.enrich.cache.v1";

interface Entry { ts: number; data: TokenEnrichment }
type Store = Record<string, Entry>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch { return {}; }
}

function write(s: Store) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* silent */ }
}

export interface CachedEnrichment { data: TokenEnrichment; ageMs: number }

export function getCachedEnrichment(address: string): CachedEnrichment | null {
  const s = read();
  const e = s[address.toLowerCase()];
  if (!e) return null;
  const ageMs = Date.now() - e.ts;
  if (ageMs > TTL_MS) {
    delete s[address.toLowerCase()];
    write(s);
    return null;
  }
  return { data: e.data, ageMs };
}

export const ENRICHMENT_TTL_MS = TTL_MS;

export function setCachedEnrichment(address: string, data: TokenEnrichment) {
  const s = read();
  // Cap at 30 entries
  const entries = Object.entries(s);
  if (entries.length > 30) {
    entries.sort((a, b) => a[1].ts - b[1].ts);
    for (let i = 0; i < entries.length - 30; i++) delete s[entries[i][0]];
  }
  s[address.toLowerCase()] = { ts: Date.now(), data };
  write(s);
}
