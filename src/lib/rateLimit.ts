// Client-side daily rate limit for default-tier (no BYOK) users.
// Persisted per-wallet in localStorage. Resets at next UTC midnight.

const DAILY_LIMIT = 20;
const KEY_PREFIX = "cc:rl:radar:";

export interface RateLimitState {
  used: number;
  limit: number;
  remaining: number;
  resetAt: number; // ms timestamp
  resetInMs: number;
  exceeded: boolean;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function nextUtcMidnight(): number {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0);
}

function storageKey(scope: string): string {
  return `${KEY_PREFIX}${scope}:${todayKey()}`;
}

function safeRead(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const v = window.localStorage.getItem(key);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

function safeWrite(key: string, value: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* ignore quota / private mode */
  }
}

function buildState(used: number, limit: number): RateLimitState {
  const resetAt = nextUtcMidnight();
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    resetAt,
    resetInMs: Math.max(0, resetAt - Date.now()),
    exceeded: used >= limit,
  };
}

export function readRateLimit(walletAddress?: string | null, hasUserKey?: boolean): RateLimitState {
  const limit = hasUserKey ? Number.POSITIVE_INFINITY : DAILY_LIMIT;
  if (hasUserKey) return buildState(0, limit);
  const scope = walletAddress?.toLowerCase() ?? "anon";
  const used = safeRead(storageKey(scope));
  return buildState(used, DAILY_LIMIT);
}

export function consumeRateLimit(
  walletAddress?: string | null,
  hasUserKey?: boolean,
): RateLimitState {
  if (hasUserKey) return buildState(0, Number.POSITIVE_INFINITY);
  const scope = walletAddress?.toLowerCase() ?? "anon";
  const key = storageKey(scope);
  const used = safeRead(key) + 1;
  safeWrite(key, used);
  return buildState(used, DAILY_LIMIT);
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "0m";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
