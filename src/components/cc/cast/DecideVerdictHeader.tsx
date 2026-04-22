import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { useCountUp } from "@/hooks/useCountUp";
import type { BscTokenInfo, DataSource } from "@/lib/bscscan.functions";
import type { AIDecideResult } from "@/lib/aiDecide.functions";

function decisionColor(d: AIDecideResult["decision"]): string {
  if (d === "BUY") return "var(--rising)";
  if (d === "WAIT") return "var(--warn)";
  return "var(--primary)";
}

export function DecideVerdictHeader({
  info,
  ai,
  addr,
}: {
  info: BscTokenInfo;
  ai: AIDecideResult;
  addr: string;
}) {
  const conf = useCountUp(ai.confidence);
  const color = decisionColor(ai.decision);

  const share = () => {
    const text = `I analyzed $${info.symbol} on CultureCast\nDecision: ${ai.decision} (${ai.confidence}% confidence)\nPhase: ${ai.phase} | Risk: ${ai.risk}\nAI: ${ai.provider}\n\nBuilt on @four_meme\nculturecast.xyz`;
    navigator.clipboard.writeText(text);
    toast.success("Result copied to clipboard");
  };

  return (
    <div className="mt-12">
      <div className="text-center cc-fade-up">
        <div className="text-[11px] uppercase tracking-widest text-[color:var(--text-dim)] mb-3">
          {info.name} · ${info.symbol} · BNB CHAIN
        </div>
        <div
          className="font-display font-bold text-[88px] md:text-[120px] leading-none tracking-tight"
          style={{ color }}
        >
          {ai.decision}
        </div>
        <div className="flex items-center justify-center gap-6 mt-5 font-data text-[12px] uppercase tracking-widest">
          <span className="text-[color:var(--text-dim)]">Confidence <span className="text-foreground tabular-nums">{conf}%</span></span>
          <span className="text-[color:var(--text-dim)]">Risk <span className="text-foreground">{ai.risk}</span></span>
          <span className="text-[color:var(--text-dim)]">Phase <span className="text-foreground">{ai.phase}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 border-t border-border pt-8 cc-fade-up" style={{ animationDelay: "100ms" }}>
        <DataMetric label="Holders" value={(info.holders ?? 0).toLocaleString()} source={info.fieldSources.holders} />
        <DataMetric label="24h Tx" value={(info.txCount24h ?? 0).toLocaleString()} source={info.fieldSources.txCount24h} />
        <DataMetric label="Token Age" value={`${info.ageDays ?? "?"}d`} source={info.fieldSources.ageDays} />
        <DataMetric label="Phase" value={ai.phase} />
      </div>

      <SourceBadge fieldSources={info.fieldSources} />

      <div className="mt-10 flex items-center gap-3 cc-fade-up" style={{ animationDelay: "200ms" }}>
        <button
          onClick={share}
          className="flex items-center gap-2 px-4 py-3 border border-border hover:border-primary/50 transition-colors text-[11px] uppercase tracking-widest font-data"
        >
          <Share2 size={13} /> Share Result
        </button>
        <span className="text-[10px] font-data text-[color:var(--text-faint)] truncate">{addr}</span>
      </div>
    </div>
  );
}

function DataMetric({ label, value, source }: { label: string; value: string; source?: DataSource }) {
  const srcLabel =
    source === "bscscan" ? "BscScan"
    : source === "geckoterminal" ? "GeckoTerminal"
    : source === "none" ? "no data"
    : null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--text-dim)] mb-2 flex items-center gap-1.5 flex-wrap">
        <span>{label}</span>
        {srcLabel && (
          <span
            className="text-[8px] tracking-[0.15em] font-data px-1 py-0.5 border normal-case"
            style={{
              borderColor: source === "none" ? "var(--text-faint)" : "var(--border)",
              color: source === "none" ? "var(--text-faint)" : "var(--text-dim)",
            }}
            title={`Data from ${srcLabel}`}
          >
            {srcLabel}
          </span>
        )}
      </div>
      <div className="font-data text-[24px] tabular-nums">{value}</div>
    </div>
  );
}

function SourceBadge({ fieldSources }: { fieldSources: BscTokenInfo["fieldSources"] }) {
  const sources = new Set<string>();
  Object.values(fieldSources).forEach((s) => {
    if (s === "bscscan") sources.add("BscScan");
    if (s === "geckoterminal") sources.add("GeckoTerminal");
  });
  if (sources.size === 0) return null;
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-[9px] uppercase tracking-widest font-data text-[color:var(--text-faint)]">
      <span>On-chain data</span>
      <span className="text-[color:var(--text-dim)]">·</span>
      <span className="text-[color:var(--text-dim)]">{Array.from(sources).join(" + ")}</span>
    </div>
  );
}
