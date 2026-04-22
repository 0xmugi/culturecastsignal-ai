import { Check, X, Sparkles } from "lucide-react";
import { useTypewriter } from "@/hooks/useTypewriter";
import type { AIDecideResult } from "@/lib/aiDecide.functions";

/**
 * Sticky right-hand sidebar (desktop) that pins the AI verdict — reasoning,
 * green flags, red flags — so it stays visible while the user scrolls the
 * chart and market data on the left.
 *
 * On mobile (< lg), this collapses into the regular flow.
 */
export function DecideAiSidebar({ ai }: { ai: AIDecideResult }) {
  const reasonStream = useTypewriter(ai.reason, 10);
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto cc-fade-up" style={{ animationDelay: "180ms" }}>
      <div className="border border-border bg-surface/40 p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-data flex items-center gap-2">
            <Sparkles size={11} /> AI Verdict
          </div>
          <span className="text-[9px] uppercase tracking-widest font-data text-[color:var(--text-faint)]">
            {ai.provider}
          </span>
        </div>

        <section>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-dim)] font-data mb-2">
            Reasoning
          </div>
          <p className="text-[13px] leading-relaxed cc-caret">{reasonStream}</p>
        </section>

        <div className="cc-hairline my-5" />

        <FlagList title="Green Flags" items={ai.green} icon="check" />
        <div className="h-5" />
        <FlagList title="Red Flags" items={ai.red} icon="x" />
      </div>
    </aside>
  );
}

function FlagList({ title, items, icon }: { title: string; items: string[]; icon: "check" | "x" }) {
  const Icon = icon === "check" ? Check : X;
  const color = icon === "check" ? "var(--rising)" : "var(--primary)";
  return (
    <section>
      <div className="text-[10px] uppercase tracking-[0.3em] font-data mb-3" style={{ color }}>{title}</div>
      <ul className="flex flex-col gap-2.5">
        {items.length === 0 ? (
          <li className="text-[12px] text-[color:var(--text-faint)] italic">— none —</li>
        ) : (
          items.map((it) => (
            <li key={it} className="flex items-start gap-2.5 text-[12px] leading-relaxed">
              <Icon size={13} style={{ color }} className="mt-0.5 shrink-0" />
              <span>{it}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
