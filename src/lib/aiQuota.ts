// Client-side fair-share daily quota for AI calls (Radar Groq + Decide AI).
// Goal: with ~10 concurrent free users, the system-wide key isn't exhausted.
// Free users get a small per-day cap, Pro/Elite get progressively larger caps,
// and BYOK (user provided their own key) is unlimited.
//
// Persisted per-wallet in localStorage. Resets at next UTC midnight.

import { getCurrentPlan, type Plan } from "./plan";

export type AiScope = "radar" | "decide";

const KEY_PREFIX = "cc:aiq:";

// Per-plan daily caps. Free is intentionally small to spread the system key
// across ~10 concurrent users without rate-limit cascades.
const CAPS: Record<Plan, Record<AiScope, number>> = {
  free:  { radar: 8,  decide: 6  },
  pro:   { radar: 60, decide: 50 },
  elite: { radar: 250, decide: 200 },
};

export interface AiQuotaState {
  used: number;
  limit: number;
  remaining: number;
  resetAt: number;
  resetInMs: number;
  exceeded: boolean;
  unlimited: boolean;
  plan: Plan;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function nextUtcMidnight(): number {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

function storageKey(scope: AiScope, wallet?: string | null): string {
  return `${KEY_PREFIX}${scope}:${wallet?.toLowerCase() ?? "anon"}:${todayKey()}`;
}

function read(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(window.localStorage.getItem(key) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function write(key: string, val: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(val));
  } catch {
    /* noop */
  }
}

function build(used: number, limit: number, plan: Plan, unlimited: boolean): AiQuotaState {
  const resetAt = nextUtcMidnight();
  return {
    used,
    limit,
    remaining: unlimited ? Number.POSITIVE_INFINITY : Math.max(0, limit - used),
    resetAt,
    resetInMs: Math.max(0, resetAt - Date.now()),
    exceeded: !unlimited && used >= limit,
    unlimited,
    plan,
  };
}

export function readAiQuota(scope: AiScope, wallet?: string | null, hasUserKey?: boolean): AiQuotaState {
  const plan = getCurrentPlan();
  if (hasUserKey) return build(0, Number.POSITIVE_INFINITY, plan, true);
  const limit = CAPS[plan][scope];
  return build(read(storageKey(scope, wallet)), limit, plan, false);
}

export function consumeAiQuota(scope: AiScope, wallet?: string | null, hasUserKey?: boolean): AiQuotaState {
  const plan = getCurrentPlan();
  if (hasUserKey) return build(0, Number.POSITIVE_INFINITY, plan, true);
  const limit = CAPS[plan][scope];
  const k = storageKey(scope, wallet);
  const used = read(k) + 1;
  write(k, used);
  return build(used, limit, plan, false);
}
