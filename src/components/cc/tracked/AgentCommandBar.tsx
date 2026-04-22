import { useState, useRef, useEffect } from "react";
import { Sparkles, Terminal, ArrowUp, X, Loader2 } from "lucide-react";
import { runAgentCommand, type AgentAction } from "@/lib/agent.functions";
import type { TrackedToken } from "@/lib/trackedMock";

interface LogEntry {
  id: number;
  command: string;
  result: AgentAction;
  ts: number;
}

const QUICK_PROMPTS = [
  "ape 0.05 into the doge one",
  "dump half of the pizza token",
  "track the freshest gem",
  "what can you do?",
];

export function AgentCommandBar({
  tokens,
  onAction,
}: {
  tokens: TrackedToken[];
  onAction?: (a: AgentAction) => void;
}) {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const submit = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput("");
    try {
      const result = await runAgentCommand({
        data: {
          prompt: text,
          tokens: tokens.slice(0, 30).map((t) => ({
            id: t.contract,
            name: t.name,
            ticker: t.ticker,
            contract: t.contract,
            bucket: t.bucket,
            tags: t.tags,
          })),
        },
      });
      setLog((prev) =>
        [{ id: Date.now(), command: text, result, ts: Date.now() }, ...prev].slice(0, 8),
      );
      onAction?.(result);
    } catch (e) {
      const err: AgentAction = {
        ok: false,
        intent: "unknown",
        message: e instanceof Error ? e.message : "Agent failed.",
      };
      setLog((prev) =>
        [{ id: Date.now(), command: text, result: err, ts: Date.now() }, ...prev].slice(0, 8),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-border bg-card/40">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2 text-[11px] font-data uppercase tracking-wider">
          <Sparkles size={12} className="text-primary" />
          <span>Agent · AI (Gemini 2.5 Flash)</span>
          <span className="text-[color:var(--text-faint)] hidden sm:inline">— natural-language trading</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-[10px] font-data text-[color:var(--text-dim)] hover:text-foreground"
        >
          {open ? "HIDE" : "SHOW"}
        </button>
      </div>

      {open && (
        <div className="p-4 space-y-3">
          {/* input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit(input);
            }}
            className="flex items-center gap-2 border border-border bg-background px-3 py-2 focus-within:border-primary transition-colors"
          >
            <Terminal size={14} className="text-[color:var(--text-dim)] shrink-0" />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder='e.g. "ape 0.05 into the doge one" · ⌘K to focus'
              className="flex-1 bg-transparent outline-none text-[13px] font-data placeholder:text-[color:var(--text-faint)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="grid place-items-center h-7 w-7 bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
              aria-label="Run command"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <ArrowUp size={12} />}
            </button>
          </form>

          {/* quick prompts */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => void submit(p)}
                disabled={busy}
                className="text-[10px] font-data px-2 py-1 border border-border hover:bg-secondary transition-colors text-[color:var(--text-dim)] hover:text-foreground disabled:opacity-40"
              >
                {p}
              </button>
            ))}
          </div>

          {/* log */}
          {log.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-border max-h-[300px] overflow-y-auto">
              {log.map((entry) => (
                <div key={entry.id} className="text-[11px] font-data leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-[color:var(--text-faint)] shrink-0">›</span>
                    <span className="text-[color:var(--text-dim)] flex-1 break-all">{entry.command}</span>
                    <button
                      onClick={() => setLog((p) => p.filter((e) => e.id !== entry.id))}
                      className="text-[color:var(--text-faint)] hover:text-foreground shrink-0"
                      aria-label="Dismiss"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <div className={`pl-4 ${entry.result.ok ? "text-emerald-400" : "text-rose-400"}`}>
                    {entry.result.ok ? "✓" : "✗"} {entry.result.message}
                  </div>
                  {entry.result.resolvedTokenLabel && (
                    <div className="pl-4 text-[10px] text-primary/90">
                      → {entry.result.resolvedTokenLabel}
                    </div>
                  )}
                  {entry.result.reasoning && (
                    <div className="pl-4 text-[10px] text-[color:var(--text-faint)] italic">
                      {entry.result.reasoning}
                    </div>
                  )}
                  {entry.result.details && (
                    <div className="pl-4 mt-0.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-[color:var(--text-faint)]">
                      {Object.entries(entry.result.details).map(([k, v]) => (
                        <div key={k}>
                          <span className="uppercase">{k}:</span> <span className="text-[color:var(--text-dim)]">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="text-[9px] font-data text-[color:var(--text-faint)] uppercase tracking-wider pt-1 border-t border-border">
            ⚠ Mock environment — no real transactions are executed.
          </div>
        </div>
      )}
    </div>
  );
}
