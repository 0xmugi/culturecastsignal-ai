import { ExternalLink, TrendingDown, TrendingUp, Users } from "lucide-react";
import { BUCKET_META, fmtUsd, type TrackedToken } from "@/lib/trackedMock";

export function TrackedTokenCard({
  token,
  onBuy,
  onDecide,
}: {
  token: TrackedToken;
  onBuy: (t: TrackedToken) => void;
  onDecide: (t: TrackedToken) => void;
}) {
  const meta = BUCKET_META[token.bucket];
  const positive = token.change24h >= 0;
  return (
    <div className={`group relative border ${meta.border} bg-card/40 hover:bg-card/70 transition-colors p-4 flex flex-col gap-3`}>
      {/* header */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 grid place-items-center rounded-md bg-secondary text-2xl shrink-0">
          {token.logo ?? "🪙"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-display font-bold text-[15px] leading-tight truncate">{token.name}</div>
            <span className="text-[10px] font-data text-[color:var(--text-faint)]">${token.ticker}</span>
          </div>
          <div className="text-[10px] font-data text-[color:var(--text-dim)] mt-0.5 truncate">
            {token.contract} · {token.ageHours}h old
          </div>
        </div>
        <div className={`text-[10px] font-data px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} shrink-0`}>
          {meta.glyph} {meta.short}
        </div>
      </div>

      {/* market data row */}
      <div className="grid grid-cols-3 gap-2 text-[11px] font-data">
        <Stat label="MCAP" value={fmtUsd(token.marketCap)} />
        <Stat label="LIQ" value={fmtUsd(token.liquidity)} />
        <Stat
          label="24H"
          value={`${positive ? "+" : ""}${token.change24h.toFixed(1)}%`}
          tone={positive ? "good" : "bad"}
          icon={positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        />
      </div>

      {/* health bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-data text-[color:var(--text-dim)]">
          <span className="flex items-center gap-1">
            <Users size={10} /> {token.holders.toLocaleString()} holders
          </span>
          <span>Top 10: {token.top10Pct.toFixed(1)}%</span>
        </div>
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full ${
              token.top10Pct < 30 ? "bg-emerald-500" : token.top10Pct < 50 ? "bg-amber-500" : "bg-rose-500"
            }`}
            style={{ width: `${Math.min(token.top10Pct, 100)}%` }}
          />
        </div>
      </div>

      {/* tags */}
      <div className="flex flex-wrap gap-1">
        {token.tags.map((tag) => (
          <span key={tag} className="text-[9px] font-data uppercase tracking-wider px-1.5 py-0.5 bg-secondary text-[color:var(--text-dim)]">
            {tag}
          </span>
        ))}
      </div>

      {/* actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onBuy(token)}
          className="flex-1 text-[11px] font-data uppercase tracking-wider py-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Quick Buy
        </button>
        <button
          onClick={() => onDecide(token)}
          className="text-[11px] font-data uppercase tracking-wider py-2 px-3 border border-border hover:bg-secondary transition-colors"
        >
          Cast
        </button>
        <a
          href={token.fourMemeUrl}
          target="_blank"
          rel="noreferrer"
          className="grid place-items-center px-2 border border-border hover:bg-secondary transition-colors text-[color:var(--text-dim)]"
          title="View on Four.meme"
        >
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}

function Stat({ label, value, tone, icon }: { label: string; value: string; tone?: "good" | "bad"; icon?: React.ReactNode }) {
  const toneCls = tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-rose-400" : "text-foreground";
  return (
    <div className="bg-secondary/40 px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-[color:var(--text-faint)]">{label}</div>
      <div className={`flex items-center gap-1 ${toneCls} text-[12px]`}>
        {icon}
        <span>{value}</span>
      </div>
    </div>
  );
}
