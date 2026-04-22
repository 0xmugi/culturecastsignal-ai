// Tiny client-side cache for /decide results.
// Keyed by `${provider}:${address}`. TTL = 5 minutes.
// Avoids burning AI quota when re-analyzing the same token.

import type { BscTokenInfo } from "@/lib/bscscan.functions";
import type { AIDecideResult, DecideProvider } from "@/lib/aiDecide.functions";

const TTL_MS = 5 * 60 * 1000;
const STORAGE_KEY = "cc.decide.cache.v1";
const LAST_ADDR_KEY = "cc.decide.lastAddr.v1";

interface CacheEntry {
  ts: number;
  tokenInfo: BscTokenInfo;
  aiResult: AIDecideResult;
}

type Store = Record<string, CacheEntry>;

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode — silent fail */
  }
}

function key(provider: DecideProvider, address: string) {
  return `${provider}:${address.toLowerCase()}`;
}

export function getCachedDecide(
  provider: DecideProvider,
  address: string,
): { tokenInfo: BscTokenInfo; aiResult: AIDecideResult; ageMs: number } | null {
  const store = read();
  const entry = store[key(provider, address)];
  if (!entry) return null;
  const ageMs = Date.now() - entry.ts;
  if (ageMs > TTL_MS) {
    delete store[key(provider, address)];
    write(store);
    return null;
  }
  return { tokenInfo: entry.tokenInfo, aiResult: entry.aiResult, ageMs };
}

export function setCachedDecide(
  provider: DecideProvider,
  address: string,
  tokenInfo: BscTokenInfo,
  aiResult: AIDecideResult,
) {
  const store = read();
  // Soft cap — drop oldest entries if > 30 to keep storage small.
  const entries = Object.entries(store);
  if (entries.length > 30) {
    entries.sort((a, b) => a[1].ts - b[1].ts);
    for (let i = 0; i < entries.length - 30; i++) delete store[entries[i][0]];
  }
  store[key(provider, address)] = { ts: Date.now(), tokenInfo, aiResult };
  write(store);
}

export const DECIDE_CACHE_TTL_MS = TTL_MS;

// --- Last-pasted address persistence (separate from result cache) ---

export function saveLastAddr(addr: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_ADDR_KEY, addr);
  } catch {
    /* silent */
  }
}

export function loadLastAddr(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(LAST_ADDR_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearLastAddr() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LAST_ADDR_KEY);
  } catch {
    /* silent */
  }
}
