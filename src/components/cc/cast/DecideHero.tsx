import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ArrowRight, Key, Sparkles, ChevronDown } from "lucide-react";
import { FeatureBadge } from "@/components/cc/layout/PlanBadge";
import type { DecideProvider } from "@/lib/aiDecide.functions";

const BASE_PROVIDERS: { id: DecideProvider; name: string; tag: string }[] = [
  { id: "openai", name: "GPT-4o mini", tag: "OpenAI" },
  { id: "gemini", name: "Gemini Flash", tag: "Google" },
];
const ANTHROPIC_PROVIDER = { id: "anthropic" as DecideProvider, name: "Claude 3.5 Haiku", tag: "Anthropic · BYOK" };

export function DecideHero({
  addr,
  setAddr,
  onSubmit,
  error,
  disabled,
  provider,
  setProvider,
  hasAnthropicKey,
}: {
  addr: string;
  setAddr: (v: string) => void;
  onSubmit: () => void;
  error: string | null;
  disabled: boolean;
  provider: DecideProvider;
  setProvider: (p: DecideProvider) => void;
  hasAnthropicKey: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const providers = hasAnthropicKey ? [...BASE_PROVIDERS, ANTHROPIC_PROVIDER] : BASE_PROVIDERS;
  const current = providers.find((p) => p.id === provider) ?? providers[0];
  return (
    <div className="cc-fade-up">
      <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-data mb-4 flex items-center gap-2">
        Decision Engine <FeatureBadge feature="decide.basic" />
      </div>
      <h1 className="font-display font-bold text-[44px] md:text-[64px] leading-[0.95] tracking-tight mb-4">
        Paste a contract<br />address.
      </h1>
      <p className="text-[15px] text-[color:var(--text-dim)] mb-10 max-w-md">
        Get an AI verdict in seconds. <span className="text-foreground">BUY · WAIT · AVOID.</span>
      </p>

      <div className="relative">
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value.trim())}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder="0x... paste contract address"
          spellCheck={false}
          className="w-full bg-surface border border-border focus:border-primary focus:outline-none px-4 py-4 font-data text-[14px] tracking-tight transition-colors"
          style={{ boxShadow: error ? "0 0 0 1px var(--primary)" : undefined }}
        />
      </div>
      {error && <div className="mt-3 text-[12px] text-primary font-data">{error}</div>}

      <div className="flex flex-wrap items-center gap-3 mt-5">
        <span className="text-[10px] uppercase tracking-widest text-[color:var(--text-dim)]">Chain</span>
        <span className="text-[11px] uppercase tracking-widest font-data px-2 py-1 border border-primary text-primary">BNB CHAIN</span>

        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 border border-border hover:border-primary/50 text-[10px] uppercase tracking-widest font-data text-[color:var(--text-dim)] hover:text-foreground transition-colors"
          >
            <Sparkles size={11} className="text-primary" />
            AI · <span className="text-foreground">{current.name}</span>
            <ChevronDown size={11} />
          </button>
          {pickerOpen && (
            <div className="absolute left-0 top-full mt-1 z-20 min-w-[220px] border border-border bg-background shadow-lg">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setProvider(p.id); setPickerOpen(false); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-surface flex items-center justify-between gap-3 border-b border-border last:border-b-0"
                >
                  <div>
                    <div className="text-[12px] font-display font-bold tracking-tight">{p.name}</div>
                    <div className="text-[9px] uppercase tracking-widest text-[color:var(--text-dim)] font-data">{p.tag}</div>
                  </div>
                  {p.id === provider && <Check size={12} className="text-primary" />}
                </button>
              ))}
              {!hasAnthropicKey && (
                <Link
                  to="/settings"
                  onClick={() => setPickerOpen(false)}
                  className="block px-3 py-2.5 border-t border-border bg-surface/50 hover:bg-surface transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-display font-bold tracking-tight flex items-center gap-1.5">
                        <Key size={10} className="text-primary" />
                        Add Claude key
                      </div>
                      <div className="text-[9px] uppercase tracking-widest text-[color:var(--text-dim)] font-data mt-0.5">
                        Unlock Anthropic · BYOK
                      </div>
                    </div>
                    <ArrowRight size={11} className="text-primary" />
                  </div>
                </Link>
              )}
            </div>
          )}
        </div>

        <button
          onClick={onSubmit}
          disabled={disabled}
          className="ml-auto flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-[12px] uppercase tracking-widest font-data font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          Analyze <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
