import { createFileRoute, Link } from "@tanstack/react-router";
import { Topbar } from "@/components/cc/layout/Topbar";
import { DocsSidebar } from "@/components/cc/docs/DocsSidebar";
import {
  ArrowRight,
  Radar,
  Brain,
  Bookmark,
  Rocket,
  Code2,
  HelpCircle,
  Zap,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/docs/")({
  head: () => ({
    meta: [
      { title: "Docs — CultureCast" },
      {
        name: "description",
        content:
          "Documentation for CultureCast: Drift, Cast, scoring, API reference, and FAQ.",
      },
      { property: "og:title", content: "CultureCast Docs" },
      {
        property: "og:description",
        content: "Professional documentation for CultureCast on BNB Chain.",
      },
    ],
  }),
  component: DocsPage,
});

interface QuickCard {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
}

const QUICK: QuickCard[] = [
  {
    icon: Rocket,
    title: "Getting Started",
    description: "Connect your wallet and run your first verdict in two minutes.",
    to: "/docs/getting-started",
  },
  {
    icon: Radar,
    title: "Drift — Pre-launch Radar",
    description: "Live cultural feed scored 0–100 with status pills.",
    to: "/docs/drift",
  },
  {
    icon: Brain,
    title: "Cast — Token Verdict",
    description: "Paste a contract — get a 10-second BUY · WAIT · AVOID verdict.",
    to: "/docs/cast",
  },
  {
    icon: Bookmark,
    title: "Tracked & AI Agent",
    description: "Auto-bucketed Four.meme watchlist + Gemini-powered command bar.",
    to: "/docs/tracked",
  },
  {
    icon: Zap,
    title: "Scoring System",
    description: "How velocity, source diversity, and momentum drive the score.",
    to: "/docs/scoring",
  },
  {
    icon: Code2,
    title: "API Reference",
    description: "Bring-your-own-key setup, data sources, and rate limits.",
    to: "/docs/api",
  },
  {
    icon: HelpCircle,
    title: "FAQ",
    description: "Chains supported, wallet safety, AI providers, exports.",
    to: "/docs/faq",
  },
  {
    icon: Tag,
    title: "Plans & Payment",
    description: "Free / Pro / Elite, USDT on BNB Chain, Stripe coming soon.",
    to: "/docs/pricing",
  },
];

function DocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground cc-page-enter flex">
      <DocsSidebar />

      <div className="flex-1 min-w-0">
        <Topbar />

        <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-20">
          <div className="font-data text-[10px] uppercase tracking-[0.4em] text-primary mb-5">
            CultureCast
          </div>
          <h1 className="font-display font-bold text-[40px] md:text-[60px] leading-[0.98] tracking-tight mb-5">
            Documentation, integration guides,
            <br />
            and protocol reference.
          </h1>
          <p className="text-[15px] md:text-[16px] text-[color:var(--text-dim)] leading-relaxed max-w-2xl mb-14">
            CultureCast surfaces tokenizable culture before it hits mainstream.
            These docs cover everything from connecting a wallet to interpreting
            verdicts, scoring math, and bringing your own API keys.
          </p>

          <div className="mb-12">
            <h2 className="font-display font-bold text-[22px] tracking-tight mb-2">
              Welcome to CultureCast.
            </h2>
            <p className="text-[14px] text-[color:var(--text-dim)] leading-relaxed max-w-2xl">
              Pick a topic below or use the sidebar to jump straight to a
              section. Each page opens with a concise overview, followed by
              detail sections you can deep-link to.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-px bg-border border border-border">
            {QUICK.map((q, i) => (
              <Link
                key={q.to}
                to={q.to}
                className="group bg-background p-6 hover:bg-surface/40 transition-colors flex flex-col"
                style={{ ["--i" as never]: i }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 flex items-center justify-center border border-border bg-surface text-primary group-hover:border-primary transition-colors">
                    <q.icon size={16} strokeWidth={1.5} />
                  </div>
                  <ArrowRight
                    size={14}
                    className="text-[color:var(--text-faint)] group-hover:text-primary group-hover:translate-x-1 transition-all"
                  />
                </div>
                <h3 className="font-display font-bold text-[17px] tracking-tight mb-1.5 text-foreground group-hover:text-primary transition-colors">
                  {q.title}
                </h3>
                <p className="text-[12.5px] text-[color:var(--text-dim)] leading-relaxed">
                  {q.description}
                </p>
              </Link>
            ))}
          </div>

          <footer className="mt-16 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-[11px] font-data uppercase tracking-widest text-[color:var(--text-dim)]">
            <span>CultureCast · Docs</span>
            <div className="flex items-center gap-5">
              <Link to="/changelog" className="hover:text-primary transition-colors">
                Changelog
              </Link>
              <Link to="/pricing" className="hover:text-primary transition-colors">
                Pricing
              </Link>
              <Link to="/about" className="hover:text-primary transition-colors">
                About
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
