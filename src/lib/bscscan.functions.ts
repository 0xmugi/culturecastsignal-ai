import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address"),
  // Optional user-supplied API key — never persisted, only used per-request.
  userKey: z.string().min(8).max(128).optional(),
});

export type DataSource = "bscscan" | "geckoterminal" | "none";

export interface BscTokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  holders: number | null;
  txCount24h: number | null;
  ageDays: number | null;
  source: "bscscan" | "fallback";
  keySource: "user" | "shared" | "none";
  /** Per-field provenance — drives the "data source" badge on Decide. */
  fieldSources: {
    metadata: DataSource;     // name/symbol/decimals/totalSupply
    holders: DataSource;
    txCount24h: DataSource;
    ageDays: DataSource;
  };
  warning?: string;
}

const BSCSCAN = "https://api.bscscan.com/api";

async function bscFetch(params: Record<string, string>, apiKey: string) {
  const url = new URL(BSCSCAN);
  Object.entries({ ...params, apikey: apiKey }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`BscScan ${res.status}`);
  return res.json() as Promise<{ status: string; message: string; result: unknown }>;
}

// GeckoTerminal free public API — no key required.
// Used as fallback when BscScan free tier omits holders / live tx data.
interface GTTokenSnapshot {
  name?: string;
  symbol?: string;
  holders?: number | null;
  txCount24h?: number | null;
  ageDays?: number | null;
}

async function fetchGeckoTerminal(address: string): Promise<GTTokenSnapshot | null> {
  // /info endpoint exposes holder counts more reliably than /tokens
  const [tokenRes, infoRes] = await Promise.all([
    fetch(
      `https://api.geckoterminal.com/api/v2/networks/bsc/tokens/${address.toLowerCase()}?include=top_pools`,
      { headers: { Accept: "application/json" } },
    ).catch(() => null),
    fetch(
      `https://api.geckoterminal.com/api/v2/networks/bsc/tokens/${address.toLowerCase()}/info`,
      { headers: { Accept: "application/json" } },
    ).catch(() => null),
  ]);

  if (!tokenRes?.ok && !infoRes?.ok) return null;

  let name: string | undefined;
  let symbol: string | undefined;
  let holders: number | null = null;
  let txCount24h: number | null = null;
  let ageDays: number | null = null;

  if (tokenRes?.ok) {
    const tokenJson = (await tokenRes.json()) as {
      data?: {
        attributes?: {
          name?: string;
          symbol?: string;
          holders?: { count?: number | null } | null;
        };
      };
      included?: Array<{
        id: string;
        attributes?: {
          pool_created_at?: string;
          transactions?: { h24?: { buys?: number; sells?: number } };
        };
      }>;
    };
    const attrs = tokenJson.data?.attributes;
    if (attrs) {
      name = attrs.name ?? undefined;
      symbol = attrs.symbol ?? undefined;
      holders = attrs.holders?.count ?? null;
    }
    if (Array.isArray(tokenJson.included)) {
      let total = 0;
      let any = false;
      let oldestTs: number | null = null;
      for (const pool of tokenJson.included) {
        const h24 = pool.attributes?.transactions?.h24;
        if (h24) {
          total += (h24.buys ?? 0) + (h24.sells ?? 0);
          any = true;
        }
        const created = pool.attributes?.pool_created_at;
        if (created) {
          const ts = Date.parse(created);
          if (!Number.isNaN(ts) && (oldestTs === null || ts < oldestTs)) oldestTs = ts;
        }
      }
      if (any) txCount24h = total;
      if (oldestTs !== null) {
        ageDays = Math.max(1, Math.floor((Date.now() - oldestTs) / 86_400_000));
      }
    }
  }

  if (infoRes?.ok && holders == null) {
    const infoJson = (await infoRes.json()) as {
      data?: { attributes?: { holders?: { count?: number | null } | null } };
    };
    const c = infoJson.data?.attributes?.holders?.count;
    if (typeof c === "number") holders = c;
  }

  if (!name && !symbol && holders == null && txCount24h == null) return null;
  return { name, symbol, holders, txCount24h, ageDays };
}

export const fetchTokenInfo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<BscTokenInfo> => {
    // Prefer user-supplied key from request payload (never persisted, never logged).
    const userKey = data.userKey?.trim();
    const sharedKey = process.env.BSCSCAN_API_KEY;
    const apiKey = userKey || sharedKey;
    const keySource: BscTokenInfo["keySource"] = userKey ? "user" : sharedKey ? "shared" : "none";

    if (!apiKey) {
      // No BscScan key — try GeckoTerminal as best-effort.
      const gt = await fetchGeckoTerminal(data.address).catch(() => null);
      return {
        address: data.address,
        name: gt?.name ?? "Unknown",
        symbol: gt?.symbol ?? "—",
        decimals: 18,
        totalSupply: "0",
        holders: gt?.holders ?? null,
        txCount24h: gt?.txCount24h ?? null,
        ageDays: gt?.ageDays ?? null,
        source: "fallback",
        keySource: "none",
        fieldSources: {
          metadata: gt?.name ? "geckoterminal" : "none",
          holders: gt?.holders != null ? "geckoterminal" : "none",
          txCount24h: gt?.txCount24h != null ? "geckoterminal" : "none",
          ageDays: gt?.ageDays != null ? "geckoterminal" : "none",
        },
        warning: "No BscScan key configured. Add yours in Settings for live data.",
      };
    }

    try {
      // 1) Token metadata (name/symbol/decimals/totalSupply)
      const meta = await bscFetch(
        { module: "token", action: "tokeninfo", contractaddress: data.address },
        apiKey,
      );

      // tokeninfo is paid-tier only on some plans; fall back to stats endpoints
      let name = "Unknown";
      let symbol = "—";
      let decimals = 18;
      let totalSupply = "0";
      let holders: number | null = null;
      const fieldSources: BscTokenInfo["fieldSources"] = {
        metadata: "none",
        holders: "none",
        txCount24h: "none",
        ageDays: "none",
      };

      if (meta.status === "1" && Array.isArray(meta.result) && meta.result[0]) {
        const t = meta.result[0] as {
          tokenName?: string; symbol?: string; divisor?: string;
          totalSupply?: string; holders?: string;
        };
        if (t.tokenName) { name = t.tokenName; fieldSources.metadata = "bscscan"; }
        if (t.symbol) symbol = t.symbol;
        decimals = Number(t.divisor) || decimals;
        if (t.totalSupply) totalSupply = t.totalSupply;
        if (t.holders) { holders = Number(t.holders); fieldSources.holders = "bscscan"; }
      } else {
        // Fallback: get totalSupply
        const supply = await bscFetch(
          { module: "stats", action: "tokensupply", contractaddress: data.address },
          apiKey,
        );
        if (supply.status === "1" && typeof supply.result === "string") {
          totalSupply = supply.result;
        }
      }

      // 2) Recent transfers — used for tx count + age estimate
      const txs = await bscFetch(
        {
          module: "account",
          action: "tokentx",
          contractaddress: data.address,
          page: "1",
          offset: "100",
          sort: "desc",
        },
        apiKey,
      );

      let txCount24h: number | null = null;
      let ageDays: number | null = null;

      if (txs.status === "1" && Array.isArray(txs.result)) {
        const list = txs.result as Array<{ timeStamp: string; tokenName?: string; tokenSymbol?: string; tokenDecimal?: string }>;
        const now = Math.floor(Date.now() / 1000);
        const oneDayAgo = now - 86400;
        txCount24h = list.filter((t) => Number(t.timeStamp) >= oneDayAgo).length;
        if (txCount24h > 0) fieldSources.txCount24h = "bscscan";

        // Pull oldest transfer for rough age
        const oldest = await bscFetch(
          {
            module: "account",
            action: "tokentx",
            contractaddress: data.address,
            page: "1",
            offset: "1",
            sort: "asc",
          },
          apiKey,
        );
        if (oldest.status === "1" && Array.isArray(oldest.result) && oldest.result[0]) {
          const ts = Number((oldest.result[0] as { timeStamp: string }).timeStamp);
          ageDays = Math.max(1, Math.floor((now - ts) / 86400));
          fieldSources.ageDays = "bscscan";
        }

        // Backfill name/symbol from tx if metadata empty
        if (name === "Unknown" && list[0]?.tokenName) {
          name = list[0].tokenName;
          fieldSources.metadata = "bscscan";
        }
        if (symbol === "—" && list[0]?.tokenSymbol) symbol = list[0].tokenSymbol;
        if (list[0]?.tokenDecimal) decimals = Number(list[0].tokenDecimal) || decimals;
      }

      // 3) GeckoTerminal fallback — fills gaps from BscScan free tier (no holders, no live tx).
      // Free, no API key required. Returns name/symbol + 24h tx & holder count from pool data.
      if (holders == null || txCount24h == null || txCount24h === 0 || name === "Unknown" || ageDays == null) {
        try {
          const gt = await fetchGeckoTerminal(data.address);
          if (gt) {
            if (name === "Unknown" && gt.name) {
              name = gt.name;
              fieldSources.metadata = "geckoterminal";
            }
            if (symbol === "—" && gt.symbol) symbol = gt.symbol;
            if (holders == null && gt.holders != null) {
              holders = gt.holders;
              fieldSources.holders = "geckoterminal";
            }
            if ((txCount24h == null || txCount24h === 0) && gt.txCount24h != null) {
              txCount24h = gt.txCount24h;
              fieldSources.txCount24h = "geckoterminal";
            }
            if (ageDays == null && gt.ageDays != null) {
              ageDays = gt.ageDays;
              fieldSources.ageDays = "geckoterminal";
            }
          }
        } catch (e) {
          console.warn("GeckoTerminal fallback failed:", e);
        }
      }

      return {
        address: data.address,
        name,
        symbol,
        decimals,
        totalSupply,
        holders,
        txCount24h,
        ageDays,
        source: "bscscan",
        keySource,
        fieldSources,
      };
    } catch (err) {
      console.error("BscScan fetch failed:", err);
      return {
        address: data.address,
        name: "Unknown",
        symbol: "—",
        decimals: 18,
        totalSupply: "0",
        holders: null,
        txCount24h: null,
        ageDays: null,
        source: "fallback",
        keySource,
        fieldSources: { metadata: "none", holders: "none", txCount24h: "none", ageDays: "none" },
        warning: "BscScan request failed. Showing partial data.",
      };
    }
  });

/* ============================================================
 * Tokens activity — used by collision dropdown to label DEAD/ACTIVE.
 * For each address, returns when the most recent transfer happened.
 * Heuristic: <24h = ACTIVE, <7d = QUIET, otherwise DEAD.
 * ============================================================ */

const ActivityInputSchema = z.object({
  addresses: z.array(z.string().regex(/^0x[a-fA-F0-9]{40}$/)).min(1).max(8),
});

export type ActivityState = "ACTIVE" | "QUIET" | "DEAD" | "UNKNOWN";

export interface TokenActivity {
  address: string;
  state: ActivityState;
  lastTxAgoHours: number | null;
}

export const fetchTokensActivity = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ActivityInputSchema.parse(input))
  .handler(async ({ data }): Promise<TokenActivity[]> => {
    const apiKey = process.env.BSCSCAN_API_KEY;
    const now = Date.now();
    return Promise.all(
      data.addresses.map(async (address): Promise<TokenActivity> => {
        try {
          // Prefer BscScan when we have a key — most reliable.
          if (apiKey) {
            const res = await bscFetch(
              {
                module: "account",
                action: "tokentx",
                contractaddress: address,
                page: "1",
                offset: "1",
                sort: "desc",
              },
              apiKey,
            );
            if (res.status === "1" && Array.isArray(res.result) && res.result[0]) {
              const ts = Number((res.result[0] as { timeStamp: string }).timeStamp) * 1000;
              const ageH = Math.max(0, (now - ts) / 3_600_000);
              return {
                address,
                lastTxAgoHours: Math.round(ageH),
                state: ageH < 24 ? "ACTIVE" : ageH < 24 * 7 ? "QUIET" : "DEAD",
              };
            }
          }
          // Fallback: GeckoTerminal pool tx counts.
          const gt = await fetchGeckoTerminal(address);
          if (gt && typeof gt.txCount24h === "number") {
            return {
              address,
              lastTxAgoHours: gt.txCount24h > 0 ? 12 : 168,
              state: gt.txCount24h > 0 ? "ACTIVE" : "DEAD",
            };
          }
          return { address, state: "UNKNOWN", lastTxAgoHours: null };
        } catch {
          return { address, state: "UNKNOWN", lastTxAgoHours: null };
        }
      }),
    );
  });

/* ============================================================
 * Token enrichment for Decide — holders breakdown + market data.
 * Pulls market cap, liquidity, 24h vol, 24h change from GeckoTerminal,
 * and approximates top-10 holders / total holders from BscScan + GT.
 * ============================================================ */

const EnrichmentInputSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export interface TokenEnrichment {
  address: string;
  // Holders
  totalHolders: number | null;
  top10HoldersPct: number | null;
  // Market
  marketCapUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  priceChange24hPct: number | null;
  priceUsd: number | null;
  // Pool address (top pool) — used for embedded GT chart.
  topPoolAddress: string | null;
  topPoolName: string | null;
}

export const fetchTokenEnrichment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EnrichmentInputSchema.parse(input))
  .handler(async ({ data }): Promise<TokenEnrichment> => {
    const empty: TokenEnrichment = {
      address: data.address,
      totalHolders: null,
      top10HoldersPct: null,
      marketCapUsd: null,
      liquidityUsd: null,
      volume24hUsd: null,
      priceChange24hPct: null,
      priceUsd: null,
      topPoolAddress: null,
      topPoolName: null,
    };

    try {
      const res = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/bsc/tokens/${data.address.toLowerCase()}?include=top_pools`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) return empty;
      const json = (await res.json()) as {
        data?: {
          attributes?: {
            price_usd?: string;
            fdv_usd?: string;
            market_cap_usd?: string | null;
            total_supply?: string;
            volume_usd?: { h24?: string };
            holders?: { count?: number | null } | null;
          };
        };
        included?: Array<{
          id: string;
          attributes?: {
            name?: string;
            address?: string;
            reserve_in_usd?: string;
            volume_usd?: { h24?: string };
            price_change_percentage?: { h24?: string };
          };
        }>;
      };

      const attrs = json.data?.attributes ?? {};
      const priceUsd = attrs.price_usd ? parseFloat(attrs.price_usd) : null;
      const marketCapUsd = attrs.market_cap_usd
        ? parseFloat(attrs.market_cap_usd)
        : attrs.fdv_usd
        ? parseFloat(attrs.fdv_usd)
        : null;
      const volume24hUsd = attrs.volume_usd?.h24 ? parseFloat(attrs.volume_usd.h24) : null;
      const totalHolders = attrs.holders?.count ?? null;

      let liquidityUsd = 0;
      let topPoolAddress: string | null = null;
      let topPoolName: string | null = null;
      let topPoolReserve = 0;
      let priceChange24hPct: number | null = null;

      for (const pool of json.included ?? []) {
        const reserve = parseFloat(pool.attributes?.reserve_in_usd ?? "0") || 0;
        liquidityUsd += reserve;
        if (reserve > topPoolReserve) {
          topPoolReserve = reserve;
          topPoolAddress = pool.attributes?.address ?? null;
          topPoolName = pool.attributes?.name ?? null;
          const ch = parseFloat(pool.attributes?.price_change_percentage?.h24 ?? "");
          if (!Number.isNaN(ch)) priceChange24hPct = ch;
        }
      }

      return {
        ...empty,
        priceUsd,
        marketCapUsd,
        liquidityUsd: liquidityUsd > 0 ? liquidityUsd : null,
        volume24hUsd,
        priceChange24hPct,
        totalHolders,
        // GT doesn't expose top10 % publicly; leave null and let the UI hide it.
        top10HoldersPct: null,
        topPoolAddress,
        topPoolName,
      };
    } catch (err) {
      console.warn("Enrichment fetch failed:", err);
      return empty;
    }
  });

/* ============================================================
 * Top-10 holders concentration via BscScan tokenholderlist (PAID endpoint).
 * Requires the user to bring their own BscScan key (Pro+). Gracefully returns
 * null when the shared key is used or the endpoint rejects.
 * ============================================================ */

const TopHoldersInputSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  userKey: z.string().min(8).max(128),
  totalSupply: z.string().min(1),
});

export interface TopHoldersResult {
  top10Pct: number | null;
  fetchedAt: number;
}

export const fetchTopHolders = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TopHoldersInputSchema.parse(input))
  .handler(async ({ data }): Promise<TopHoldersResult> => {
    try {
      const res = await bscFetch(
        {
          module: "token",
          action: "tokenholderlist",
          contractaddress: data.address,
          page: "1",
          offset: "10",
        },
        data.userKey,
      );
      if (res.status !== "1" || !Array.isArray(res.result)) {
        return { top10Pct: null, fetchedAt: Date.now() };
      }
      const list = res.result as Array<{ TokenHolderQuantity?: string }>;
      let sum = 0n;
      for (const h of list) {
        try { sum += BigInt(h.TokenHolderQuantity ?? "0"); } catch { /* skip */ }
      }
      let supply = 0n;
      try { supply = BigInt(data.totalSupply); } catch { /* zero */ }
      if (supply === 0n) return { top10Pct: null, fetchedAt: Date.now() };
      const pct = Number((sum * 1_000_000n) / supply) / 10_000;
      return { top10Pct: pct, fetchedAt: Date.now() };
    } catch (err) {
      console.warn("Top holders fetch failed:", err);
      return { top10Pct: null, fetchedAt: Date.now() };
    }
  });
