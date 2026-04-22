import { createFileRoute } from "@tanstack/react-router";
import { DocPageShell, DocSection } from "@/components/cc/docs/DocPageShell";
import type { ReactNode } from "react";

export const Route = createFileRoute("/docs/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — CultureCast Docs" },
      {
        name: "description",
        content:
          "Common questions on CultureCast: chains, AI providers, BYOK, payment, plans, and more.",
      },
      { property: "og:title", content: "FAQ · CultureCast Docs" },
      {
        property: "og:description",
        content: "Quick answers to the most common CultureCast questions.",
      },
    ],
  }),
  component: Page,
});

const TOC = [
  { id: "general", label: "General" },
  { id: "ai", label: "AI providers" },
  { id: "wallet", label: "Wallet & keys" },
  { id: "payment", label: "Plans & payment" },
  { id: "data", label: "Data & exports" },
];

function Page() {
  return (
    <DocPageShell
      tag="06"
      category="Reference"
      title="Frequently Asked."
      intro="Short, direct answers to the questions we get most. If you don't see yours here, the Getting Started guide and API Reference cover deeper detail."
      toc={TOC}
      prev={{ to: "/docs/api", label: "API Reference" }}
      next={{ to: "/docs/pricing", label: "Plans & Payment" }}
    >
      <DocSection id="general" title="General">
        <Faq q="Is this financial advice?">
          No. CultureCast is a research tool. Verdicts reflect on-chain and
          cultural data only. Always do your own research before acting.
        </Faq>
        <Faq q="Which chain do you support?">
          BNB Chain via Four.meme. More chains may follow once the cultural
          pipeline is stable.
        </Faq>
        <Faq q="Do I need an account?">
          No account, no email, no signup. Connect a wallet only when you want
          to personalize the feed, save your own API keys, or launch on
          Four.meme.
        </Faq>
        <Faq q="How accurate are the verdicts?">
          Verdicts are deterministic given the same on-chain snapshot and AI
          provider, but markets are not. Treat the label as a starting point,
          not a guarantee.
        </Faq>
      </DocSection>

      <DocSection id="ai" title="AI providers">
        <Faq q="Which AI does Cast use?">
          On Free, one of OpenAI (gpt-4o-mini) or Gemini (2.5-flash) is chosen
          at random per analysis. On Pro and Elite, you pick from the dropdown
          per run. Anthropic Claude is BYOK-only — paste your key in Settings
          to unlock it.
        </Faq>
        <Faq q="Why is Claude not available on shared keys?">
          Claude pricing is meaningfully higher than OpenAI mini or Gemini
          Flash. Rather than burn community quota on it, we made Anthropic
          BYOK-only. Paste a key in Settings and Claude appears in the
          dropdown immediately.
        </Faq>
        <Faq q="Does Cast remember my last AI provider?">
          Yes. Your last-used provider is saved locally and selected on every
          subsequent visit, so you don't have to re-pick.
        </Faq>
      </DocSection>

      <DocSection id="wallet" title="Wallet & keys">
        <Faq q="Why connect a wallet?">
          To unlock Settings (Bring Your Own Keys), personalize Drift, and
          (Elite) launch tokens on Four.meme. We never request transactions
          unless you explicitly use the launch wizard.
        </Faq>
        <Faq q="Where do my API keys go?">
          Browser <code className="text-foreground">localStorage</code> only,
          scoped per wallet address. They are never persisted on our servers
          — only forwarded per-request as headers to BscScan, OpenAI, Gemini,
          or Anthropic.
        </Faq>
        <Faq q="Can I use Cast without my own keys?">
          Yes. Shared keys cover the demo flow with conservative rate limits
          and a randomized AI provider. Add your own keys when you hit the
          cap or want to pick the provider.
        </Faq>
      </DocSection>

      <DocSection id="payment" title="Plans & payment">
        <Faq q="What does the Free plan include?">
          The full app — Drift, Cast, BYOK, wallet connect. The only gates
          are: random AI provider per Cast run, no in-app Four.meme launch
          wizard, no CSV export.
        </Faq>
        <Faq q="How do I pay for Pro or Elite?">
          Click Purchase on /pricing, choose Pay with USDT in the modal, then
          confirm in your wallet. The app runs an approve → transfer → confirm
          flow against the USDT BEP-20 contract; the moment it reaches one BNB
          Chain confirmation (~3s) your plan auto-activates with a 30-day
          expiry. Stripe (cards, Apple Pay) is shown as Coming soon and is not
          yet clickable.
        </Faq>
        <Faq q="What if I sent USDT from the wrong chain?">
          Cross-chain mistakes (ERC-20, TRC-20, Solana) are unrecoverable.
          Always confirm BEP-20 / BNB Chain before sending. The pricing page
          warns you in red on the deposit step.
        </Faq>
        <Faq q="Can I cancel anytime?">
          Yes. Subscriptions require a fresh USDT payment each month, so
          "cancellation" is just not paying again. Access continues until the
          end of the paid period.
        </Faq>
      </DocSection>

      <DocSection id="data" title="Data & exports">
        <Faq q="Can I export my Drift data?">
          CSV export ships with the Pro plan. Free is read-only.
        </Faq>
        <Faq q="How fresh is the on-chain data?">
          BscScan and GeckoTerminal responses are real-time. Cast caches the
          full verdict for 5 minutes per provider:address pair — press Force
          refresh to bypass the cache.
        </Faq>
        <Faq q="What if BscScan and GeckoTerminal both have no data?">
          Cast shows a "this token may be too new" banner and recommends
          retrying in a few hours, once indexers have caught up.
        </Faq>
        <Faq q="How often does Drift refresh?">
          Roughly every few minutes, throttled by your active API key tier.
          Bring your own key for tighter refresh cadence.
        </Faq>
      </DocSection>
    </DocPageShell>
  );
}

function Faq({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div className="border-b border-border py-5 last:border-0">
      <div className="font-display font-bold text-[16px] mb-2 text-foreground">{q}</div>
      <p className="text-[13.5px] text-[color:var(--text-dim)] leading-relaxed">{children}</p>
    </div>
  );
}
