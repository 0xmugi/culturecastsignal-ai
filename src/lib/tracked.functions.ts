// tracked.functions.ts
// Strategy:
//   1. Try Four.meme private trending endpoint
//   2. If that fails → fall back to DexScreener (BSC pairs from four.meme)
//   3. If both fail → return empty tokens (caller falls back to MOCK_TRACKED)

import { createServerFn } from "@tanstack/react-start";
import type { Bucket, TrackedToken } from "@/lib/trackedMock";

// ─── Four.meme ────────────────────────────────────────────────────────────────
const FOURMEME_TRENDING =
  "https://four.meme/meme-api/v1/private/token/get/trend?orderBy=Trending";

interface FmToken {
  name?: string;
  shortName?: string;
  address?: string;
  imageUrl?: string;
  label?: string;
  launchTime?: number;
  marketCap?: string | number;
  liquidity?: string | number;
  volume?: string | number;
  totalVolume?: string | number;
  priceChange?: string | number;
  holderCount?: number;
}

// ─── DexScreener ─────────────────────────────────────────────────────────────
const DEXSCREENER_SEARCH =
  "https://api.dexscreener.com/latest/dex/search?q=fourmeme+bsc";

interface DsPair {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { address?: string; name?: string; symbol?: string };
  quoteToken?: { symbol?: string };
  priceUsd?: string;
  txns?: { h24?: { buys?: number; sells?: number } };
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  fdv?: number;
  marketCap?: number;
  pairCreatedAt?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function num(v: unknown): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

function ageHoursFrom(epochMs: number | undefined): number {
  if (!epochMs) return 24;
  return Math.max(1, Math.floor((Date.now() - epochMs) / 3_600_000));
}

function estimateTop10(holders: number): number {
  if (holders > 1500) return 22;
  if (holders > 600) return 32;
  if (holders > 200) return 45;
  if (holders > 50) return 58;
  return 72;
}

function calcCultureScore(args: {
  liquidity: number;
  change24h: number;
  ageHours: number;
  rank: number;
}): number {
  const liq = Math.min(40, Math.log10(Math.max(args.liquidity, 1)) * 8);
  const mom = Math.min(25, Math.abs(args.change24h) * 0.4);
  const fresh = args.ageHours < 24 ? 20 : args.ageHours < 72 ? 12 : 4;
  return Math.max(30, Math.min(99, Math.round(35 + liq + mom + fresh - args.rank * 0.5)));
}

function bucketize(args: {
  liquidity: number; marketCap: number; ageHours: number;
  score: number; top10Pct: number; holders: number; change24h: number;
}): Bucket {
  const { liquidity, marketCap, ageHours, top10Pct, holders, change24h, score } = args;
  // Safe: banyak holder, distribusi sehat, tidak bleeding
  if (holders > 800 && top10Pct <= 32 && change24h > -5) return "safe";
  // Gem: fresh + low cap
  if (ageHours < 24 && marketCap < 50_000) return "gem";
  return "medium";
}

const FALLBACK_LOGOS = ["🪙","🚀","🔥","💎","🐸","🦫","🐕","🍕","🐹","🍌","🪐","👻"];

function pickLogo(name: string, idx: number): string {
  const l = name.toLowerCase();
  if (l.includes("doge") || l.includes("dog")) return "🐕";
  if (l.includes("cat")) return "🐱";
  if (l.includes("frog") || l.includes("pepe")) return "🐸";
  if (l.includes("ape") || l.includes("monk")) return "🐒";
  if (l.includes("rocket") || l.includes("moon")) return "🚀";
  if (l.includes("ai") || l.includes("agent")) return "🤖";
  if (l.includes("ghost")) return "👻";
  if (l.includes("pizza")) return "🍕";
  if (l.includes("banana")) return "🍌";
  return FALLBACK_LOGOS[idx % FALLBACK_LOGOS.length];
}

function tagsFrom(args: {
  label?: string;
  ageHours: number;
  change24h: number;
  liquidity: number;
  holders: number;
}): string[] {
  const tags: string[] = [];
  if (args.label) tags.push(args.label.toLowerCase());
  if (args.ageHours < 6) tags.push("fresh");
  if (args.change24h > 50) tags.push("viral");
  else if (args.change24h > 15) tags.push("rising");
  else if (args.change24h < -10) tags.push("cooling");
  if (args.liquidity > 200_000) tags.push("liquid");
  if (args.holders > 1000) tags.push("distributed");
  if (tags.length === 0) tags.push("meme");
  return Array.from(new Set(tags)).slice(0, 4);
}

function isFourMemePair(p: DsPair): boolean {
  const dex = (p.dexId ?? "").toLowerCase();
  const url = (p.url ?? "").toLowerCase();
  // Accept "fourmeme", "four_meme", "four-meme", or URL containing four.meme
  return (
    dex.includes("fourmeme") ||
    dex.includes("four_meme") ||
    dex.includes("four-meme") ||
    url.includes("four.meme")
  );
}

// ─── Normaliser: FmToken → TrackedToken ──────────────────────────────────────
function fromFourMeme(t: FmToken, i: number): TrackedToken {
  const addr = t.address!;
  const name = t.name?.trim() || t.shortName || addr.slice(0, 6);
  const ticker = (t.shortName || name).replace(/\s+/g, "").slice(0, 10).toUpperCase();
  const marketCap = num(t.marketCap);
  const liquidity = num(t.liquidity);
  const volume24h = num(t.volume ?? t.totalVolume);
  const change24h = num(t.priceChange);
  const holders = t.holderCount ?? 0;
  const ageHours = ageHoursFrom(t.launchTime);
  const top10Pct = estimateTop10(holders);
  const score = calcCultureScore({ liquidity, change24h, ageHours, rank: i });
  const bucket = bucketize({ liquidity, marketCap, ageHours, score, top10Pct, holders, change24h });
  return {
    id: addr, name, ticker, contract: addr, bucket,
    logo: t.imageUrl ? undefined : pickLogo(name, i),
    marketCap, liquidity, volume24h, change24h,
    holders, top10Pct, ageHours, cultureScore: score,
    fourMemeUrl: `https://four.meme/token/${addr}`,
    tags: tagsFrom({ label: t.label, ageHours, change24h, liquidity, holders }),
  };
}

// ─── Normaliser: DsPair → TrackedToken ───────────────────────────────────────
const STABLES = new Set(["USDT","USDC","BUSD","WBNB","BNB","DAI"]);

function fromDsPair(p: DsPair, i: number): TrackedToken | null {
  const addr = p.baseToken?.address;
  if (!addr) return null;
  if (STABLES.has((p.baseToken?.symbol ?? "").toUpperCase())) return null;

  const name = p.baseToken?.name?.trim() || p.baseToken?.symbol || addr.slice(0, 6);
  const ticker = (p.baseToken?.symbol || name).replace(/\s+/g, "").slice(0, 10).toUpperCase();
  const marketCap = p.marketCap ?? p.fdv ?? 0;
  const liquidity = p.liquidity?.usd ?? 0;
  const volume24h = p.volume?.h24 ?? 0;
  const change24h = p.priceChange?.h24 ?? 0;
  const ageHours = ageHoursFrom(p.pairCreatedAt);
  const txns = (p.txns?.h24?.buys ?? 0) + (p.txns?.h24?.sells ?? 0);
  // Use txn count as a rough proxy for distribution health
  const top10Pct = txns > 500 ? 30 : txns > 100 ? 45 : 60;
  const score = calcCultureScore({ liquidity, change24h, ageHours, rank: i });
  const bucket = bucketize({ liquidity, marketCap, ageHours, score, top10Pct, holders: txns, change24h });
  return {
    id: addr, name, ticker, contract: addr, bucket,
    logo: pickLogo(name, i),
    marketCap, liquidity, volume24h, change24h,
    holders: txns, // txn count as holders proxy
    top10Pct, ageHours, cultureScore: score,
    fourMemeUrl: `https://four.meme/token/${addr}`,
    tags: tagsFrom({ ageHours, change24h, liquidity, holders: 0 }),
  };
}

// ─── Source fetchers ──────────────────────────────────────────────────────────
async function fetchFromFourMeme(): Promise<TrackedToken[]> {
  const res = await fetch(FOURMEME_TRENDING, {
    headers: { Accept: "application/json", "User-Agent": "CultureCast/1.0" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`four.meme ${res.status}`);
  const json = (await res.json()) as {
    code?: string;
    data?: { tokens?: FmToken[] } | FmToken[];
  };
  if (json.code !== "0" && json.code !== undefined) throw new Error(`four.meme code=${json.code}`);
  const raw: FmToken[] = Array.isArray(json.data)
    ? json.data
    : (json.data as { tokens?: FmToken[] })?.tokens ?? [];
  return raw
    .filter((t) => !!t.address && !!t.shortName)
    .slice(0, 18)
    .map((t, i) => fromFourMeme(t, i));
}

// AFTER — ganti seluruh fungsi fetchFromDexScreener
async function fetchFromDexScreener(): Promise<TrackedToken[]> {
  const queries = [
    "https://api.dexscreener.com/latest/dex/search?q=fourmeme",
    "https://api.dexscreener.com/latest/dex/search?q=four.meme",
    "https://api.dexscreener.com/latest/dex/search?q=meme+bsc",
  ];

  const results = await Promise.allSettled(
    queries.map((url) =>
      fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8_000),
      }).then((r) => r.json() as Promise<{ pairs?: DsPair[] }>),
    ),
  );

  const seen = new Set<string>();
  const pairs: DsPair[] = [];

  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const p of r.value.pairs ?? []) {
      if (p.chainId !== "bsc") continue;
      const addr = p.baseToken?.address;
      if (!addr || seen.has(addr)) continue;
      seen.add(addr);
      pairs.push(p);
    }
  }

  return pairs
    .sort((a, b) => (b.volume?.h24 ?? 0) - (a.volume?.h24 ?? 0))
    .slice(0, 24)
    .map((p, i) => fromDsPair(p, i))
    .filter((t): t is TrackedToken => t !== null);
}

// ─── Public export ────────────────────────────────────────────────────────────
export interface TrackedFeed {
  tokens: TrackedToken[];
  fetchedAt: number;
  source: "live" | "dexscreener" | "fallback";
  warning?: string;
}

export const fetchTrackedFeed = createServerFn({ method: "POST" }).handler(
  async (): Promise<TrackedFeed> => {
    const now = Date.now();

    // ① Try Four.meme
    try {
      const tokens = await fetchFromFourMeme();
      if (tokens.length > 0) return { tokens, fetchedAt: now, source: "live" };
    } catch (err) {
      console.warn("[tracked] four.meme failed:", (err as Error).message);
    }

    // ② Fall back to DexScreener
    try {
      const tokens = await fetchFromDexScreener();
      if (tokens.length > 0) {
        return {
          tokens, fetchedAt: now, source: "dexscreener",
          warning: "Four.meme unreachable — showing live data via DexScreener.",
        };
      }
    } catch (err) {
      console.warn("[tracked] dexscreener failed:", (err as Error).message);
    }

    // ③ Both failed
    return {
      tokens: [],
      fetchedAt: now,
      source: "fallback",
      warning: "Both Four.meme and DexScreener unreachable. Showing mock list.",
    };
  },
);