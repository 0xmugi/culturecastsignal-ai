import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  // Optional user-supplied keys (BYOK). Never persisted, only used per-request.
  userBscKey: z.string().min(8).max(128).optional(),
  userSerpKey: z.string().min(8).max(128).optional(),
});

export type SignalStatus = "HOT" | "RISING" | "NEW" | "COOLING";
export type SignalSource =
  | "coingecko"
  | "bscscan"
  | "trending"
  | "twitter"
  | "reddit"
  | "google"
  | "dexscreener"
  | "geckoterminal"
  | "fourmeme";

export interface TickerCollision {
  name: string;
  symbol: string;
  address?: string;
  url: string;
}

export interface LiveSignal {
  id: string;
  name: string;
  symbol: string;
  score: number;
  status: SignalStatus;
  sources: SignalSource[];
  velocity: string;
  pricePctChange24h: number | null;
  marketCapRank: number | null;
  detectedHoursAgo: number;
  windowHoursLeft: number;
  launched: boolean;
  contract?: string;
  imageUrl?: string;
  fourMemeLive?: boolean;
  fourMemeUrl?: string;
  /** 0–100 memeability score. */
  memeability: number;
  /** Count of existing Four.meme tokens sharing the same shortName. */
  tickerCollisions: number;
  /** Conflicting Four.meme launches (excluding self) for verification. */
  collisions?: TickerCollision[];
}

export interface RadarFeed {
  signals: LiveSignal[];
  fetchedAt: number;
  source: "live" | "fallback";
  keySource: "user" | "shared" | "none";
  warning?: string;
  rateLimitNote?: string;
  sourcesActive: SignalSource[];
}

const COINGECKO_TRENDING = "https://api.coingecko.com/api/v3/search/trending";
const COINGECKO_MARKETS =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&price_change_percentage=24h";
const REDDIT_CRYPTO = "https://www.reddit.com/r/CryptoCurrency/hot.json?limit=25";
const REDDIT_MOONSHOTS = "https://www.reddit.com/r/CryptoMoonShots/hot.json?limit=25";
const DEXSCREENER_BSC =
  "https://api.dexscreener.com/token-boosts/top/v1";
const GECKOTERMINAL_BSC_TRENDING =
  "https://api.geckoterminal.com/api/v2/networks/bsc/trending_pools?page=1";
const FOURMEME_TRENDING =
  "https://four.meme/meme-api/v1/private/token/get/trend?orderBy=Trending";

interface CGTrendingItem {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number | null;
    thumb: string;
    small: string;
    large: string;
    score: number;
    data?: {
      price_change_percentage_24h?: { usd?: number };
      market_cap?: string;
    };
  };
}

interface CGMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap_rank: number | null;
  price_change_percentage_24h: number | null;
}

function classify(score: number): SignalStatus {
  if (score >= 80) return "HOT";
  if (score >= 60) return "RISING";
  if (score >= 40) return "NEW";
  return "COOLING";
}

async function fetchJsonSafe<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "User-Agent": "CultureCast-Radar/1.0",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Extract $TICKER mentions from reddit titles
function extractTickers(text: string): string[] {
  const matches = text.match(/\$([A-Z]{2,8})\b/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.slice(1).toUpperCase())));
}

interface TickerSignal {
  symbol: string;
  name: string;
  mentions: number;
  sources: Set<SignalSource>;
  pricePctChange24h: number | null;
  marketCapRank: number | null;
  contract?: string;
  imageUrl?: string;
  rawTrendingScore: number;
}

/**
 * Heuristic memeability score (0–100). High = punchy, short, ticker-shaped.
 * Used to surface signals worth launching as a meme on Four.meme.
 */
function computeMemeability(name: string, symbol: string, sources: Set<SignalSource> | string[]): number {
  const srcArr = Array.isArray(sources) ? sources : Array.from(sources);
  let score = 50;
  const sym = (symbol || "").replace(/^CA:/, "");
  if (name.length <= 10) score += 15;
  else if (name.length <= 16) score += 6;
  else if (name.length > 24) score -= 18;
  const words = name.trim().split(/\s+/).length;
  if (words === 1) score += 8;
  if (words >= 4) score -= 10;
  if (sym && sym.length >= 3 && sym.length <= 6 && /^[A-Z0-9]+$/.test(sym)) score += 10;
  const cultural = ["reddit", "google", "tiktok", "twitter", "fourmeme"] as const;
  const finance = ["coingecko", "trending", "dexscreener", "geckoterminal"] as const;
  const culturalHits = srcArr.filter((s) => (cultural as readonly string[]).includes(s)).length;
  const financeHits = srcArr.filter((s) => (finance as readonly string[]).includes(s)).length;
  score += culturalHits * 6;
  score += financeHits * 2;
  if (srcArr.includes("fourmeme")) score += 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function fallbackFeed(reason: string, keySource: RadarFeed["keySource"]): RadarFeed {
  const now = Date.now();
  const samples: Array<Omit<LiveSignal, "id" | "detectedHoursAgo" | "windowHoursLeft" | "status" | "memeability" | "tickerCollisions">> = [
    { name: "Bitcoin", symbol: "BTC", score: 92, sources: ["trending"], velocity: "+0% / 24h", pricePctChange24h: null, marketCapRank: 1, launched: true },
    { name: "Ethereum", symbol: "ETH", score: 80, sources: ["trending"], velocity: "+0% / 24h", pricePctChange24h: null, marketCapRank: 2, launched: true },
    { name: "BNB", symbol: "BNB", score: 70, sources: ["trending"], velocity: "+0% / 24h", pricePctChange24h: null, marketCapRank: 4, launched: true },
  ];
  return {
    signals: samples.map((s, i) => ({
      ...s,
      id: `fb-${i}`,
      status: classify(s.score),
      detectedHoursAgo: i + 1,
      windowHoursLeft: 24 - i * 4,
      memeability: computeMemeability(s.name, s.symbol, s.sources),
      tickerCollisions: 0,
    })),
    fetchedAt: now,
    source: "fallback",
    keySource,
    warning: reason,
    sourcesActive: [],
  };
}

export const fetchLiveRadar = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<RadarFeed> => {
    const userBscKey = data.userBscKey?.trim();
    const sharedBscKey = process.env.BSCSCAN_API_KEY;
    const bscKey = userBscKey || sharedBscKey;
    const keySource: RadarFeed["keySource"] = userBscKey
      ? "user"
      : sharedBscKey
      ? "shared"
      : "none";

    const userSerpKey = data.userSerpKey?.trim();
    const sharedSerpKey = process.env.SERPAPI_KEY;
    const serpKey = userSerpKey || sharedSerpKey;

    const sourcesActive: SignalSource[] = [];

    try {
      // Fan out all sources in parallel
      const [
        trending,
        markets,
        redditCrypto,
        redditMoon,
        dexScreener,
        geckoTerminal,
        fourMeme,
        googleTrends,
      ] = await Promise.all([
        fetchJsonSafe<{ coins: CGTrendingItem[] }>(COINGECKO_TRENDING),
        fetchJsonSafe<CGMarket[]>(COINGECKO_MARKETS),
        fetchJsonSafe<{ data: { children: { data: { title: string; ups: number } }[] } }>(
          REDDIT_CRYPTO,
        ),
        fetchJsonSafe<{ data: { children: { data: { title: string; ups: number } }[] } }>(
          REDDIT_MOONSHOTS,
        ),
        fetchJsonSafe<
          { tokenAddress: string; chainId: string; description?: string; totalAmount?: number }[]
        >(DEXSCREENER_BSC),
        fetchJsonSafe<{
          data: {
            attributes: {
              name: string;
              base_token_price_usd: string;
              price_change_percentage: { h24: string };
            };
            relationships: { base_token: { data: { id: string } } };
          }[];
        }>(GECKOTERMINAL_BSC_TRENDING),
        fetchJsonSafe<{
          data?: { tokens?: { name?: string; shortName?: string; address?: string }[] };
        }>(FOURMEME_TRENDING),
        serpKey
          ? fetchJsonSafe<{
              trending_searches?: { query?: string; search_volume?: number }[];
            }>(
              `https://serpapi.com/search.json?engine=google_trends_trending_now&geo=US&api_key=${encodeURIComponent(serpKey)}`,
            )
          : Promise.resolve(null),
      ]);

      if (!trending) {
        return fallbackFeed(
          "CoinGecko trending unreachable. Showing fallback feed.",
          keySource,
        );
      }

      // Build a ticker-keyed signal map
      const map = new Map<string, TickerSignal>();
      const ensure = (sym: string, name: string): TickerSignal => {
        const k = sym.toUpperCase();
        const existing = map.get(k);
        if (existing) return existing;
        const fresh: TickerSignal = {
          symbol: k,
          name,
          mentions: 0,
          sources: new Set(),
          pricePctChange24h: null,
          marketCapRank: null,
          rawTrendingScore: 0,
        };
        map.set(k, fresh);
        return fresh;
      };

      // 1) CoinGecko trending → base signals
      sourcesActive.push("coingecko", "trending");
      const marketsById = new Map((markets ?? []).map((m) => [m.id, m]));
      trending.coins.slice(0, 12).forEach((c, i) => {
        const m = marketsById.get(c.item.id);
        const sig = ensure(c.item.symbol, c.item.name);
        sig.sources.add("coingecko");
        sig.sources.add("trending");
        sig.rawTrendingScore += 100 - i * 6;
        sig.pricePctChange24h =
          m?.price_change_percentage_24h ??
          c.item.data?.price_change_percentage_24h?.usd ??
          sig.pricePctChange24h;
        sig.marketCapRank = c.item.market_cap_rank ?? m?.market_cap_rank ?? sig.marketCapRank;
        sig.imageUrl = sig.imageUrl ?? c.item.large ?? c.item.small ?? c.item.thumb;
      });

      // 2) Reddit ticker mentions
      const redditPosts = [
        ...(redditCrypto?.data?.children ?? []),
        ...(redditMoon?.data?.children ?? []),
      ];
      if (redditPosts.length) sourcesActive.push("reddit");
      redditPosts.forEach((p) => {
        const tickers = extractTickers(p.data.title);
        tickers.forEach((t) => {
          const sig = ensure(t, t);
          sig.sources.add("reddit");
          sig.mentions += 1;
          sig.rawTrendingScore += Math.min(15, Math.log10((p.data.ups || 1) + 1) * 5);
        });
      });

      // 3) DexScreener boosted BSC tokens — gives us contracts
      const dexBsc = (dexScreener ?? []).filter((d) => d.chainId === "bsc").slice(0, 30);
      if (dexBsc.length) sourcesActive.push("dexscreener");
      dexBsc.forEach((d, i) => {
        // We don't have symbol here, key by contract — keep as side enrichment
        const k = `CA:${d.tokenAddress.toLowerCase().slice(2, 10).toUpperCase()}`;
        const sig = ensure(k, `BSC ${d.tokenAddress.slice(0, 6)}…${d.tokenAddress.slice(-4)}`);
        sig.contract = d.tokenAddress;
        sig.sources.add("dexscreener");
        sig.rawTrendingScore += Math.max(5, 25 - i);
      });

      // 4) GeckoTerminal BSC trending pools
      const gtPools = geckoTerminal?.data ?? [];
      if (gtPools.length) sourcesActive.push("geckoterminal");
      gtPools.slice(0, 15).forEach((pool, i) => {
        const name = pool.attributes.name?.split("/")[0]?.trim() || "";
        if (!name) return;
        const sig = ensure(name, name);
        sig.sources.add("geckoterminal");
        sig.rawTrendingScore += Math.max(8, 30 - i * 2);
        const change = parseFloat(pool.attributes.price_change_percentage?.h24 ?? "");
        if (!Number.isNaN(change)) sig.pricePctChange24h = change;
        const baseId = pool.relationships?.base_token?.data?.id;
        if (baseId?.startsWith("bsc_")) {
          // baseId looks like "bsc_0xabc..." — strip the "bsc_" prefix; do NOT re-add 0x
          const raw = baseId.slice(4);
          const addr = raw.startsWith("0x") ? raw : `0x${raw}`;
          sig.contract = sig.contract ?? addr;
        }
      });

      // 5) four.meme trending — flag as live + provide URL
      const fmTokens = fourMeme?.data?.tokens ?? [];
      const fmBySymbol = new Map<string, { name: string; address?: string }>();
      // Multimap of all four.meme launches per symbol — used for collision dropdown.
      const fmAllBySymbol = new Map<string, Array<{ name: string; address?: string }>>();
      if (fmTokens.length) sourcesActive.push("fourmeme");
      fmTokens.forEach((t) => {
        const sym = (t.shortName || "").toUpperCase();
        if (!sym) return;
        if (!fmBySymbol.has(sym)) fmBySymbol.set(sym, { name: t.name || sym, address: t.address });
        const list = fmAllBySymbol.get(sym) ?? [];
        list.push({ name: t.name || sym, address: t.address });
        fmAllBySymbol.set(sym, list);
        const sig = ensure(sym, t.name || sym);
        sig.sources.add("fourmeme");
        sig.rawTrendingScore += 18;
        if (t.address) sig.contract = sig.contract ?? t.address;
      });

      // 6) Google Trends (SerpAPI) — boost tickers that match trending queries
      const gtQueries = googleTrends?.trending_searches ?? [];
      if (gtQueries.length) sourcesActive.push("google");
      gtQueries.forEach((q) => {
        const text = (q.query ?? "").toUpperCase();
        map.forEach((sig) => {
          if (text.includes(sig.symbol) || text.includes(sig.name.toUpperCase())) {
            sig.sources.add("google");
            sig.rawTrendingScore += 8;
          }
        });
      });

      // Build final signals — top by raw trending score
      const ranked = Array.from(map.values())
        .sort((a, b) => b.rawTrendingScore - a.rawTrendingScore)
        .slice(0, 12);

      // Pre-compute ticker collision counts from four.meme trending list
      const collisionCounts = new Map<string, number>();
      fmTokens.forEach((t) => {
        const sym = (t.shortName || "").toUpperCase();
        if (!sym) return;
        collisionCounts.set(sym, (collisionCounts.get(sym) ?? 0) + 1);
      });

      const now = Date.now();
      const signals: LiveSignal[] = ranked.map((s, i) => {
        const positionScore = 100 - i * 5;
        const momentum = s.pricePctChange24h
          ? Math.min(20, Math.abs(s.pricePctChange24h) / 2)
          : 0;
        const sourceBonus = (s.sources.size - 1) * 4;
        const score = Math.max(
          35,
          Math.min(99, Math.round(positionScore - 15 + momentum + sourceBonus)),
        );
        const fmHit = fmBySymbol.get(s.symbol);
        const cleanSym = s.symbol.startsWith("CA:") ? s.symbol.slice(3) : s.symbol;
        const memeability = computeMemeability(s.name, cleanSym, s.sources);
        // Collision count: include this token only if it's *already* one of the
        // launched ones — otherwise show how many other launches share the symbol.
        const collisions = Math.max(0, (collisionCounts.get(cleanSym) ?? 0) - (fmHit ? 1 : 0));
        // Build dropdown list of conflicting launches (excluding self by address).
        const allForSym = fmAllBySymbol.get(cleanSym) ?? [];
        const collisionList: TickerCollision[] = allForSym
          .filter((t) => !fmHit?.address || t.address !== fmHit.address)
          .slice(0, 6)
          .map((t) => ({
            name: t.name,
            symbol: cleanSym,
            address: t.address,
            url: t.address
              ? `https://four.meme/token/${t.address}`
              : `https://four.meme/search?q=${encodeURIComponent(cleanSym)}`,
          }));
        return {
          id: `sig-${s.symbol}-${i}`,
          name: s.name,
          symbol: cleanSym,
          score,
          status: classify(score),
          sources: Array.from(s.sources),
          velocity:
            s.pricePctChange24h !== null
              ? `${s.pricePctChange24h >= 0 ? "+" : ""}${s.pricePctChange24h.toFixed(1)}% / 24h`
              : s.mentions > 0
              ? `${s.mentions} mentions / 24h`
              : "—",
          pricePctChange24h: s.pricePctChange24h,
          marketCapRank: s.marketCapRank,
          detectedHoursAgo: Math.max(1, i + 1),
          windowHoursLeft: Math.max(6, 48 - i * 3),
          launched: !!s.contract || !!fmHit,
          contract: s.contract ?? fmHit?.address,
          imageUrl: s.imageUrl,
          fourMemeLive: !!fmHit,
          fourMemeUrl: fmHit?.address
            ? `https://four.meme/token/${fmHit.address}`
            : fmHit
            ? `https://four.meme/search?q=${encodeURIComponent(s.symbol)}`
            : undefined,
          memeability,
          tickerCollisions: collisions,
          collisions: collisionList,
        };
      });

      return {
        signals,
        fetchedAt: now,
        source: "live",
        keySource,
        sourcesActive: Array.from(new Set(sourcesActive)),
        rateLimitNote: bscKey
          ? "BscScan key active — Decide & on-chain enrichment unlimited."
          : "Default tier — limited refresh & on-chain calls. Add your own key in Settings to lift limits.",
      };
    } catch (err) {
      console.error("Live radar fetch failed:", err);
      return fallbackFeed(
        "Could not reach data sources. Showing fallback feed.",
        keySource,
      );
    }
  });
