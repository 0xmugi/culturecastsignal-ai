import { createFileRoute, Link } from "@tanstack/react-router";
import { Topbar } from "@/components/cc/layout/Topbar";
import { RadarSweep } from "@/components/cc/drift/RadarSweep";
import { ScrambleText } from "@/components/cc/shared/ScrambleText";
import { useCountUp } from "@/hooks/useCountUp";
import { ArrowRight, Radar, Brain, Activity, Zap, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CultureCast — Cast the culture. Catch the alpha." },
      { name: "description", content: "Cultural intelligence for Four.meme on BNB Chain. Detect tokenable culture before launch and decide BUY · WAIT · AVOID in seconds." },
      { property: "og:title", content: "CultureCast — Cast the culture. Catch the alpha." },
      { property: "og:description", content: "Detect cultural signals before they tokenize. AI verdicts for live tokens. One platform, full lifecycle." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground cc-page-enter">
      <Topbar />

      <main>
        {/* ============= Hero ============= */}
        <section className="relative px-6 md:px-10 pt-20 md:pt-32 pb-24 md:pb-40 overflow-hidden">
          {/* Radar sweep + grid + drifting blips, all behind the content */}
          <RadarSweep intensity={0.4} />
          <div className="cc-hero-glow" />

          <div className="relative max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-[10px] font-data uppercase tracking-[0.4em] text-primary mb-8 cc-fade-up">
              <span className="h-1.5 w-1.5 rounded-full bg-primary cc-pulse-dot" />
              <ScrambleText text="Four.meme AI Sprint · 2026" duration={700} />
            </div>

            <h1 className="font-display font-bold text-[56px] md:text-[140px] leading-[0.9] tracking-tight cc-scramble">
              <span className="block cc-mask-reveal">
                <ScrambleText text="Cast the" duration={700} delay={120} />
              </span>
              <span className="block cc-mask-reveal" style={{ animationDelay: "180ms" }}>
                <ScrambleText text="culture." duration={750} delay={300} />
              </span>
              <span className="block cc-mask-reveal text-primary" style={{ animationDelay: "360ms" }}>
                <ScrambleText text="Catch the alpha." duration={1100} delay={500} />
              </span>
            </h1>

            <p
              className="mt-10 max-w-xl text-[15px] md:text-[18px] text-[color:var(--text-dim)] leading-relaxed cc-fade-up"
              style={{ animationDelay: "900ms" }}
            >
              CultureCast detects internet culture signals with token potential on Four.meme —{" "}
              <span className="text-foreground">before anyone launches them.</span> Then turns existing tokens into a 10-second AI verdict.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-12 cc-fade-up" style={{ animationDelay: "1050ms" }}>
              <Link
                to="/drift"
                className="group flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-[12px] uppercase tracking-widest font-data font-semibold hover:opacity-90 transition-opacity"
              >
                Open Drift
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/cast"
                className="group flex items-center gap-2 px-5 py-3 border border-border hover:border-primary text-[12px] uppercase tracking-widest font-data font-semibold transition-colors"
              >
                Try Cast
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/docs"
                className="text-[11px] uppercase tracking-widest font-data text-[color:var(--text-dim)] hover:text-foreground transition-colors ml-2"
              >
                Read the docs →
              </Link>
            </div>
          </div>
        </section>

        {/* ============= Stats strip ============= */}
        <section className="grid grid-cols-2 md:grid-cols-4 border-y border-border">
          <Stat label="Signals tracked" value={8} />
          <Stat label="Sources" value={5} />
          <Stat label="AI latency" valueText="< 10s" />
          <Stat label="Chain" valueText="BNB" />
        </section>

        {/* ============= Two systems ============= */}
        <section className="px-6 md:px-10 py-24 md:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-data mb-4">
              Two systems · One platform
            </div>
            <h2 className="font-display font-bold text-[36px] md:text-[64px] leading-[0.95] tracking-tight max-w-3xl">
              Before launch. After launch.<br />
              <span className="text-[color:var(--text-dim)]">Full lifecycle coverage.</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-px bg-border mt-14 border border-border">
              <FeatureCard
                icon={Radar}
                tag="01 · Pre-launch"
                title="Drift"
                body="Pulls Reddit, DexScreener, GeckoTerminal, four.meme and CoinGecko. Surfaces cultural signals scored 0–100 with momentum, sources, memeability and an AI launch kit."
                cta="Open Drift"
                to="/drift"
              />
              <FeatureCard
                icon={Brain}
                tag="02 · Post-launch"
                title="Cast"
                body="Paste any BNB Chain contract. Pulls live holders + 24h tx from BscScan. Multi-AI reasoning. Returns BUY · WAIT · AVOID with risk, phase, and red/green flags."
                cta="Try Cast"
                to="/cast"
              />
            </div>
          </div>
        </section>

        {/* ============= How it works ============= */}
        <section className="px-6 md:px-10 py-24 md:py-32 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-data mb-4">How it works</div>
            <h2 className="font-display font-bold text-[36px] md:text-[64px] leading-[0.95] tracking-tight mb-16 max-w-2xl">
              From culture to verdict<br />in three steps.
            </h2>

            <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
              <Step n="01" icon={Activity} title="Drift" body="Multi-source pipeline scans culture and on-chain data continuously." />
              <Step n="02" icon={Zap} title="Reason" body="Multi-AI engine analyzes velocity, distribution, and timing — no fluff, trader voice." />
              <Step n="03" icon={ShieldCheck} title="Cast" body="One verdict. Confidence, risk, phase. Plus a shareable result card." />
            </div>
          </div>
        </section>

        {/* ============= CTA ============= */}
        <section className="relative px-6 md:px-10 py-28 md:py-40 border-t border-border text-center overflow-hidden">
          <RadarSweep intensity={0.25} />
          <div className="relative max-w-4xl mx-auto">
            <h2 className="font-display font-bold text-[44px] md:text-[96px] leading-[0.95] tracking-tight">
              Stop guessing.<br />
              <span className="text-primary">Start casting.</span>
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
              <Link
                to="/drift"
                className="group flex items-center gap-2 px-6 py-4 bg-primary text-primary-foreground text-[12px] uppercase tracking-widest font-data font-semibold hover:opacity-90 transition-opacity"
              >
                Launch CultureCast
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="flex items-center gap-2 px-6 py-4 border border-border hover:border-primary text-[12px] uppercase tracking-widest font-data font-semibold transition-colors"
              >
                Why we built this
              </Link>
            </div>
          </div>
        </section>

        <footer className="px-6 md:px-10 py-8 border-t border-border">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <span className="text-[10px] uppercase tracking-widest font-data text-[color:var(--text-faint)]">
              © CultureCast · Built for Four.meme AI Sprint
            </span>
            <div className="flex items-center gap-5 text-[10px] uppercase tracking-widest font-data text-[color:var(--text-dim)]">
              <Link to="/docs" className="hover:text-foreground">Docs</Link>
              <Link to="/about" className="hover:text-foreground">About</Link>
              <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value, valueText }: { label: string; value?: number; valueText?: string }) {
  const counted = useCountUp(value ?? 0, 1100);
  return (
    <div className="px-6 md:px-10 py-8 border-r border-border last:border-r-0">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-dim)] mb-2">{label}</div>
      <div className="font-data text-[28px] md:text-[36px] tabular-nums">
        {valueText ?? counted}
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  tag,
  title,
  body,
  cta,
  to,
}: {
  icon: typeof Radar;
  tag: string;
  title: string;
  body: string;
  cta: string;
  to: "/drift" | "/cast";
}) {
  return (
    <div className="bg-background p-8 md:p-12 group cc-card-hover relative overflow-hidden">
      <div className="flex items-center justify-between mb-10">
        <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-data">{tag}</div>
        <Icon size={20} className="text-[color:var(--text-dim)] group-hover:text-primary transition-colors" strokeWidth={1.5} />
      </div>
      <h3 className="font-display font-bold text-[44px] md:text-[64px] leading-none tracking-tight mb-6">{title}</h3>
      <p className="text-[14px] leading-relaxed text-[color:var(--text-dim)] max-w-md mb-10">{body}</p>
      <Link
        to={to}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest font-data text-foreground border-b border-primary pb-1 hover:gap-3 transition-all"
      >
        {cta} <ArrowRight size={13} />
      </Link>
    </div>
  );
}

function Step({ n, icon: Icon, title, body }: { n: string; icon: typeof Activity; title: string; body: string }) {
  return (
    <div className="bg-background p-8 md:p-10 cc-card-hover">
      <div className="flex items-center justify-between mb-8">
        <span className="font-data text-[12px] tracking-widest text-[color:var(--text-faint)]">{n}</span>
        <Icon size={18} className="text-primary" strokeWidth={1.5} />
      </div>
      <h4 className="font-display font-bold text-[24px] tracking-tight mb-3">{title}</h4>
      <p className="text-[13px] leading-relaxed text-[color:var(--text-dim)]">{body}</p>
    </div>
  );
}
