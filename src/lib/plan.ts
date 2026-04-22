// CultureCast subscription plans.
// Plans are persisted in localStorage after USDT activation on BNB Chain.

export type Plan = "free" | "pro" | "elite";

export type Feature =
  | "radar.basic"
  | "radar.unlimited"
  | "decide.basic"
  | "decide.multiAI"
  | "ai.launchKit"
  | "launch.fourmeme";

interface FeatureMeta {
  minPlan: Plan;
  label: string;
  comingSoon?: boolean;
}

export const FEATURES: Record<Feature, FeatureMeta> = {
  "radar.basic": { minPlan: "free", label: "Radar" },
  "radar.unlimited": { minPlan: "pro", label: "Live Radar", comingSoon: true },
  "decide.basic": { minPlan: "free", label: "Decide" },
  "decide.multiAI": { minPlan: "pro", label: "Multi-AI Decide", comingSoon: true },
  "ai.launchKit": { minPlan: "elite", label: "AI Launch Kit", comingSoon: true },
  "launch.fourmeme": { minPlan: "elite", label: "Launch on Four.meme", comingSoon: true },
};

export const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, elite: 2 };

const PLAN_STORAGE_KEY = "cc:plan";
const PLAN_EXPIRY_KEY = "cc:plan:expiresAt";
const PLAN_TX_KEY = "cc:plan:txHash";
const PLAN_EVENT = "cc:plan:changed";

export function getCurrentPlan(): Plan {
  if (typeof window === "undefined") return "free";
  try {
    const expires = Number(localStorage.getItem(PLAN_EXPIRY_KEY) || 0);
    if (expires && Date.now() > expires) {
      localStorage.removeItem(PLAN_STORAGE_KEY);
      localStorage.removeItem(PLAN_EXPIRY_KEY);
      localStorage.removeItem(PLAN_TX_KEY);
      return "free";
    }
    const p = localStorage.getItem(PLAN_STORAGE_KEY) as Plan | null;
    if (p === "pro" || p === "elite") return p;
  } catch {
    /* noop */
  }
  return "free";
}

export function getPlanExpiry(): number | null {
  if (typeof window === "undefined") return null;
  const v = Number(localStorage.getItem(PLAN_EXPIRY_KEY) || 0);
  return v || null;
}

export function getPlanTxHash(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PLAN_TX_KEY);
}

/** Activate a paid plan for 30 days. Stores tx hash + emits event. */
export function activatePlan(plan: Plan, txHash: string, days = 30): void {
  if (typeof window === "undefined") return;
  if (plan === "free") {
    localStorage.removeItem(PLAN_STORAGE_KEY);
    localStorage.removeItem(PLAN_EXPIRY_KEY);
    localStorage.removeItem(PLAN_TX_KEY);
  } else {
    const expires = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(PLAN_STORAGE_KEY, plan);
    localStorage.setItem(PLAN_EXPIRY_KEY, String(expires));
    localStorage.setItem(PLAN_TX_KEY, txHash);
  }
  window.dispatchEvent(new CustomEvent(PLAN_EVENT));
}

export function onPlanChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(PLAN_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(PLAN_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function isFeatureAvailable(feature: Feature, plan: Plan = getCurrentPlan()): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURES[feature].minPlan];
}

export function planForFeature(feature: Feature): Plan {
  return FEATURES[feature].minPlan;
}

export const PLAN_META: Record<Plan, { label: string; gradient: string; color: string }> = {
  free: {
    label: "FREE",
    gradient: "linear-gradient(90deg, var(--text-dim), var(--text-faint))",
    color: "var(--text-dim)",
  },
  pro: {
    label: "PRO",
    gradient: "linear-gradient(90deg, oklch(0.65 0.15 240), oklch(0.62 0.22 295))",
    color: "oklch(0.7 0.18 265)",
  },
  elite: {
    label: "ELITE",
    gradient: "linear-gradient(90deg, oklch(0.78 0.16 85), var(--primary))",
    color: "oklch(0.78 0.16 85)",
  },
};
