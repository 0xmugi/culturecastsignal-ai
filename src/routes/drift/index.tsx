import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Sidebar } from "@/components/cc/layout/Sidebar";
import { MobileTabBar } from "@/components/cc/layout/MobileTabBar";
import { SignalCard } from "@/components/cc/drift/SignalCard";
import { SignalDetail } from "@/components/cc/drift/SignalDetail";
import { WalletGate } from "@/components/cc/layout/WalletGate";
import { WhatsNewBanner } from "@/components/cc/layout/WhatsNewBanner";
import { RadarBootOverlay } from "@/components/cc/drift/RadarBootOverlay";
import { RadarFilters, applyFilters, EMPTY_FILTER, type RadarFilterState } from "@/components/cc/drift/RadarFilters";
import type { Signal } from "@/lib/signals";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { fetchLiveRadar, type RadarFeed } from "@/lib/radar.functions";
import { getCachedFeed, setCachedFeed, invalidateCachedFeed } from "@/lib/radarCache";
import { loadUserKeys } from "@/lib/userKeys";
import {
  consumeRateLimit,
  formatCountdown,
  readRateLimit,
  type RateLimitState,
} from "@/lib/rateLimit";
import { Info, KeyRound, RefreshCw, Timer, Zap } from "lucide-react";

export const Route = createFileRoute("/drift/")({
  head: () => ({
    meta: [
      { title: "CultureCast — Drift · Live cultural signal feed" },
      {
        name: "description",
        content:
          "Live trending cultural & token signals from Reddit, DexScreener, GeckoTerminal, four.meme & CoinGecko. Connect a wallet for unlimited refresh.",
      },
      { property: "og:title", content: "CultureCast — Drift" },
      {
        property: "og:description",
        content:
          "Live cultural intelligence — multi-source trending coins, momentum, and on-chain context in one feed.",
      },
    ],
  }),
  component: RadarPage,
});

function feedToSignals(feed: RadarFeed): Signal[] {
  return feed.signals.map((s) => ({
    id: s.id,
    name: s.name,
    score: s.score,
    status: s.status,
    sources: s.sources,
    velocity: s.velocity,
    detectedHoursAgo: s.detectedHoursAgo,
    launched: s.launched,
    ticker: s.symbol,
    contract: s.contract,
    windowHoursLeft: s.windowHoursLeft,
    fourMemeLive: s.fourMemeLive,
    fourMemeUrl: s.fourMemeUrl,
    memeability: s.memeability,
    tickerCollisions: s.tickerCollisions,
    collisions: s.collisions,
  }));
}

function RadarPage() {
  const { address } = useAccount();
  const [feed, setFeed] = useState<RadarFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);
  const [rateLimit, setRateLimit] = useState<RateLimitState>(() =>
    readRateLimit(address, false),
  );
  const [filter, setFilter] = useState<RadarFilterState>(EMPTY_FILTER);

  const allSignals = useMemo(() => (feed ? feedToSignals(feed) : []), [feed]);
  const signals = useMemo(() => applyFilters(allSignals, filter), [allSignals, filter]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    signals.find((s) => s.id === selectedId) ??
    allSignals.find((s) => s.id === selectedId) ??
    signals[0] ??
    null;

  useEffect(() => {
    let cancelled = false;
    const userKeys = loadUserKeys(address);
    const hasUserKey = !!userKeys.bscscan;

    // Read current limit
    const current = readRateLimit(address, hasUserKey);
    setRateLimit(current);

    // 1) Try in-memory cache first — saves quota on page navigation
    const cached = getCachedFeed(address, hasUserKey);
    if (cached && refreshTick === 0) {
      setFeed(cached);
      setLoading(false);
      if (!selectedId && cached.signals[0]) setSelectedId(cached.signals[0].id);
      return;
    }

    // 2) Block if exceeded (default tier only)
    if (!hasUserKey && current.exceeded) {
      setLoading(false);
      toast.error(
        `Daily refresh limit reached (${current.limit}/day). Resets in ${formatCountdown(current.resetInMs)}.`,
      );
      return;
    }

    setLoading(true);
    fetchLiveRadar({ data: { userBscKey: userKeys.bscscan } })
      .then((res) => {
        if (cancelled) return;
        setFeed(res);
        setCachedFeed(res, address, hasUserKey);
        // Consume one quota only on successful fetch
        const next = consumeRateLimit(address, hasUserKey);
        setRateLimit(next);
        if (!selectedId && res.signals[0]) setSelectedId(res.signals[0].id);
        if (res.warning) toast.warning(res.warning);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) toast.error("Could not load Drift feed.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, refreshTick]);

  // Tick countdown every 30s for the reset timer
  useEffect(() => {
    const userKeys = loadUserKeys(address);
    const hasUserKey = !!userKeys.bscscan;
    if (hasUserKey) return;
    const id = window.setInterval(() => {
      setRateLimit(readRateLimit(address, false));
    }, 30_000);
    return () => window.clearInterval(id);
  }, [address, refreshTick]);

  const handleRefresh = () => {
    if (rateLimit.exceeded) {
      toast.error(
        `Limit reached. Add your own BscScan key in Settings to lift it (resets in ${formatCountdown(rateLimit.resetInMs)}).`,
      );
      return;
    }
    invalidateCachedFeed();
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground cc-page-enter">
      <RadarBootOverlay />
      <Sidebar />
      <WalletGate
        feature="Drift"
        description="Drift streams live cultural & token signals. Connect a wallet so we can scope API usage and protect free-tier quota."
      >
        <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          <WhatsNewBanner />
          {feed && (
            <RateLimitBar
              feed={feed}
              rateLimit={rateLimit}
              onRefresh={handleRefresh}
              loading={loading}
            />
          )}
          {feed && allSignals.length > 0 && (
            <RadarFilters signals={allSignals} filter={filter} onChange={setFilter} />
          )}
          <div className="flex-1 flex flex-col lg:flex-row min-w-0">
            <section className="lg:w-[360px] lg:shrink-0 lg:border-r lg:border-border flex flex-col lg:h-[calc(100vh-44px)] lg:sticky lg:top-0">
              <header className="px-5 pt-7 pb-5 border-b border-border flex items-center justify-between">
                <div>
                  <h1 className="font-display font-bold text-[18px] tracking-tight">Live Signals</h1>
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--text-dim)] mt-1">
                    {feed?.source === "live"
                      ? `Live · ${feed.sourcesActive.length} sources · ${signals.length}${signals.length !== allSignals.length ? `/${allSignals.length}` : ""}`
                      : loading
                      ? "Loading…"
                      : "Fallback"}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-data">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-primary cc-pulse-dot"
                    style={{ background: feed?.source === "live" ? "var(--primary)" : "var(--text-dim)" }}
                  />
                  {loading ? "Scanning" : "Synced"}
                </span>
              </header>
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {loading && signals.length === 0 ? (
                  <SignalSkeletons />
                ) : signals.length === 0 ? (
                  <EmptyFilter />
                ) : (
                  signals.map((s, i) => (
                    <div key={s.id} className="cc-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                      <SignalCard
                        signal={s}
                        active={s.id === (selected?.id ?? "")}
                        onClick={() => setSelectedId(s.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            </section>
            <SignalDetail signal={selected} />
          </div>
        </main>
      </WalletGate>
      <MobileTabBar />
      <Toaster />
    </div>
  );
}

function RateLimitBar({
  feed,
  rateLimit,
  onRefresh,
  loading,
}: {
  feed: RadarFeed;
  rateLimit: RateLimitState;
  onRefresh: () => void;
  loading: boolean;
}) {
  const isUnlimited = !Number.isFinite(rateLimit.limit);
  const pct = isUnlimited ? 100 : Math.max(0, (rateLimit.remaining / rateLimit.limit) * 100);
  const lowQuota = !isUnlimited && rateLimit.remaining <= 5;

  // Tone gradient based on state
  const gradient = isUnlimited
    ? "linear-gradient(90deg, color-mix(in oklab, var(--rising) 20%, transparent), color-mix(in oklab, var(--rising) 5%, transparent))"
    : rateLimit.exceeded
    ? "linear-gradient(90deg, color-mix(in oklab, var(--hot) 28%, transparent), color-mix(in oklab, var(--hot) 8%, transparent))"
    : lowQuota
    ? "linear-gradient(90deg, color-mix(in oklab, var(--warn) 26%, transparent), color-mix(in oklab, var(--warn) 6%, transparent))"
    : "linear-gradient(90deg, color-mix(in oklab, var(--primary) 18%, transparent), color-mix(in oklab, var(--info) 10%, transparent))";

  const borderColor = isUnlimited
    ? "var(--rising)"
    : rateLimit.exceeded
    ? "var(--hot)"
    : lowQuota
    ? "var(--warn)"
    : "color-mix(in oklab, var(--primary) 50%, transparent)";

  const accentColor = isUnlimited
    ? "var(--rising)"
    : rateLimit.exceeded
    ? "var(--hot)"
    : lowQuota
    ? "var(--warn)"
    : "var(--foreground)";

  return (
    <div
      className="relative flex items-center justify-between gap-4 px-5 py-3 border-b text-[11px] font-data uppercase tracking-widest text-foreground"
      style={{
        background: gradient,
        borderBottomColor: borderColor,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {feed.keySource === "user" ? (
          <KeyRound size={13} className="text-primary shrink-0" />
        ) : (
          <Info size={13} style={{ color: accentColor }} className="shrink-0" />
        )}
        <span className="truncate font-semibold">
          {feed.keySource === "user"
            ? "Your BscScan key · unlimited"
            : feed.keySource === "shared"
            ? "Default tier · shared key"
            : "No BscScan key"}
        </span>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {!isUnlimited ? (
          <>
            <div className="flex items-center gap-2.5">
              {/* Mini progress ring/bar */}
              <div className="hidden sm:block w-16 h-1.5 bg-black/40 overflow-hidden rounded-sm">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: accentColor,
                    boxShadow: `0 0 8px ${accentColor}`,
                  }}
                />
              </div>
              <span
                className="tabular-nums font-bold text-[12px]"
                style={{ color: accentColor, textShadow: lowQuota || rateLimit.exceeded ? `0 0 10px ${accentColor}` : "none" }}
              >
                {rateLimit.remaining}/{rateLimit.limit}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] opacity-70">
                <Timer size={10} /> {formatCountdown(rateLimit.resetInMs)}
              </span>
            </div>
            {rateLimit.exceeded && (
              <Link
                to="/settings"
                className="hidden md:inline-flex items-center gap-1 px-2 py-1 border border-current text-[10px] hover:bg-current hover:text-background transition-colors"
                style={{ color: accentColor }}
              >
                <KeyRound size={10} /> BYOK
              </Link>
            )}
          </>
        ) : (
          <span className="flex items-center gap-1.5 font-bold text-[12px]" style={{ color: accentColor, textShadow: `0 0 10px ${accentColor}` }}>
            <Zap size={11} /> Unlimited
          </span>
        )}

        <button
          onClick={onRefresh}
          disabled={loading || rateLimit.exceeded}
          className="flex items-center gap-1.5 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
    </div>
  );
}

function EmptyFilter() {
  return (
    <div className="px-5 py-12 text-center">
      <div className="text-[12px] uppercase tracking-widest text-[color:var(--text-dim)] font-data mb-2">
        No signals match
      </div>
      <div className="text-[11px] text-[color:var(--text-faint)]">
        Try clearing some filters above.
      </div>
    </div>
  );
}

function SignalSkeletons() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-border animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-40 bg-surface" />
            <div className="h-4 w-12 bg-surface" />
          </div>
          <div className="h-3 w-24 bg-surface mb-3" />
          <div className="h-[2px] w-full bg-surface" />
        </div>
      ))}
    </div>
  );
}
