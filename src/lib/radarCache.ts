// In-memory route-level cache for Radar feed.
// Survives page navigation (module-level), resets on full reload.
// Prevents quota burn when user navigates away and back within TTL.

import type { RadarFeed } from "./radar.functions";

const TTL_MS = 60_000; // 60s

interface CacheEntry {
  feed: RadarFeed;
  expiresAt: number;
  scope: string;
}

let entry: CacheEntry | null = null;

function scopeKey(walletAddress?: string | null, hasUserKey?: boolean): string {
  return `${walletAddress?.toLowerCase() ?? "anon"}:${hasUserKey ? "byok" : "default"}`;
}

export function getCachedFeed(
  walletAddress?: string | null,
  hasUserKey?: boolean,
): RadarFeed | null {
  if (!entry) return null;
  const scope = scopeKey(walletAddress, hasUserKey);
  if (entry.scope !== scope) return null;
  if (Date.now() > entry.expiresAt) return null;
  return entry.feed;
}

export function setCachedFeed(
  feed: RadarFeed,
  walletAddress?: string | null,
  hasUserKey?: boolean,
): void {
  entry = {
    feed,
    expiresAt: Date.now() + TTL_MS,
    scope: scopeKey(walletAddress, hasUserKey),
  };
}

export function invalidateCachedFeed(): void {
  entry = null;
}

export function getCacheAgeMs(): number | null {
  if (!entry) return null;
  return Math.max(0, TTL_MS - (entry.expiresAt - Date.now()));
}
