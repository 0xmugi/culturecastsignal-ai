// User-provided API keys, stored in localStorage scoped per wallet address.
// Never persisted to any server. Sent only as per-request headers when calling
// our server functions, which forward them to third-party APIs.

export type UserKeyName =
  | "bscscan"      // Radar / Decide on-chain data
  | "groq"         // Radar AI summary
  | "anthropic"    // Decide AI (Claude)
  | "openai"       // Decide AI (GPT)
  | "gemini";      // Decide AI (Google)

const STORAGE_PREFIX = "cc:apikeys:";
const ANON_KEY = "anon";

function storageKey(wallet?: string | null) {
  return STORAGE_PREFIX + (wallet ? wallet.toLowerCase() : ANON_KEY);
}

export interface UserKeys {
  bscscan?: string;
  groq?: string;
  anthropic?: string;
  openai?: string;
  gemini?: string;
}

export function loadUserKeys(wallet?: string | null): UserKeys {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(wallet));
    if (!raw) return {};
    return JSON.parse(raw) as UserKeys;
  } catch {
    return {};
  }
}

export function saveUserKeys(keys: UserKeys, wallet?: string | null): void {
  if (typeof window === "undefined") return;
  const cleaned: UserKeys = {};
  (["bscscan", "groq", "anthropic", "openai", "gemini"] as const).forEach((k) => {
    const v = keys[k]?.trim();
    if (v) cleaned[k] = v;
  });
  window.localStorage.setItem(storageKey(wallet), JSON.stringify(cleaned));
}

export function clearUserKeys(wallet?: string | null): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(wallet));
}

export function maskKey(key?: string): string {
  if (!key) return "—";
  if (key.length <= 8) return "•".repeat(key.length);
  return key.slice(0, 4) + "•".repeat(Math.max(4, key.length - 8)) + key.slice(-4);
}
