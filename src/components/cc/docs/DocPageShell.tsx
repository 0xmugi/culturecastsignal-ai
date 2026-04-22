import { Link } from "@tanstack/react-router";
import { Topbar } from "@/components/cc/layout/Topbar";
import { DocsSidebar } from "@/components/cc/docs/DocsSidebar";
import { ArrowLeft, ArrowRight, Hash } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export interface TocItem {
  id: string;
  label: string;
}

interface DocPageShellProps {
  tag: string;
  category: string;
  title: string;
  intro: string;
  toc: TocItem[];
  prev?: { to: string; label: string };
  next?: { to: string; label: string };
  children: ReactNode;
}

export function DocPageShell({
  tag,
  category,
  title,
  intro,
  toc,
  prev,
  next,
  children,
}: DocPageShellProps) {
  const [active, setActive] = useState<string>(toc[0]?.id ?? "");

  useEffect(() => {
    if (!toc.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 },
    );
    toc.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [toc]);

  return (
    <div className="min-h-screen bg-background text-foreground cc-page-enter flex">
      <DocsSidebar activeAnchor={active} />

      <div className="flex-1 min-w-0">
        <Topbar />

        <div className="max-w-5xl mx-auto px-6 md:px-12 py-12 md:py-16 grid lg:grid-cols-[1fr_200px] gap-12">
          <article className="min-w-0 max-w-3xl">
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 mb-8 text-[11px] font-data uppercase tracking-widest text-[color:var(--text-dim)] hover:text-primary transition-colors"
          >
            <ArrowLeft size={12} /> Back to Docs
          </Link>

          <div className="flex items-center gap-3 mb-5 font-data text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-faint)]">
            <span>{tag}</span>
            <span className="w-6 h-px bg-border" />
            <span className="text-primary">{category}</span>
          </div>

          <h1 className="font-display font-bold text-[40px] md:text-[56px] leading-[0.98] tracking-tight mb-5">
            {title}
          </h1>
          <p className="text-[15px] md:text-[16px] text-[color:var(--text-dim)] leading-relaxed mb-12 max-w-2xl">
            {intro}
          </p>

          <div className="space-y-14">{children}</div>

          {(prev || next) && (
            <nav className="mt-20 border-t border-border pt-8 grid sm:grid-cols-2 gap-px bg-border">
              {prev ? (
                <Link
                  to={prev.to}
                  className="bg-background p-5 group hover:bg-surface/60 transition-colors"
                >
                  <div className="font-data text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-faint)] mb-2 flex items-center gap-2">
                    <ArrowLeft size={11} /> Previous
                  </div>
                  <div className="font-display font-bold text-[16px] text-foreground group-hover:text-primary transition-colors">
                    {prev.label}
                  </div>
                </Link>
              ) : (
                <div className="bg-background" />
              )}
              {next ? (
                <Link
                  to={next.to}
                  className="bg-background p-5 group hover:bg-surface/60 transition-colors sm:text-right"
                >
                  <div className="font-data text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-faint)] mb-2 flex items-center gap-2 sm:justify-end">
                    Next <ArrowRight size={11} />
                  </div>
                  <div className="font-display font-bold text-[16px] text-foreground group-hover:text-primary transition-colors">
                    {next.label}
                  </div>
                </Link>
              ) : (
                <div className="bg-background" />
              )}
            </nav>
          )}

          <footer className="mt-12 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-[11px] font-data uppercase tracking-widest text-[color:var(--text-dim)]">
            <span>CultureCast · Docs</span>
            <div className="flex items-center gap-5">
              <Link to="/changelog" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Hash size={11} /> Changelog
              </Link>
              <Link to="/pricing" className="hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link to="/about" className="hover:text-primary transition-colors">
                About
              </Link>
            </div>
          </footer>
        </article>

        {toc.length > 0 && (
          <aside className="hidden lg:block sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-faint)] mb-4">
              On this page
            </div>
            <ul className="flex flex-col gap-2 border-l border-border">
              {toc.map((t) => {
                const isActive = active === t.id;
                return (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className="block pl-3 -ml-px border-l-2 text-[12px] py-0.5 transition-colors"
                      style={{
                        borderColor: isActive ? "var(--primary)" : "transparent",
                        color: isActive ? "var(--foreground)" : "var(--text-dim)",
                      }}
                    >
                      {t.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reusable doc primitives ---------------- */

export function DocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display font-bold text-[24px] md:text-[30px] tracking-tight mb-4 text-foreground">
        {title}
      </h2>
      <div className="text-[14px] md:text-[15px] leading-relaxed text-[color:var(--text-dim)] space-y-4">
        {children}
      </div>
    </section>
  );
}

export function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mt-3 flex flex-col gap-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-4 text-[14px]">
          <span className="font-data text-primary tabular-nums shrink-0">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="text-foreground">{it}</span>
        </li>
      ))}
    </ol>
  );
}

export function Callout({ kind = "tip", children }: { kind?: "tip" | "warn" | "note"; children: ReactNode }) {
  const map = {
    tip: { color: "var(--primary)", label: "Tip" },
    warn: { color: "var(--warn)", label: "Warning" },
    note: { color: "var(--info)", label: "Note" },
  } as const;
  const cfg = map[kind];
  return (
    <div
      className="mt-4 border-l-2 pl-4 py-2 text-[13px] text-foreground bg-surface/40"
      style={{ borderColor: cfg.color }}
    >
      <span
        className="font-data text-[10px] uppercase tracking-widest mr-2"
        style={{ color: cfg.color }}
      >
        {cfg.label}
      </span>
      {children}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span className="font-data text-[12px] px-1.5 py-0.5 bg-surface border border-border text-foreground">
      {children}
    </span>
  );
}

export function CodeBlock({ language, lines }: { language: string; lines: string[] }) {
  return (
    <div className="mt-5 border border-border bg-[oklch(0.10_0.005_20)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface">
        <span className="font-data text-[10px] uppercase tracking-widest text-[color:var(--text-faint)]">
          {language}
        </span>
        <button
          onClick={() => navigator.clipboard.writeText(lines.join("\n"))}
          className="font-data text-[10px] uppercase tracking-widest text-[color:var(--text-dim)] hover:text-foreground transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="px-4 py-4 overflow-x-auto">
        <code className="font-data text-[12.5px] leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none w-7 text-[color:var(--text-faint)] tabular-nums shrink-0">
                {i + 1}
              </span>
              <span className="text-foreground whitespace-pre">{line || " "}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

export function DataTable({ rows, headers }: { rows: Array<string[]>; headers?: string[] }) {
  return (
    <div className="mt-5 border border-border">
      {headers && (
        <div
          className="grid gap-4 px-4 py-2 bg-surface font-data text-[10px] uppercase tracking-widest text-[color:var(--text-faint)]"
          style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}
        >
          {headers.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
      )}
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid gap-4 px-4 py-3 items-center"
          style={{
            gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
            borderTop: i === 0 && !headers ? "none" : "1px solid var(--border)",
          }}
        >
          {row.map((cell, j) => (
            <span
              key={j}
              className={
                j === 0
                  ? "font-data text-[12.5px] text-foreground"
                  : j === row.length - 1
                  ? "font-data text-[10px] uppercase tracking-widest text-primary"
                  : "text-[13px] text-[color:var(--text-dim)]"
              }
            >
              {cell}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
