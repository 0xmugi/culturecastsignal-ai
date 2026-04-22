import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Rocket, Flame } from "lucide-react";
import { type Signal, scoreColorVar, statusColorVar } from "@/lib/signals";
import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  signal: Signal;
  active: boolean;
  onClick: () => void;
}

const sourceLabel: Record<string, string> = {
  reddit: "RDT",
  google: "GGL",
  tiktok: "TTK",
  twitter: "X",
  cryptopanic: "CP",
  coingecko: "CG",
  bscscan: "BSC",
  trending: "TRND",
  dexscreener: "DEX",
  geckoterminal: "GT",
  fourmeme: "4MM",
};

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

export function SignalCard({ signal, active, onClick }: Props) {
  const scoreColor = scoreColorVar(signal.score);
  const statusColor = statusColorVar(signal.status);
  const hasContract = !!signal.contract && ADDR_RE.test(signal.contract.trim());

  // Count-up the score on mount/id-change.
  const animatedScore = useCountUp(signal.score, 900);

  // Pulse red border when a HOT signal updates (score change while HOT).
  const prevScore = useRef(signal.score);
  const [hotPulse, setHotPulse] = useState(false);
  useEffect(() => {
    if (signal.status === "HOT" && prevScore.current !== signal.score) {
      setHotPulse(true);
      const t = window.setTimeout(() => setHotPulse(false), 1200);
      return () => window.clearTimeout(t);
    }
    prevScore.current = signal.score;
  }, [signal.score, signal.status]);

  const borderLeftColor = active
    ? "var(--primary)"
    : hotPulse
    ? "var(--hot)"
    : "transparent";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group w-full text-left px-5 py-4 border-l-2 transition-all hover:bg-surface cursor-pointer relative"
      style={{
        borderLeftColor,
        backgroundColor: active ? "var(--surface)" : "transparent",
        animation: hotPulse ? "cc-hot-pulse 1.2s ease-out" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="font-data font-semibold text-[22px] leading-none tabular-nums"
            style={{ color: scoreColor }}
          >
            {animatedScore}
          </span>
          <h3 className="font-display font-bold text-[15px] leading-tight truncate text-foreground">
            {signal.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasContract && (
            <Link
              to="/cast"
              search={{ addr: signal.contract!.trim() } as never}
              onClick={(e) => e.stopPropagation()}
              title="Analyze in Cast"
              className="flex items-center gap-1 text-[9px] font-data font-semibold uppercase tracking-widest px-1.5 py-0.5 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Sparkles size={9} /> Analyze
            </Link>
          )}
          <span
            className="text-[10px] font-data font-semibold tracking-widest px-1.5 py-0.5"
            style={{ color: statusColor, border: `1px solid ${statusColor}` }}
          >
            {signal.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        {/* Four.meme launch label — present on EVERY card (live OR not). */}
        {signal.fourMemeLive ? (
          <span
            className="text-[9px] font-data font-semibold tracking-wider px-1.5 py-0.5 cc-pulse-dot inline-flex items-center gap-1"
            style={{
              color: "var(--rising)",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "var(--rising)",
              backgroundColor: "color-mix(in oklab, var(--rising) 12%, transparent)",
            }}
            title="Token is live on four.meme"
          >
            <Flame size={9} /> 4.MEME LIVE
          </span>
        ) : (
          <span
            className="text-[9px] font-data tracking-wider px-1.5 py-0.5 inline-flex items-center gap-1"
            style={{
              color: "var(--text-dim)",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: "var(--border)",
            }}
            title="Not yet launched on Four.meme — first-mover opportunity"
          >
            <Rocket size={9} /> NOT LAUNCHED
          </span>
        )}
        {signal.sources.map((s) => (
          <span
            key={s}
            className="text-[9px] font-data tracking-wider px-1.5 py-0.5 text-[color:var(--text-dim)] border border-border"
          >
            {sourceLabel[s] ?? s.toUpperCase().slice(0, 4)}
          </span>
        ))}
      </div>

      <div className="h-[2px] bg-border overflow-hidden">
        <div
          className="h-full cc-bar-fill"
          style={{ width: `${signal.score}%`, backgroundColor: scoreColor }}
        />
      </div>

      <div className="flex items-center justify-between mt-2.5 text-[10px] uppercase tracking-wider text-[color:var(--text-dim)]">
        <span>{signal.detectedHoursAgo}h ago</span>
        <span className="font-data">{signal.velocity}</span>
      </div>
    </div>
  );
}
