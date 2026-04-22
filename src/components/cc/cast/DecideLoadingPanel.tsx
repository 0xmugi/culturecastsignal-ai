import { useEffect, useState } from "react";
import { Check } from "lucide-react";

export function DecideLoadingPanel({ addr }: { addr: string }) {
  const steps = [
    "Contract validated",
    "Fetching on-chain data",
    "Analyzing token metadata",
    "Running AI decision engine",
  ];
  const [reached, setReached] = useState(0);
  useEffect(() => {
    const ids = steps.map((_, i) => window.setTimeout(() => setReached(i + 1), 300 + i * 350));
    return () => ids.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative mt-12 border border-border bg-surface p-6 overflow-hidden cc-fade-up">
      <div className="cc-scan-line" />
      <div className="font-data text-[12px] text-[color:var(--text-dim)] uppercase tracking-widest mb-4">
        Contract
      </div>
      <div className="font-data text-[13px] break-all mb-6 text-foreground">{addr}</div>

      <div className="flex flex-col gap-2">
        {steps.map((s, i) => {
          const done = i < reached - 1;
          const active = i === reached - 1;
          return (
            <div key={s} className="flex items-center gap-3 text-[13px] font-data">
              <span className="w-4 inline-block">
                {done ? <Check size={13} className="text-primary" /> : active ? "⟳" : "·"}
              </span>
              <span style={{ color: done || active ? "var(--foreground)" : "var(--text-faint)" }}>
                {s}{active ? <span className="cc-dots"><span>.</span><span>.</span><span>.</span></span> : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
