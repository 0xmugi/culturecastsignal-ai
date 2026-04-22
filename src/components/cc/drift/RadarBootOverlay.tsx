import { useEffect, useState } from "react";
import { LogoMark } from "@/components/cc/layout/Logo";

/**
 * Boot overlay shown the first time a user lands on /radar.
 * Displays for ~1.6s with: a centered radar mark, a sweeping line, and a
 * sequence of "channels acquired" log lines. Self-dismisses with fade.
 *
 * Persists a "seen" flag in sessionStorage so it never shows twice in a session,
 * but DOES show again on a fresh tab — keeping it feeling like a real boot.
 */
const BOOT_LINES = [
  "INIT · sourcing channels",
  "LINK · reddit / coingecko / dexscreener",
  "LINK · geckoterminal / four.meme",
  "SCAN · cultural perimeter",
  "ACK  · signal lock",
];

const STORAGE_KEY = "cc.radar.boot.seen";

export function RadarBootOverlay() {
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORAGE_KEY) !== "1";
  });
  const [phase, setPhase] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!show) return;
    const tickers: number[] = [];
    BOOT_LINES.forEach((_, i) => {
      tickers.push(window.setTimeout(() => setPhase(i + 1), 220 + i * 220));
    });
    const exit = window.setTimeout(() => setExiting(true), 1500);
    const remove = window.setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setShow(false);
    }, 1900);
    return () => {
      tickers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(exit);
      window.clearTimeout(remove);
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
      style={{
        transition: "opacity 380ms cubic-bezier(0.22, 1, 0.36, 1)",
        opacity: exiting ? 0 : 1,
      }}
    >
      {/* Background grid + sweep */}
      <div className="absolute inset-0 cc-radar-grid opacity-30" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cc-radar-sweep" style={{ opacity: 0.5 }} />

      <div className="relative z-10 flex flex-col items-center gap-7 max-w-md w-full px-8">
        <div className="cc-logo-spin-in">
          <LogoMark size={56} animated />
        </div>

        <div className="text-center">
          <div className="font-display font-bold text-[24px] tracking-tight cc-fade-up">
            Tuning the perimeter.
          </div>
          <div className="text-[10px] uppercase tracking-[0.4em] font-data text-[color:var(--text-dim)] mt-2 cc-fade-up" style={{ animationDelay: "120ms" }}>
            CultureCast · Drift v2
          </div>
        </div>

        <div className="w-full max-w-xs flex flex-col gap-1.5">
          {BOOT_LINES.map((line, i) => {
            const visible = i < phase;
            const isLast = i === phase - 1;
            return (
              <div
                key={line}
                className="flex items-center gap-2 text-[10.5px] font-data uppercase tracking-widest"
                style={{
                  color: visible ? "var(--foreground)" : "var(--text-faint)",
                  opacity: visible ? 1 : 0.35,
                  transition: "all 240ms ease-out",
                }}
              >
                <span style={{ color: visible ? "var(--primary)" : "var(--text-faint)" }}>
                  {visible ? (isLast ? "▸" : "✓") : "·"}
                </span>
                <span>{line}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
