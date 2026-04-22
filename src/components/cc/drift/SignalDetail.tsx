import { useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useAccount } from "wagmi";
import { Bookmark, ExternalLink, Copy, Check, Rocket, Sparkles, RefreshCw, AlertCircle, KeyRound, ChevronDown, AlertTriangle, X } from "lucide-react";
import { type Signal, scoreColorVar } from "@/lib/signals";
import { useCountUp } from "@/hooks/useCountUp";
import { useTypewriter } from "@/hooks/useTypewriter";
import { toast } from "sonner";
import { loadUserKeys } from "@/lib/userKeys";
import { analyzeSignalWithGroq, type AIAnalysisResult } from "@/lib/groq.functions";
import { LaunchOnFourMemeModal } from "@/components/cc/drift/LaunchOnFourMemeModal";
import { consumeAiQuota, readAiQuota } from "@/lib/aiQuota";
import { fetchTokensActivity, type TokenActivity } from "@/lib/bscscan.functions";

interface Props { signal: Signal | null }

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

export function SignalDetail({ signal }: Props) {
  const navigate = useNavigate();
  const { address } = useAccount();
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [launchOpen, setLaunchOpen] = useState(false);
  const [collisionGate, setCollisionGate] = useState(false);

  // When user clicks Launch, if there are existing tokens with same ticker on
  // Four.meme, show a "are you sure?" gate first so they don't accidentally
  // launch a duplicate of an active project.
  const requestLaunch = () => {
    const collisionsCount = signal?.tickerCollisions ?? 0;
    if (collisionsCount > 0) {
      setCollisionGate(true);
    } else {
      setLaunchOpen(true);
    }
  };

  const userKeys = loadUserKeys(address);

  const runAnalysis = async (sig: Signal) => {
    const hasUserGroq = !!userKeys.groq;
    // Plan-aware quota — only enforced for users without their own Groq key.
    const q = readAiQuota("radar", address, hasUserGroq);
    if (q.exceeded) {
      const hrs = Math.ceil(q.resetInMs / 3_600_000);
      setAiError(
        `Daily AI analysis limit reached for your ${q.plan.toUpperCase()} plan (${q.limit}/day). Resets in ~${hrs}h. Upgrade your plan or add a free Groq key in Settings to lift this.`,
      );
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await analyzeSignalWithGroq({
        data: {
          groqKey: userKeys.groq,
          signal: {
            name: sig.name,
            symbol: sig.ticker ?? sig.name.slice(0, 6),
            score: sig.score,
            status: sig.status,
            velocity: sig.velocity,
            sources: sig.sources,
            windowHoursLeft: sig.windowHoursLeft,
            launched: sig.launched,
            fourMemeLive: !!sig.fourMemeLive,
          },
        },
      });
      setAnalysis(res);
      if (res.error) setAiError(res.error);
      else consumeAiQuota("radar", address, hasUserGroq);
    } catch (e) {
      console.error(e);
      setAiError("Analysis failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    setAnalysis(null);
    setAiError(null);
    if (!signal) return;
    runAnalysis(signal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signal?.id]);

  if (!signal) return <EmptyState />;

  const goToDecide = () => {
    const c = (signal.contract ?? "").trim();
    if (!ADDR_RE.test(c)) {
      toast.error("This signal has no valid contract address yet.");
      return;
    }
    navigate({ to: "/cast", search: { addr: c } as never });
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-8 py-10">
        <Header
          signal={signal}
          onAnalyzeToken={goToDecide}
          onLaunch={requestLaunch}
        />
        <Metrics signal={signal} />
        {signal.collisions && signal.collisions.length > 0 && (
          <CollisionsBlock collisions={signal.collisions} />
        )}

        {signal.fourMemeLive && <FourMemeLiveCard signal={signal} />}
        {signal.contract && <ContractRow contract={signal.contract} />}

        <AnalysisSection
          analysis={analysis}
          loading={aiLoading}
          error={aiError}
          onRetry={() => runAnalysis(signal)}
        />

        {analysis && (
          <>
            <LaunchKitBlock signal={signal} kit={analysis} onLaunch={requestLaunch} />
            {analysis.memes.length > 0 && <MemeBlock memes={analysis.memes} />}
          </>
        )}

        <Sources active={signal.sources} />
      </div>

      {collisionGate && signal.collisions && (
        <CollisionGateModal
          signal={signal}
          collisions={signal.collisions}
          onClose={() => setCollisionGate(false)}
          onConfirm={() => {
            setCollisionGate(false);
            setLaunchOpen(true);
          }}
        />
      )}

      {launchOpen && (
        <LaunchOnFourMemeModal
          signal={signal}
          prefill={{ tagline: analysis?.tagline, description: analysis?.description, audience: analysis?.audience }}
          onClose={() => setLaunchOpen(false)}
        />
      )}
    </div>
  );
}

function Header({
  signal,
  onAnalyzeToken,
  onLaunch,
}: {
  signal: Signal;
  onAnalyzeToken: () => void;
  onLaunch: () => void;
}) {
  return (
    <div className="cc-fade-up">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[color:var(--text-dim)] mb-3">
        Cultural Signal · {signal.sources.join(" / ")} · {signal.detectedHoursAgo}h ago
      </div>
      <h1 className="font-display font-bold text-[44px] leading-[1.05] tracking-tight mb-5">
        {signal.name}
      </h1>
      <div className="flex flex-wrap items-center gap-2 mb-10">
        <button className="flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-widest border border-border hover:border-primary/50 transition-colors">
          <Bookmark size={12} /> Save Signal
        </button>
        {signal.launched && signal.contract ? (
          <button
            onClick={onAnalyzeToken}
            className="flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90"
          >
            Analyze ${signal.ticker} <ExternalLink size={12} />
          </button>
        ) : null}
        {signal.fourMemeLive && signal.fourMemeUrl ? (
          <a
            href={signal.fourMemeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-widest font-data font-semibold"
            style={{
              background: "color-mix(in oklab, var(--rising) 18%, transparent)",
              color: "var(--rising)",
              border: "1px solid var(--rising)",
            }}
          >
            View on Four.meme <ExternalLink size={12} />
          </a>
        ) : (
          <button
            onClick={onLaunch}
            className="flex items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-widest bg-primary text-primary-foreground hover:opacity-90"
          >
            <Rocket size={12} /> Launch on Four.meme
          </button>
        )}
      </div>
    </div>
  );
}

function FourMemeLiveCard({ signal }: { signal: Signal }) {
  return (
    <div
      className="mb-8 px-4 py-3 flex items-center justify-between gap-3 border cc-fade-up"
      style={{
        borderColor: "var(--rising)",
        background: "color-mix(in oklab, var(--rising) 8%, transparent)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full cc-pulse-dot"
          style={{ background: "var(--rising)" }}
        />
        <span className="text-[10px] uppercase tracking-[0.25em] font-data font-semibold" style={{ color: "var(--rising)" }}>
          Live on Four.meme
        </span>
      </div>
      {signal.fourMemeUrl && (
        <a
          href={signal.fourMemeUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-data hover:underline"
          style={{ color: "var(--rising)" }}
        >
          Open page <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

function ContractRow({ contract }: { contract: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mb-8 flex items-center justify-between gap-3 px-3 py-2.5 border border-border bg-surface/50">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[9px] uppercase tracking-widest text-[color:var(--text-dim)] font-data shrink-0">
          Contract
        </span>
        <span className="font-data text-[12px] truncate">{contract}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => {
            navigator.clipboard.writeText(contract);
            setCopied(true);
            toast.success("Contract copied");
            window.setTimeout(() => setCopied(false), 1500);
          }}
          className="p-1.5 text-[color:var(--text-dim)] hover:text-primary"
        >
          {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
        </button>
        <a
          href={`https://bscscan.com/token/${contract}`}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 text-[color:var(--text-dim)] hover:text-primary"
        >
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border-l border-border pl-4">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--text-dim)] mb-2">{label}</div>
      <div className="font-data text-[26px] leading-none" style={{ color: color ?? "var(--foreground)" }}>{value}</div>
    </div>
  );
}

function Metrics({ signal }: { signal: Signal }) {
  const score = useCountUp(signal.score);
  const meme = useCountUp(signal.memeability ?? 0);
  const windowLabel = useFirstMoverWindow(signal.windowHoursLeft);
  const collisionLabel =
    typeof signal.tickerCollisions === "number"
      ? signal.tickerCollisions === 0
        ? "Clear"
        : `${signal.tickerCollisions} taken`
      : "—";
  const collisionColor =
    typeof signal.tickerCollisions === "number" && signal.tickerCollisions > 0
      ? "var(--warn)"
      : "var(--rising)";
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 cc-fade-up" style={{ animationDelay: "60ms" }}>
        <Metric label="Cultural Score" value={`${score} / 100`} color={scoreColorVar(signal.score)} />
        <Metric label="Memeability" value={`${meme} / 100`} color={meme >= 70 ? "var(--rising)" : meme >= 50 ? "var(--info)" : "var(--text-dim)"} />
        <Metric label="Velocity" value={signal.velocity} />
        <Metric label="Launched?" value={signal.launched ? `Yes${signal.ticker ? ` · $${signal.ticker}` : ""}` : "Not yet"} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 cc-fade-up" style={{ animationDelay: "100ms" }}>
        <Metric label="First-mover Window" value={windowLabel} color={signal.windowHoursLeft <= 12 ? "var(--hot)" : "var(--foreground)"} />
        <Metric label="Ticker Collisions" value={collisionLabel} color={collisionColor} />
        <Metric label="Detected" value={`${signal.detectedHoursAgo}h ago`} />
        <Metric label="Status" value={signal.status} color={scoreColorVar(signal.score)} />
      </div>
    </>
  );
}

/**
 * Live-ticking countdown for the first-mover window.
 * Decrements one minute every minute so the value feels alive.
 */
function useFirstMoverWindow(hoursLeft: number): string {
  const [mins, setMins] = useState(() => Math.max(0, Math.round(hoursLeft * 60)));
  useEffect(() => {
    setMins(Math.max(0, Math.round(hoursLeft * 60)));
    const id = window.setInterval(() => setMins((m) => Math.max(0, m - 1)), 60_000);
    return () => window.clearInterval(id);
  }, [hoursLeft]);
  if (mins <= 0) return "Closed";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h >= 24) return `~${Math.round(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m`;
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 rounded-full bg-primary cc-pulse-dot" />
        <h2 className="text-[10px] uppercase tracking-[0.3em] font-data font-semibold">{children}</h2>
      </div>
      {action}
    </div>
  );
}

function AnalysisSection({
  analysis,
  loading,
  error,
  onRetry,
}: {
  analysis: AIAnalysisResult | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const hasKey = true;
  return (
    <section className="mb-12 cc-fade-up" style={{ animationDelay: "120ms" }}>
      <SectionTitle
        action={
          hasKey && !loading ? (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-data text-[color:var(--text-dim)] hover:text-primary"
            >
              <RefreshCw size={10} /> Re-analyze
            </button>
          ) : null
        }
      >
        AI Analysis {analysis ? <span className="ml-2 opacity-50">· Groq Llama 3.3</span> : null}
      </SectionTitle>

      {!hasKey ? (
        <NoKeyState />
      ) : loading ? (
        <LoadingBlock />
      ) : error && !analysis ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : analysis ? (
        <AnalysisBody analysis={analysis} />
      ) : null}
    </section>
  );
}

function AnalysisBody({ analysis }: { analysis: AIAnalysisResult }) {
  const stream = useTypewriter(analysis.why, 12);
  return (
    <>
      <p className="text-[15px] leading-relaxed text-foreground/90 cc-caret">{stream}</p>
      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <Field label="Opportunity" value={analysis.opportunity} />
        <Field label="Risk" value={analysis.risk} />
        <Field label="Confidence" value={`${analysis.confidence}% · ${analysis.timing}`} />
      </div>
    </>
  );
}

function NoKeyState() {
  return (
    <div className="border border-border bg-surface/40 p-5 flex items-start gap-3">
      <Sparkles size={16} className="text-primary shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="text-[13px] mb-1.5">AI analysis powered by Groq (Llama 3.3 70B).</div>
        <div className="text-[11.5px] text-[color:var(--text-dim)] mb-3 leading-relaxed">
          Free tier is generous and runs &lt;1s. Add your free Groq API key in Settings to unlock per-signal AI insights, launch kits, and ready-to-post memes.
        </div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-primary/50 text-[10px] uppercase tracking-widest font-data text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <KeyRound size={11} /> Add Groq Key
        </Link>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border border-border bg-surface/40 p-4 flex items-start gap-3">
      <AlertCircle size={14} className="text-warn shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="text-[12px] mb-2">{message}</div>
        <button
          onClick={onRetry}
          className="text-[10px] uppercase tracking-widest font-data text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--text-dim)] mb-2">{label}</div>
      <div className="text-[13px] leading-relaxed">{value}</div>
    </div>
  );
}

function LaunchKitBlock({
  signal,
  kit,
  onLaunch,
}: {
  signal: Signal;
  kit: AIAnalysisResult;
  onLaunch: () => void;
}) {
  return (
    <section className="mb-12 cc-fade-up" style={{ animationDelay: "180ms" }}>
      <SectionTitle
        action={
          !signal.fourMemeLive ? (
            <button
              onClick={onLaunch}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-data text-primary hover:underline"
            >
              <Rocket size={10} /> Launch with this kit
            </button>
          ) : null
        }
      >
        Launch Kit
      </SectionTitle>
      <div className="grid grid-cols-2 md:grid-cols-3 border-t border-l border-border">
        {[
          ["Token Name", signal.name],
          ["Ticker", `$${signal.ticker ?? signal.name.replace(/[^A-Z0-9]/gi, "").slice(0, 5).toUpperCase()}`],
          ["Tagline", kit.tagline],
          ["Description", kit.description],
          ["Audience", kit.audience],
          ["Launch Timing", kit.timing],
        ].map(([l, v]) => (
          <div key={l} className="border-b border-r border-border p-4">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--text-dim)] mb-2">{l}</div>
            <div className="text-[13px] leading-snug">{v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MemeBlock({ memes }: { memes: AIAnalysisResult["memes"] }) {
  return (
    <section className="mb-12 cc-fade-up" style={{ animationDelay: "240ms" }}>
      <SectionTitle>Ready-to-post Memes</SectionTitle>
      <div className="flex flex-col gap-3">
        {memes.map((m, i) => <MemeCard key={i} {...m} />)}
      </div>
    </section>
  );
}

function MemeCard({ channel, text, format }: { channel: string; text: string; format: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="border border-border p-4 flex items-start justify-between gap-4 hover:border-primary/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-primary font-data">{channel}</span>
          <span className="text-[10px] uppercase tracking-widest text-[color:var(--text-dim)]">{format}</span>
        </div>
        <p className="text-[13px] leading-relaxed">{text}</p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);
          toast.success("Copied to clipboard");
          window.setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 p-2 border border-border hover:border-primary/50 transition-colors"
      >
        {copied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

function useCollisionActivity(collisions: NonNullable<Signal["collisions"]>) {
  const [activity, setActivity] = useState<Record<string, TokenActivity>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const addrs = collisions.map((c) => c.address).filter((a): a is string => !!a).slice(0, 8);
    if (addrs.length === 0) return;
    let cancelled = false;
    setLoading(true);
    fetchTokensActivity({ data: { addresses: addrs } })
      .then((res) => {
        if (cancelled) return;
        const map: Record<string, TokenActivity> = {};
        res.forEach((r) => { map[r.address.toLowerCase()] = r; });
        setActivity(map);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [collisions]);

  return { activity, loading };
}

function ActivityChip({ state }: { state: TokenActivity["state"] | undefined }) {
  if (!state || state === "UNKNOWN") {
    return (
      <span
        className="text-[8px] uppercase tracking-widest font-data px-1.5 py-0.5 border"
        style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}
      >
        ?
      </span>
    );
  }
  const map = {
    ACTIVE: { color: "var(--rising)", label: "ACTIVE" },
    QUIET:  { color: "var(--warn)",   label: "QUIET"  },
    DEAD:   { color: "var(--text-dim)", label: "DEAD"   },
  } as const;
  const m = map[state];
  return (
    <span
      className="text-[8px] uppercase tracking-widest font-data px-1.5 py-0.5 border inline-flex items-center gap-1"
      style={{ borderColor: m.color, color: m.color }}
    >
      <span className="h-1 w-1 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

function CollisionsBlock({ collisions }: { collisions: NonNullable<Signal["collisions"]> }) {
  const [open, setOpen] = useState(false);
  const { activity, loading } = useCollisionActivity(collisions);
  return (
    <div
      className="mb-8 border cc-fade-up"
      style={{
        borderColor: "var(--warn)",
        background: "color-mix(in oklab, var(--warn) 6%, transparent)",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3"
      >
        <div className="flex items-center gap-2 text-left">
          <AlertTriangle size={14} style={{ color: "var(--warn)" }} />
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] font-data font-semibold" style={{ color: "var(--warn)" }}>
              Ticker Collisions · {collisions.length}{loading ? " · checking activity…" : ""}
            </div>
            <div className="text-[11.5px] text-[color:var(--text-dim)] mt-0.5">
              Other Four.meme launches share this symbol — DEAD ones are safe to overwrite.
            </div>
          </div>
        </div>
        <ChevronDown
          size={14}
          className="shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none", color: "var(--warn)" }}
        />
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {collisions.map((c, i) => {
            const act = c.address ? activity[c.address.toLowerCase()] : undefined;
            return (
              <a
                key={`${c.address ?? c.name}-${i}`}
                href={c.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-surface/40 transition-colors"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <ActivityChip state={act?.state} />
                  <div className="min-w-0">
                    <div className="text-[12.5px] truncate">{c.name}</div>
                    {c.address && (
                      <div className="text-[10px] font-data text-[color:var(--text-dim)] truncate">
                        {c.address.slice(0, 8)}…{c.address.slice(-6)}
                        {act?.lastTxAgoHours != null && (
                          <span className="ml-2">· last tx {formatAgo(act.lastTxAgoHours)} ago</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-data text-[color:var(--text-dim)] hover:text-primary shrink-0">
                  Verify <ExternalLink size={11} />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatAgo(hours: number): string {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${Math.round(hours)}h`;
  const d = Math.round(hours / 24);
  if (d < 30) return `${d}d`;
  return `${Math.round(d / 30)}mo`;
}

/* ====== Collision launch confirmation modal ====== */

function CollisionGateModal({
  signal,
  collisions,
  onClose,
  onConfirm,
}: {
  signal: Signal;
  collisions: NonNullable<Signal["collisions"]>;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { activity } = useCollisionActivity(collisions);
  const activeCount = collisions.filter((c) => {
    const a = c.address ? activity[c.address.toLowerCase()] : undefined;
    return a?.state === "ACTIVE";
  }).length;
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cc-fade-up"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-background border shadow-[0_0_60px_rgba(0,0,0,0.6)]"
        style={{ borderColor: "var(--warn)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-[color:var(--text-dim)] hover:text-foreground"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} style={{ color: "var(--warn)" }} />
            <div className="text-[10px] uppercase tracking-[0.3em] font-data" style={{ color: "var(--warn)" }}>
              Heads up — duplicate ticker
            </div>
          </div>
          <h3 className="font-display font-bold text-[22px] tracking-tight leading-tight mb-3">
            ${signal.ticker ?? signal.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)} already exists{" "}
            <span className="text-[color:var(--text-dim)]">— {collisions.length} on Four.meme</span>
          </h3>
          <p className="text-[13px] text-[color:var(--text-dim)] leading-relaxed mb-4">
            {activeCount > 0 ? (
              <>
                <span className="text-warn font-semibold">{activeCount} of them is still ACTIVE</span> in the
                last 24h. Launching a duplicate may split liquidity and confuse buyers. Verify them first.
              </>
            ) : (
              <>None of them have traded recently — they look DEAD. You're probably safe to launch a fresh one.</>
            )}
          </p>
          <div className="border border-border bg-surface/40 max-h-[180px] overflow-y-auto divide-y divide-border mb-5">
            {collisions.slice(0, 5).map((c, i) => {
              const a = c.address ? activity[c.address.toLowerCase()] : undefined;
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <ActivityChip state={a?.state} />
                  <div className="text-[12px] truncate flex-1">{c.name}</div>
                  {c.address && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] uppercase tracking-widest font-data text-[color:var(--text-dim)] hover:text-primary shrink-0 inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      open <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 border border-border text-[11px] uppercase tracking-widest font-data hover:border-primary/50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-5 py-2.5 text-[11px] uppercase tracking-widest font-data font-semibold text-primary-foreground hover:opacity-90"
              style={{ background: "var(--warn)" }}
            >
              <Rocket size={12} /> Launch anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


const ALL_SOURCES = [
  { id: "google", label: "Google Trends", color: "var(--hot)" },
  { id: "reddit", label: "Reddit", color: "var(--rising)" },
  { id: "coingecko", label: "CoinGecko", color: "var(--info)" },
  { id: "dexscreener", label: "DexScreener", color: "var(--warn)" },
  { id: "geckoterminal", label: "GeckoTerminal", color: "var(--info)" },
  { id: "fourmeme", label: "Four.meme", color: "var(--rising)" },
];

function Sources({ active }: { active: string[] }) {
  return (
    <section className="mb-12 cc-fade-up" style={{ animationDelay: "300ms" }}>
      <SectionTitle>Data Sources</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {ALL_SOURCES.map((s) => {
          const isActive = active.includes(s.id);
          return (
            <span
              key={s.label}
              className="text-[10px] font-data uppercase tracking-widest px-2 py-1 border transition-opacity"
              style={{
                color: s.color,
                borderColor: s.color,
                opacity: isActive ? 1 : 0.35,
              }}
            >
              {s.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}

function LoadingBlock() {
  return (
    <div className="text-[12px] uppercase tracking-widest text-[color:var(--text-dim)] cc-dots">
      Analyzing<span>.</span><span>.</span><span>.</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 hidden lg:flex items-center justify-center px-8">
      <div className="text-center max-w-sm">
        <div className="font-display text-[28px] leading-tight mb-3 text-foreground/70">
          Select a signal
        </div>
        <p className="text-[13px] text-[color:var(--text-dim)] leading-relaxed">
          Click any signal in the feed to see its cultural analysis, launch kit, and ready-to-post memes.
        </p>
      </div>
    </div>
  );
}
