import { useMemo } from "react";
import type { Signal, SignalSource, SignalStatus } from "@/lib/signals";
import { statusColorVar } from "@/lib/signals";
import { ArrowDownAZ, Flame, Sparkles, X } from "lucide-react";

const SOURCE_LABEL: Record<SignalSource, string> = {
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

const STATUSES: SignalStatus[] = ["HOT", "RISING", "NEW", "COOLING"];

export type SortMode = "score" | "memeability" | "window";

export interface RadarFilterState {
  sources: Set<SignalSource>;
  statuses: Set<SignalStatus>;
  fourMemeOnly: boolean;
  sort: SortMode;
}

export const EMPTY_FILTER: RadarFilterState = {
  sources: new Set(),
  statuses: new Set(),
  fourMemeOnly: false,
  sort: "score",
};

export function applyFilters(signals: Signal[], f: RadarFilterState): Signal[] {
  let out = signals;
  if (f.fourMemeOnly || f.sources.size > 0 || f.statuses.size > 0) {
    out = signals.filter((s) => {
      if (f.fourMemeOnly && !s.fourMemeLive) return false;
      if (f.statuses.size > 0 && !f.statuses.has(s.status)) return false;
      if (f.sources.size > 0 && !s.sources.some((src) => f.sources.has(src))) return false;
      return true;
    });
  }
  // Sort
  if (f.sort === "memeability") {
    out = [...out].sort((a, b) => (b.memeability ?? 0) - (a.memeability ?? 0));
  } else if (f.sort === "window") {
    out = [...out].sort((a, b) => a.windowHoursLeft - b.windowHoursLeft);
  } // "score" preserves source order (already score-ranked)
  return out;
}

interface Props {
  signals: Signal[];
  filter: RadarFilterState;
  onChange: (next: RadarFilterState) => void;
}

export function RadarFilters({ signals, filter, onChange }: Props) {
  const availableSources = useMemo(() => {
    const set = new Set<SignalSource>();
    signals.forEach((s) => s.sources.forEach((src) => set.add(src)));
    return Array.from(set);
  }, [signals]);

  const fourMemeCount = useMemo(
    () => signals.filter((s) => s.fourMemeLive).length,
    [signals],
  );

  const toggleSource = (src: SignalSource) => {
    const next = new Set(filter.sources);
    if (next.has(src)) next.delete(src);
    else next.add(src);
    onChange({ ...filter, sources: next });
  };

  const toggleStatus = (st: SignalStatus) => {
    const next = new Set(filter.statuses);
    if (next.has(st)) next.delete(st);
    else next.add(st);
    onChange({ ...filter, statuses: next });
  };

  const setSort = (sort: SortMode) => onChange({ ...filter, sort });
  const toggleFourMeme = () => onChange({ ...filter, fourMemeOnly: !filter.fourMemeOnly });
  const clearAll = () => onChange(EMPTY_FILTER);

  const hasActive =
    filter.sources.size > 0 ||
    filter.statuses.size > 0 ||
    filter.fourMemeOnly ||
    filter.sort !== "score";

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-5 py-2.5 border-b border-border bg-background/40">
      <span className="text-[9px] uppercase tracking-[0.25em] text-[color:var(--text-dim)] font-data mr-1">
        Sort
      </span>
      <SortChip active={filter.sort === "score"} onClick={() => setSort("score")} icon={<Flame size={10} />}>
        Cultural
      </SortChip>
      <SortChip active={filter.sort === "memeability"} onClick={() => setSort("memeability")} icon={<Sparkles size={10} />} accent="var(--rising)">
        Memeability
      </SortChip>
      <SortChip active={filter.sort === "window"} onClick={() => setSort("window")} icon={<ArrowDownAZ size={10} />} accent="var(--warn)">
        Window
      </SortChip>

      <span className="mx-1 h-3 w-px bg-border" />
      <span className="text-[9px] uppercase tracking-[0.25em] text-[color:var(--text-dim)] font-data mr-1">
        Filter
      </span>

      {fourMemeCount > 0 && (
        <Chip
          active={filter.fourMemeOnly}
          color="var(--rising)"
          onClick={toggleFourMeme}
          title={`${fourMemeCount} live on Four.meme`}
        >
          ● 4.MEME LIVE <span className="opacity-60">· {fourMemeCount}</span>
        </Chip>
      )}

      {STATUSES.map((st) => {
        const count = signals.filter((s) => s.status === st).length;
        if (count === 0) return null;
        return (
          <Chip
            key={st}
            active={filter.statuses.has(st)}
            color={statusColorVar(st)}
            onClick={() => toggleStatus(st)}
          >
            {st} <span className="opacity-60">· {count}</span>
          </Chip>
        );
      })}

      <span className="mx-1 h-3 w-px bg-border" />

      {availableSources.map((src) => {
        const count = signals.filter((s) => s.sources.includes(src)).length;
        return (
          <Chip
            key={src}
            active={filter.sources.has(src)}
            color="var(--info)"
            onClick={() => toggleSource(src)}
          >
            {SOURCE_LABEL[src] ?? src.toUpperCase()}{" "}
            <span className="opacity-60">· {count}</span>
          </Chip>
        );
      })}

      {hasActive && (
        <button
          onClick={clearAll}
          className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-widest font-data text-[color:var(--text-dim)] hover:text-primary transition-colors"
        >
          <X size={10} /> Clear
        </button>
      )}
    </div>
  );
}

function Chip({
  children,
  active,
  color,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active: boolean;
  color: string;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="text-[10px] font-data tracking-wider px-2 py-1 border transition-colors"
      style={{
        color: active ? "var(--primary-foreground)" : color,
        borderColor: active ? color : "var(--border)",
        backgroundColor: active ? color : "transparent",
      }}
    >
      {children}
    </button>
  );
}

function SortChip({
  children,
  active,
  onClick,
  icon,
  accent,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  accent?: string;
}) {
  const color = accent ?? "var(--primary)";
  return (
    <button
      onClick={onClick}
      className="text-[10px] font-data uppercase tracking-wider px-2 py-1 border transition-all flex items-center gap-1.5"
      style={{
        color: active ? "var(--primary-foreground)" : color,
        borderColor: active ? color : "var(--border)",
        backgroundColor: active ? color : "transparent",
        boxShadow: active ? `0 0 12px color-mix(in oklab, ${color} 35%, transparent)` : "none",
      }}
    >
      {icon}
      {children}
    </button>
  );
}
