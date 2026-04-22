import type { CSSProperties } from "react";

/**
 * Decorative radar sweep — a slow rotating cone that fades out, layered behind
 * a faint grid. Drops into any positioned ancestor as `position: absolute; inset: 0`.
 * Pointer-events disabled so it never interferes with content above it.
 */
interface Props {
  className?: string;
  /** Opacity of the whole effect (0–1). Defaults to 0.55. */
  intensity?: number;
  /** When false, sweep is paused (useful when offscreen). */
  active?: boolean;
}

export function RadarSweep({ className, intensity = 0.55, active = true }: Props) {
  const style: CSSProperties = {
    opacity: intensity,
    animationPlayState: active ? "running" : "paused",
  };
  return (
    <div
      aria-hidden
      className={["pointer-events-none absolute inset-0 overflow-hidden", className].filter(Boolean).join(" ")}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 cc-radar-grid" style={{ opacity: 0.5 }} />
      {/* Concentric radar rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cc-radar-rings" style={{ opacity: 0.35 }} />
      {/* The rotating sweep cone */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cc-radar-sweep" style={style} />
      {/* Drifting signal blips */}
      <div className="absolute inset-0 cc-radar-blips" />
    </div>
  );
}
