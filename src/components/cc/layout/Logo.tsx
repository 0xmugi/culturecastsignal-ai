/**
 * CultureCast logo mark.
 *
 * Concept: a radar dish made from two concentric arcs (the two C's of CultureCast),
 * with a single off-center signal "blip" that pulses — representing the moment a
 * cultural signal is detected before anyone else sees it. The negative space inside
 * the arcs reads as "C" twice, giving us a CC monogram that doubles as a sonar.
 *
 * Renders crisp at 16x16 (favicon) up to 256x256 (marketing) with the same SVG.
 */
interface LogoMarkProps {
  size?: number;
  /** When true, the blip will pulse via CSS animation. */
  animated?: boolean;
  className?: string;
  /** Color of the arcs/dish. Defaults to currentColor. */
  color?: string;
  /** Color of the signal blip. Defaults to var(--primary). */
  accent?: string;
}

export function LogoMark({
  size = 24,
  animated = true,
  className,
  color = "currentColor",
  accent = "var(--primary)",
}: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="CultureCast"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer arc — opens to the upper right (signal direction) */}
      <path
        d="M 5 22 A 12 12 0 1 1 22 5"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="square"
      />
      {/* Inner arc — same opening, smaller radius */}
      <path
        d="M 9 20 A 7 7 0 1 1 20 9"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="square"
      />
      {/* Signal blip — sits at the apex of the radar opening */}
      <circle
        cx="24"
        cy="8"
        r="2.4"
        fill={accent}
        className={animated ? "cc-logo-blip" : undefined}
      />
    </svg>
  );
}

/**
 * Full lockup: mark + wordmark.
 */
export function LogoLockup({
  size = 30,
  className,
  showWordmark = true,
}: {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={["inline-flex items-center gap-2.5", className].filter(Boolean).join(" ")}>
      <LogoMark size={size} />
      {showWordmark && (
        <span className="font-display font-bold tracking-tight" style={{ fontSize: size * 0.5 }}>
          CultureCast
        </span>
      )}
    </span>
  );
}
