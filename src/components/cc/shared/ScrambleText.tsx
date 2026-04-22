import { useScramble } from "@/hooks/useScramble";
import type { CSSProperties, ReactNode } from "react";

interface Props {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  as?: "span" | "div" | "h1" | "h2" | "h3";
  /** Extra content rendered after the scramble (e.g. a caret). */
  after?: ReactNode;
}

export function ScrambleText({
  text,
  duration = 900,
  delay = 0,
  className,
  style,
  as: Tag = "span",
  after,
}: Props) {
  const out = useScramble(text, { duration, delay });
  return (
    <Tag className={className} style={style}>
      {out}
      {after}
    </Tag>
  );
}
