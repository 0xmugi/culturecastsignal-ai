import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DocPageShell,
  DocSection,
  DataTable,
  Callout,
  Steps,
  Kbd,
} from "@/components/cc/docs/DocPageShell";

export const Route = createFileRoute("/docs/pricing")({
  head: () => ({
    meta: [
      { title: "Plans & Payment — CultureCast Docs" },
      {
        name: "description",
        content:
          "Free, Pro, and Elite plans for CultureCast — what's included, what's gated, and how to pay with USDT on BNB Chain.",
      },
      { property: "og:title", content: "Plans & Payment · CultureCast Docs" },
      {
        property: "og:description",
        content: "Crypto-first pricing for CultureCast. USDT on BNB Chain today, Stripe coming soon.",
      },
    ],
  }),
  component: Page,
});

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "tiers", label: "Plan tiers" },
  { id: "byok", label: "Free + BYOK" },
  { id: "payment", label: "How to pay" },
  { id: "activation", label: "Activation" },
];

function Page() {
  return (
    <DocPageShell
      tag="07"
      category="Reference"
      title="Plans & Payment."
      intro="CultureCast runs on three tiers — Free, Pro, and Elite. The Free plan is the full app with Bring-Your-Own-Keys; paid tiers add managed keys, multi-AI selection, and the in-app Four.meme launch wizard. Pay with USDT on BNB Chain today, or wait for Stripe."
      toc={TOC}
      prev={{ to: "/docs/faq", label: "FAQ" }}
    >
      <DocSection id="overview" title="Overview">
        <p>
          Pricing is intentionally simple. The Free plan is not a trial — it is
          the complete product, gated only on convenience features. Bring your
          own API keys (BscScan + OpenAI / Gemini / Anthropic) and you have
          unlimited analyses with zero quota concerns. Upgrade when you want to
          stop managing keys, pick your AI per run, or launch tokens directly
          on Four.meme from inside the app.
        </p>
        <p>
          Visit <Link to="/pricing" className="text-primary hover:underline">/pricing</Link>{" "}
          to see the full comparison and start a payment flow.
        </p>
      </DocSection>

      <DocSection id="tiers" title="Plan tiers">
        <DataTable
          headers={["Feature", "Free", "Pro ($19/mo)", "Elite ($79/mo)"]}
          rows={[
            ["Drift feed", "Full", "Full + live refresh", "Full + live refresh"],
            ["Cast engine", "Random AI per run", "Pick OpenAI / Gemini / Anthropic", "Pick + priority quota"],
            ["Cast cache (5-min TTL)", "✓", "✓", "✓"],
            ["Bring Your Own Keys", "✓", "Optional", "Optional"],
            ["Managed shared keys", "Rate-limited", "Higher limits", "10,000 / mo"],
            ["Save & export Drift (CSV)", "—", "✓", "✓"],
            ["Email alerts on HOT signals", "—", "✓", "✓"],
            ["AI Launch Kit (logo, copy, audience)", "—", "—", "✓"],
            ["Launch on Four.meme (in-app wizard)", "—", "—", "✓"],
            ["Priority support", "Community", "Email", "Direct"],
          ]}
        />
        <Callout kind="tip">
          Power users who don't need the launch wizard often stay on Free with
          their own keys forever. That is by design.
        </Callout>
      </DocSection>

      <DocSection id="byok" title="Free + Bring Your Own Keys">
        <p>
          The Free plan removes every rate limit when you connect a wallet and
          paste your own keys in <Kbd>Settings</Kbd>. Keys live in your browser
          (<code className="text-foreground">localStorage</code>), scoped to
          your wallet address — they are never sent to our servers, only
          forwarded as headers to the upstream provider per request.
        </p>
        <DataTable
          headers={["Provider", "Used for", "Where to get a key"]}
          rows={[
            ["BscScan", "On-chain holders, transfers, contract age", "bscscan.com/myapikey"],
            ["OpenAI", "Cast reasoning (GPT-4o / 5)", "platform.openai.com"],
            ["Google Gemini", "Cast reasoning (Flash / Pro)", "aistudio.google.com"],
            ["Anthropic Claude", "Cast reasoning (Sonnet)", "console.anthropic.com"],
          ]}
        />
      </DocSection>

      <DocSection id="payment" title="How to pay">
        <p>
          CultureCast accepts <strong>USDT on BNB Chain (BEP-20)</strong> today.
          Stripe (cards & Apple Pay) is on the roadmap and shows as{" "}
          <em>Coming soon</em> in the purchase modal — it is intentionally
          unclickable until the integration ships.
        </p>
        <Steps
          items={[
            "Open /pricing and click Purchase on Pro or Elite.",
            "In the modal, choose Pay with USDT (Stripe is disabled until launch).",
            "Review the on-chain transaction breakdown — network, token, contract, recipient, amount, fee.",
            "Click Confirm & sign in wallet — the app simulates a two-step approve + transfer flow on the USDT BEP-20 contract.",
            "Wait for one BNB Chain confirmation (~3 seconds). Your plan is auto-activated and a tx hash + BscScan link is shown.",
          ]}
        />
        <Callout kind="warn">
          BEP-20 only. Sending USDT from another chain (ERC-20, TRC-20, Solana
          SPL) will result in lost funds — there is no way to recover
          cross-chain mistakes. Always confirm the network before sending.
        </Callout>
        <Callout kind="note">
          The hackathon MVP runs the on-chain flow as a realistic simulation so
          the UX of approve → transfer → confirm → activate is fully wired. The
          v1 release swaps the simulated handler for a real wagmi{" "}
          <code className="text-foreground">writeContract</code> call against
          the USDT BEP-20 contract — the modal, copy, and activation logic stay
          identical.
        </Callout>
      </DocSection>

      <DocSection id="activation" title="Activation & cancellation">
        <p>
          Plan activation is automatic. The moment the BNB Chain transaction
          reaches one confirmation, the wizard writes your plan + 30-day expiry
          to <Kbd>localStorage</Kbd> and the rest of the app reacts instantly
          (the sidebar plan badge, the Cast AI dropdown, and the Four.meme
          launch button all flip without a refresh).
        </p>
        <p>
          To cancel, simply do nothing — plans are not auto-charged (each month
          requires a fresh USDT transfer). When Stripe ships, the card flow
          will support one-click cancellation from Settings with no refund
          needed because access continues to the end of the paid period.
        </p>
      </DocSection>
    </DocPageShell>
  );
}
