import { useEffect, useRef, useState } from "react";

/**
 * Cultural-noise text decoder.
 *
 * Renders the target text as a stream of random characters that gradually
 * resolve into the real characters from left to right. Designed to feel like
 * a signal being decoded by a terminal — every character spends some time
 * scrambling before it locks in.
 *
 * - Spaces and newlines are preserved untouched (they won't scramble).
 * - Cycle speed and resolve speed are independent for fine control.
 * - Honors `prefers-reduced-motion` automatically.
 */
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*+=<>?/";

export function useScramble(
  target: string,
  opts: {
    /** Total ms to fully resolve. Defaults to 800. */
    duration?: number;
    /** ms between scramble frames. Lower = faster jitter. Defaults to 35. */
    tick?: number;
    /** Delay before scrambling starts, in ms. */
    delay?: number;
    /** Re-trigger key. Change to replay the animation. */
    trigger?: unknown;
  } = {},
): string {
  const { duration = 800, tick = 35, delay = 0, trigger } = opts;
  const [out, setOut] = useState(() => target);
  const startedRef = useRef(false);

  useEffect(() => {
    // Respect reduced motion
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !target) {
      setOut(target);
      return;
    }
    startedRef.current = false;
    setOut(scramble(target, target.length));
    const startTimer = window.setTimeout(() => {
      startedRef.current = true;
      const start = performance.now();
      let raf = 0;
      let lastTick = 0;
      const loop = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        // Eased reveal — first chars resolve faster, last chars linger
        const eased = 1 - Math.pow(1 - t, 2);
        const resolved = Math.floor(eased * target.length);
        if (now - lastTick > tick) {
          setOut(scramble(target, resolved));
          lastTick = now;
        }
        if (t < 1) raf = requestAnimationFrame(loop);
        else setOut(target);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }, delay);
    return () => window.clearTimeout(startTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, tick, delay, trigger]);

  return out;
}

function scramble(target: string, resolvedLen: number): string {
  let s = "";
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    if (i < resolvedLen || ch === " " || ch === "\n") {
      s += ch;
    } else {
      s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
    }
  }
  return s;
}
