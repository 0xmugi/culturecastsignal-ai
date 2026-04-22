import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Key } from "lucide-react";
import type { BscTokenInfo, TokenEnrichment } from "@/lib/bscscan.functions";

function fmtUsd(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

export function DecideEnrichmentBlock({
  enrichment,
  info,
  cacheAgeMs,
  hasBscscanKey,
}: {
  enrichment: TokenEnrichment | null;
  info: BscTokenInfo;
  /** When enrichment was served from the 60s cache, how old it is. null = fresh. */
  cacheAgeMs: number | null;
  /** Whether the user has a BscScan key — gates Top 10 holders. */
  hasBscscanKey: boolean;
}) {
  if (!enrichment) {
    return (
      <div className="mt-12 text-[11px] uppercase tracking-widest font-data text-[color:var(--text-faint)] cc-dots">
        Loading market data<span>.</span><span>.</span><span>.</span>
      </div>
    );
  }

  const totalHolders = enrichment.totalHolders ?? info.holders ?? null;
  const change = enrichment.priceChange24hPct;
  const changeColor =
    change == null ? "var(--text-dim)" : change >= 0 ? "var(--rising)" : "var(--hot)";

  const chartUrl = enrichment.topPoolAddress
    ? `https://www.geckoterminal.com/bsc/pools/${enrichment.topPoolAddress}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0`
    : null;

  return (
    <div className="mt-10 cc-fade-up" style={{ animationDelay: "120ms" }}>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-border gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="font-display font-bold text-[20px] tracking-tight">On-chain intelligence</h2>
          {cacheAgeMs != null && <CacheAgeChip ageMs={cacheAgeMs} />}
        </div>
        <a
          href={enrichment.topPoolAddress ? `https://www.geckoterminal.com/bsc/pools/${enrichment.topPoolAddress}` : "https://www.geckoterminal.com"}
          target="_blank"
          rel="noreferrer"
          className="text-[9px] uppercase tracking-widest font-data text-[color:var(--text-faint)] hover:text-primary inline-flex items-center gap-1.5"
        >
          Powered by GeckoTerminal <ExternalLinkIcon />
        </a>
      </div>

      {/* Chart */}
      {chartUrl && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-data">Price Chart</div>
            {enrichment.topPoolName && (
              <div className="text-[10px] uppercase tracking-widest font-data text-[color:var(--text-faint)]">
                {enrichment.topPoolName}
              </div>
            )}
          </div>
          <div className="border border-border bg-surface aspect-[16/9] overflow-hidden">
            <iframe
              src={chartUrl}
              title="GeckoTerminal price chart"
              className="w-full h-full"
              frameBorder={0}
              allow="clipboard-write"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Holders + Market */}
      <div className="grid lg:grid-cols-2 gap-5">
        <section className="border border-border">
          <div className="px-5 py-3 border-b border-border bg-surface/50 text-[10px] uppercase tracking-[0.3em] text-primary font-data">
            Holders &amp; Trackers
          </div>
          <div className="grid grid-cols-2">
            <EnrichRow label="Total Holders" value={totalHolders != null ? totalHolders.toLocaleString() : "—"} />
            <EnrichRow label="24h Tx" value={(info.txCount24h ?? 0).toLocaleString()} />
            <EnrichRow label="Token Age" value={info.ageDays != null ? `${info.ageDays}d` : "—"} />
            {enrichment.top10HoldersPct != null ? (
              <EnrichRow
                label="Top 10 Holders"
                value={`${enrichment.top10HoldersPct.toFixed(2)}%`}
                color={
                  enrichment.top10HoldersPct >= 70 ? "var(--hot)"
                  : enrichment.top10HoldersPct >= 40 ? "var(--warn)"
                  : "var(--rising)"
                }
                hint={
                  enrichment.top10HoldersPct >= 70 ? "Highly concentrated"
                  : enrichment.top10HoldersPct >= 40 ? "Moderately concentrated"
                  : "Well distributed"
                }
              />
            ) : (
              <Top10HoldersNudge hasKey={hasBscscanKey} />
            )}
          </div>
        </section>

        <section className="border border-border">
          <div className="px-5 py-3 border-b border-border bg-surface/50 text-[10px] uppercase tracking-[0.3em] text-primary font-data">
            Market Data
          </div>
          <div className="grid grid-cols-2">
            <EnrichRow label="Market Cap" value={fmtUsd(enrichment.marketCapUsd)} />
            <EnrichRow label="Liquidity" value={fmtUsd(enrichment.liquidityUsd)} />
            <EnrichRow label="24h Volume" value={fmtUsd(enrichment.volume24hUsd)} />
            <EnrichRow
              label="24h Change"
              value={change != null ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%` : "—"}
              color={changeColor}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/** Live-updating "Cached Xs ago" chip. Re-renders every 5s while mounted. */
function CacheAgeChip({ ageMs }: { ageMs: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const startNow = Date.now();
    const start = startNow - ageMs;
    const id = window.setInterval(() => setNow(Date.now()), 5000);
    void start;
    return () => window.clearInterval(id);
  }, [ageMs]);
  // We approximate: ageMs was the age at first render; add elapsed time since.
  const [mountedAt] = useState(() => Date.now());
  const liveAgeSec = Math.round((ageMs + (now - mountedAt)) / 1000);
  return (
    <span
      className="text-[9px] uppercase tracking-widest font-data px-2 py-0.5 border border-border text-[color:var(--text-dim)] flex items-center gap-1.5"
      title="Served from 60-second local cache"
    >
      <span className="inline-block w-1 h-1 rounded-full bg-[color:var(--text-dim)]" />
      Cached {liveAgeSec}s ago
    </span>
  );
}

/** Subtle BYOK nudge shown in the Holders panel when the Top-10 row is unavailable. */
function Top10HoldersNudge({ hasKey }: { hasKey: boolean }) {
  // If user already has a key but the data still didn't come back, just hide.
  if (hasKey) return null;
  return (
    <div className="border-b border-border p-4 min-h-[88px] col-span-2 bg-surface/30">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--text-dim)] mb-2 flex items-center gap-1.5">
        <Key size={10} className="text-primary" />
        Top 10 Holders
      </div>
      <div className="text-[12px] leading-relaxed text-[color:var(--text-dim)]">
        Add a BscScan key in{" "}
        <Link to="/settings" className="text-primary hover:underline">Settings</Link>
        {" "}to unlock holder concentration analysis.
      </div>
    </div>
  );
}

function EnrichRow({
  label, value, color, hint,
}: { label: string; value: string; color?: string; hint?: string }) {
  return (
    <div className="border-b border-r border-border last:border-r-0 [&:nth-child(even)]:border-r-0 p-4 min-h-[88px]">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--text-dim)] mb-2">{label}</div>
      <div className="font-data text-[20px] tabular-nums leading-tight" style={{ color: color ?? "var(--foreground)" }}>
        {value}
      </div>
      {hint && <div className="text-[9px] text-[color:var(--text-faint)] mt-1.5 normal-case">{hint}</div>}
    </div>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
