import { createFileRoute, Link } from "@tanstack/react-router";
import { Topbar } from "@/components/cc/layout/Topbar";
import { ArrowRight, GitCommit, Sparkles, Wrench, ShieldCheck, Rocket, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/changelog")({
  head: () => ({
    meta: [
      { title: "Changelog — CultureCast" },
      {
        name: "description",
        content:
          "Release notes for CultureCast: new features, improvements, and fixes shipped to the BNB Chain meme research engine.",
      },
      { property: "og:title", content: "CultureCast Changelog" },
      {
        property: "og:description",
        content: "Every release shipped to CultureCast — from Drift to Cast to BYOK key management.",
      },
    ],
  }),
  component: ChangelogPage,
});

type EntryKind = "feature" | "improvement" | "fix" | "security" | "launch";

interface ChangelogChange {
  kind: EntryKind;
  text: string;
}

interface ChangelogEntry {
  version: string;
  codename?: string;
  date: string; // ISO
  highlight?: string;
  changes: ChangelogChange[];
}

const ENTRIES: ChangelogEntry[] = [
  {
    version: "v0.6.0",
    codename: "Drift / Cast",
    date: "2026-04-22",
    highlight: "Radar is now Drift. Decide is now Cast. New Tracked page + AI Agent command bar.",
    changes: [
      { kind: "feature", text: "Renamed Radar → Drift and Decide → Cast across the entire surface (routes /drift, /cast, /docs/drift, /docs/cast)." },
      { kind: "feature", text: "New /tracked page — live Four.meme tokens auto-bucketed into Safe to Ape · Medium Risk · Gem." },
      { kind: "feature", text: "AI Agent command bar (Gemini 2.5 Flash) parses natural prompts like 'ape 0.05 into the doge one'." },
      { kind: "feature", text: "Cast moved to a sticky right-hand AI sidebar (Reasoning, Green Flags, Red Flags) so the verdict and chart stay side-by-side while scrolling." },
      { kind: "improvement", text: "Refactored components/cc into product folders: drift, cast, tracked, docs, layout, shared." },
      { kind: "improvement", text: "Subtle nudge on Cast: 'Add BscScan key in Settings to unlock Top 10 Holders concentration' when no BscScan key is present." },
      { kind: "improvement", text: "Docs and README updated for the new product names and surfaces." },
    ],
  },
  {
    version: "v0.4.0",
    codename: "BYOK",
    date: "2026-04-19",
    highlight: "Bring Your Own Keys — wallet-scoped API key management for BscScan and Anthropic Claude.",
    changes: [
      { kind: "feature", text: "New /settings page (wallet-gated) to add personal BscScan + Anthropic keys." },
      { kind: "feature", text: "Keys are stored in localStorage scoped to wallet address — never sent to our servers." },
      { kind: "feature", text: "Decide now shows a key-source badge (Shared vs Your key)." },
      { kind: "improvement", text: "Pricing page (Free / Pro / Team) explains the BYOK model up front." },
      { kind: "security", text: "API keys are forwarded per-request as headers, never persisted server-side." },
    ],
  },
  {
    version: "v0.3.0",
    codename: "Marketing",
    date: "2026-04-15",
    highlight: "Dedicated landing page, premium docs, and full marketing surface.",
    changes: [
      { kind: "feature", text: "New landing page at / with hero, features, and clear Launch App CTA." },
      { kind: "feature", text: "Radar moved to /radar — app and marketing are now cleanly separated." },
      { kind: "feature", text: "Premium /docs portal with sidebar TOC, search, scrollspy, and code blocks." },
      { kind: "improvement", text: "Topbar replaces the sidebar on marketing pages for a cleaner first impression." },
      { kind: "improvement", text: "About page rewritten to focus on positioning and team narrative." },
    ],
  },
  {
    version: "v0.2.0",
    codename: "Decide",
    date: "2026-04-08",
    highlight: "AI-powered token decision engine with BUY · WAIT · AVOID verdicts.",
    changes: [
      { kind: "feature", text: "/decide accepts any BNB Chain contract address and returns a structured verdict." },
      { kind: "feature", text: "Live BscScan integration: holders, transfers, and token metadata." },
      { kind: "feature", text: "Animated reasoning UI with typewriter and count-up effects." },
      { kind: "improvement", text: "Shareable result blocks with green/red flag breakdowns." },
    ],
  },
  {
    version: "v0.1.0",
    codename: "Radar",
    date: "2026-03-28",
    highlight: "Initial release — the cultural radar for BNB Chain memes.",
    changes: [
      { kind: "launch", text: "Radar feed with live signal cards, scoring, and detail drawer." },
      { kind: "launch", text: "Wallet connect via RainbowKit + Wagmi (BNB Chain)." },
      { kind: "launch", text: "Mobile tab bar and responsive sidebar navigation." },
      { kind: "launch", text: "Built for the Four.meme AI Sprint hackathon." },
    ],
  },
];

const KIND_META: Record<EntryKind, { label: string; icon: LucideIcon; className: string }> = {
  feature: { label: "New", icon: Sparkles, className: "text-primary border-primary" },
  improvement: { label: "Improved", icon: Zap, className: "text-foreground border-border" },
  fix: { label: "Fixed", icon: Wrench, className: "text-foreground border-border" },
  security: { label: "Security", icon: ShieldCheck, className: "text-primary border-primary" },
  launch: { label: "Launch", icon: Rocket, className: "text-primary border-primary" },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

function ChangelogPage() {
  return (
    <div className="min-h-screen bg-background text-foreground cc-page-enter">
      <Topbar />

      <div className="max-w-4xl mx-auto px-6 md:px-10 py-12 md:py-20">
        <div className="text-[10px] uppercase tracking-[0.4em] text-primary font-data mb-4">Changelog</div>
        <h1 className="font-display font-bold text-[44px] md:text-[64px] leading-[0.95] tracking-tight mb-5">
          Shipped.
        </h1>
        <p className="text-[15px] text-[color:var(--text-dim)] max-w-xl mb-16">
          Every release pushed to CultureCast — features, improvements, and fixes. New entries appear at the top.
        </p>

        <div className="relative">
          {/* timeline rail */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border md:left-[11px]" aria-hidden />

          <div className="flex flex-col gap-14">
            {ENTRIES.map((entry, idx) => (
              <ReleaseBlock key={entry.version} entry={entry} latest={idx === 0} />
            ))}
          </div>
        </div>

        <div className="mt-20 border-t border-border pt-10 flex flex-wrap gap-3">
          <Link
            to="/drift"
            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-[12px] uppercase tracking-widest font-data font-semibold hover:opacity-90 transition-opacity"
          >
            Open Drift <ArrowRight size={14} />
          </Link>
          <Link
            to="/docs"
            className="flex items-center gap-2 px-5 py-3 border border-border hover:border-primary text-[12px] uppercase tracking-widest font-data font-semibold transition-colors"
          >
            Read Docs <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ReleaseBlock({ entry, latest }: { entry: ChangelogEntry; latest: boolean }) {
  return (
    <section className="relative pl-8 md:pl-12">
      {/* node */}
      <div className="absolute left-0 top-1.5 flex items-center justify-center">
        <span
          className={`relative h-[15px] w-[15px] md:h-[23px] md:w-[23px] grid place-items-center border ${
            latest ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-[color:var(--text-dim)]"
          }`}
        >
          <GitCommit size={9} strokeWidth={2} className="md:hidden" />
          <GitCommit size={12} strokeWidth={2} className="hidden md:block" />
          {latest && (
            <span className="absolute inset-0 -z-10 animate-ping bg-primary opacity-20" aria-hidden />
          )}
        </span>
      </div>

      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-4">
        <h2 className="font-display font-bold text-[26px] md:text-[32px] tracking-tight leading-none">
          {entry.version}
        </h2>
        {entry.codename && (
          <span className="font-data text-[10px] uppercase tracking-widest px-1.5 py-0.5 border border-primary text-primary">
            {entry.codename}
          </span>
        )}
        <span className="font-data text-[10px] uppercase tracking-widest text-[color:var(--text-dim)]">
          {formatDate(entry.date)}
        </span>
        {latest && (
          <span className="font-data text-[10px] uppercase tracking-widest text-primary flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary cc-pulse-dot" />
            Latest
          </span>
        )}
      </header>

      {entry.highlight && (
        <p className="text-[14px] text-foreground/90 leading-relaxed mb-5 max-w-2xl">{entry.highlight}</p>
      )}

      <ul className="flex flex-col gap-2.5 border-l border-border pl-5">
        {entry.changes.map((c, i) => {
          const meta = KIND_META[c.kind];
          const Icon = meta.icon;
          return (
            <li key={i} className="flex items-start gap-3 text-[13px] leading-relaxed text-[color:var(--text-dim)]">
              <span
                className={`shrink-0 mt-[3px] inline-flex items-center gap-1 font-data text-[9px] uppercase tracking-widest px-1.5 py-0.5 border ${meta.className}`}
              >
                <Icon size={9} />
                {meta.label}
              </span>
              <span className="text-foreground/85">{c.text}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
