import { createFileRoute, Link } from "@tanstack/react-router";
import { Topbar } from "@/components/cc/layout/Topbar";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CultureCast — Built for Four.meme AI Sprint" },
      { name: "description", content: "Why CultureCast exists: bridging internet culture signals with Four.meme launches. The pitch, the team, the vision." },
      { property: "og:title", content: "About CultureCast" },
      { property: "og:description", content: "Cultural intelligence layer for Four.meme — first tool to detect tokenable culture before launch." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground cc-page-enter">
      <Topbar />
      <main>
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-16 md:py-24">
          <div className="text-[10px] uppercase tracking-[0.4em] text-primary font-data mb-6">
            Pitch · Four.meme AI Sprint 2026
          </div>
          <h1 className="font-display font-bold text-[44px] md:text-[72px] leading-[0.95] tracking-tight mb-10">
            Every analysis tool waits<br />
            <span className="text-[color:var(--text-dim)]">until after launch.</span>
          </h1>
          <p className="text-[18px] md:text-[20px] leading-relaxed text-foreground mb-6">
            CultureCast is the only tool that works <span className="text-primary">before</span> — detecting which internet moments are about to become tokens, and giving creators the full launch kit to capture that window.
          </p>
          <p className="text-[15px] leading-relaxed text-[color:var(--text-dim)] mb-16">
            Then, for tokens already live, our Decision Engine gives traders a clear verdict: buy, wait, or avoid. Two phases. One platform. Full lifecycle coverage.
          </p>

          <Section title="Innovation">
            Cultural intelligence layer — the first tool to bridge internet culture signals with Four.meme launches. We treat culture as a leading indicator, not noise.
          </Section>

          <Section title="Technical depth">
            Multi-source data pipeline (Google Trends + Reddit + CryptoPanic + CoinGecko + BscScan) feeding a Claude reasoning layer. Real BSC contract analysis through a server function. No mocks in the critical path.
          </Section>

          <Section title="Practical value">
            Replaces hours of manual research with a 10-second AI verdict. Every output is a card a trader can act on or share.
          </Section>

          <Section title="Community virality">
            Every meme content output is shareable. Every decision card mentions Four.meme. Growth is built into the product surface, not bolted on.
          </Section>

          <Section title="Why BNB Chain & Four.meme">
            Four.meme is where meme tokens are born today. Building the cultural radar there means the signal-to-launch loop is the shortest in crypto.
          </Section>

          <div className="mt-20 border-t border-border pt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/drift"
              className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-[12px] uppercase tracking-widest font-data font-semibold hover:opacity-90 transition-opacity"
            >
              See it live <ArrowRight size={14} />
            </Link>
            <Link
              to="/docs"
              className="flex items-center gap-2 px-5 py-3 border border-border hover:border-primary text-[12px] uppercase tracking-widest font-data font-semibold transition-colors"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-8 mt-8">
      <div className="text-[10px] uppercase tracking-[0.3em] text-primary font-data mb-3">{title}</div>
      <p className="text-[15px] leading-relaxed">{children}</p>
    </div>
  );
}
