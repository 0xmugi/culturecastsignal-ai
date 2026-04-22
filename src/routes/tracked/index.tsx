import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/cc/layout/Sidebar";
import { MobileTabBar } from "@/components/cc/layout/MobileTabBar";
import { Toaster } from "@/components/ui/sonner";
import { TrackedTokenCard } from "@/components/cc/tracked/TrackedTokenCard";
import { AgentCommandBar } from "@/components/cc/tracked/AgentCommandBar";
import { BUCKET_META, MOCK_TRACKED, type Bucket, type TrackedToken } from "@/lib/trackedMock";
import { fetchTrackedFeed } from "@/lib/tracked.functions";
import type { AgentAction } from "@/lib/agent.functions";
import { Filter, RefreshCw, Search, Wifi, WifiOff } from "lucide-react";

export const Route = createFileRoute("/tracked/")({
  head: () => ({
    meta: [
      { title: "CultureCast — Tracked · Buy & swap from Four.meme" },
      {
        name: "description",
        content:
          "Live Four.meme tokens auto-bucketed into Safe to Ape, Medium Risk, and Gem — with a Lovable AI agent for natural-language buys, sells, and swaps.",
      },
      { property: "og:title", content: "CultureCast — Tracked" },
      {
        property: "og:description",
        content:
          "Live Four.meme watchlist + AI agent command bar for one-line trades.",
      },
    ],
  }),
  component: TrackedPage,
});

const BUCKETS: Bucket[] = ["safe", "medium", "gem"];

function TrackedPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeBuckets, setActiveBuckets] = useState<Set<Bucket>>(new Set(BUCKETS));
  const [tokens, setTokens] = useState<TrackedToken[]>(MOCK_TRACKED);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "dexscreener" | "fallback">("fallback");
  const [warning, setWarning] = useState<string | undefined>();
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const feed = await fetchTrackedFeed();
      if (feed.tokens.length > 0) {
        setTokens(feed.tokens);
        setSource(feed.source);
        setWarning(feed.warning);
        setFetchedAt(feed.fetchedAt);
      } else {
        setTokens(MOCK_TRACKED);
        setSource("fallback");
        setWarning(feed.warning ?? "No live tokens returned. Showing mock list.");
        setFetchedAt(Date.now());
      }
    } catch (e) {
      console.error(e);
      setTokens(MOCK_TRACKED);
      setSource("fallback");
      setWarning("Failed to load live feed. Showing mock list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return tokens.filter((t) => {
      if (!activeBuckets.has(t.bucket)) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.ticker.toLowerCase().includes(q) ||
        t.contract.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q))
      );
    });
  }, [tokens, query, activeBuckets]);

  const grouped = useMemo(() => {
    const map: Record<Bucket, TrackedToken[]> = { safe: [], medium: [], gem: [] };
    for (const t of filtered) map[t.bucket].push(t);
    return map;
  }, [filtered]);

  const handleBuy = (t: TrackedToken) => {
    toast.success(`Mock buy queued: 0.05 BNB → $${t.ticker}`, {
      description: `Routing via Four.meme · ${t.contract.slice(0, 10)}…`,
    });
  };
  const handleDecide = (t: TrackedToken) => {
    navigate({ to: "/cast", search: { ca: t.contract } as never });
  };

  const handleAgentAction = (a: AgentAction) => {
    if (!a.ok) return;
    if (a.intent === "track" && a.resolvedTokenId) {
      // Surface as toast — real persistence would live here.
      toast.success(`Tracking ${a.resolvedTokenLabel ?? a.resolvedTokenId.slice(0, 10)}`);
    } else if (a.intent === "buy" && a.resolvedTokenId) {
      toast.success(`Mock buy: ${a.resolvedTokenLabel ?? a.resolvedTokenId.slice(0, 10)}`, {
        description: a.details?.amount ? `Amount: ${a.details.amount}` : undefined,
      });
    } else if (a.intent === "sell" && a.resolvedTokenId) {
      toast.success(`Mock sell: ${a.resolvedTokenLabel ?? a.resolvedTokenId.slice(0, 10)}`, {
        description: a.details?.amount ? `Amount: ${a.details.amount}` : undefined,
      });
    } else if (a.intent === "swap") {
      toast.success(a.message);
    }
  };

  const toggleBucket = (b: Bucket) => {
    setActiveBuckets((prev) => {
      const next = new Set(prev);
      if (next.has(b)) {
        if (next.size > 1) next.delete(b);
      } else {
        next.add(b);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground pb-16 md:pb-0">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-6 md:py-10 space-y-6">
          {/* header */}
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-data uppercase tracking-[0.2em] text-[color:var(--text-faint)]">
              <span>Watchlist</span>
              <span className="text-border">·</span>
              {source === "live" ? (
  <span className="flex items-center gap-1 text-emerald-400">
    <Wifi size={10} /> Live · Four.meme
  </span>
) : source === "dexscreener" ? (
  <span className="flex items-center gap-1 text-sky-400">
    <Wifi size={10} /> Live · DexScreener
  </span>
) : (
  <span className="flex items-center gap-1 text-amber-400">
    <WifiOff size={10} /> Fallback
  </span>
)}
            </div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                  Tracked <span className="text-primary">tokens</span>
                </h1>
                <p className="text-[13px] text-[color:var(--text-dim)] max-w-2xl mt-1">
                  Live picks from Four.meme auto-bucketed by liquidity, holder spread, and culture
                  score. Use the AI agent below for natural-language trades.
                </p>
              </div>
              <button
                onClick={() => void load()}
                disabled={loading}
                className="flex items-center gap-1.5 text-[10px] font-data uppercase tracking-wider px-3 py-2 border border-border hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
            {warning && (
              <div className="text-[10px] font-data text-amber-400/90 border border-amber-500/30 bg-amber-500/5 px-3 py-1.5">
                ⚠ {warning}
              </div>
            )}
          </header>

          {/* agent command bar */}
          <AgentCommandBar tokens={tokens} onAction={handleAgentAction} />

          {/* controls */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 border border-border bg-card/40 px-3 py-2 flex-1 max-w-md">
              <Search size={14} className="text-[color:var(--text-dim)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ticker, name, contract, tag…"
                className="flex-1 bg-transparent outline-none text-[13px] font-data placeholder:text-[color:var(--text-faint)]"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-data uppercase tracking-wider">
              <Filter size={12} className="text-[color:var(--text-dim)]" />
              {BUCKETS.map((b) => {
                const meta = BUCKET_META[b];
                const active = activeBuckets.has(b);
                return (
                  <button
                    key={b}
                    onClick={() => toggleBucket(b)}
                    className={`px-2.5 py-1.5 border transition-colors ${
                      active ? `${meta.bg} ${meta.color} ${meta.border}` : "border-border text-[color:var(--text-faint)] hover:text-foreground"
                    }`}
                  >
                    {meta.glyph} {meta.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* buckets */}
          <div className="space-y-8">
            {BUCKETS.map((b) => {
              if (!activeBuckets.has(b)) return null;
              const meta = BUCKET_META[b];
              const items = grouped[b];
              return (
                <section key={b} className="space-y-3">
                  <div className="flex items-end justify-between gap-3 border-b border-border pb-2">
                    <div className="flex items-baseline gap-3">
                      <h2 className={`font-display text-xl md:text-2xl font-bold tracking-tight ${meta.color}`}>
                        {meta.glyph} {meta.label}
                      </h2>
                      <span className="text-[10px] font-data text-[color:var(--text-faint)]">
                        {items.length} token{items.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="text-[10px] font-data text-[color:var(--text-dim)] hidden sm:block max-w-md text-right">
                      {meta.desc}
                    </div>
                  </div>
                  {items.length === 0 ? (
                    <div className="text-[12px] font-data text-[color:var(--text-faint)] py-6 text-center border border-dashed border-border">
                      {loading ? "Loading…" : "No tokens match your search in this bucket."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((t) => (
                        <TrackedTokenCard key={t.id} token={t} onBuy={handleBuy} onDecide={handleDecide} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <div className="text-[10px] font-data text-[color:var(--text-faint)] text-center uppercase tracking-wider pt-4">
          {source === "live"
  ? "Live data · Four.meme trending"
  : source === "dexscreener"
  ? "Live data · DexScreener · BSC / four.meme pairs"
  : "Fallback data · both feeds unreachable"}
          </div>
        </div>
      </main>
      <MobileTabBar />
      <Toaster />
    </div>
  );
}
