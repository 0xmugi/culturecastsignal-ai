import { createFileRoute } from "@tanstack/react-router";
import {
  DocPageShell,
  DocSection,
  Steps,
  CodeBlock,
  Callout,
  Kbd,
  DataTable,
} from "@/components/cc/docs/DocPageShell";

export const Route = createFileRoute("/docs/getting-started")({
  head: () => ({
    meta: [
      { title: "Getting Started — CultureCast Docs" },
      {
        name: "description",
        content:
          "Run your first cultural signal scan and on-chain verdict in under two minutes.",
      },
      { property: "og:title", content: "Getting Started · CultureCast Docs" },
      {
        property: "og:description",
        content: "Connect a wallet, open Drift, and validate a token on Cast.",
      },
    ],
  }),
  component: Page,
});

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "quickstart", label: "Quickstart" },
  { id: "byok", label: "Bring Your Own Keys" },
  { id: "local", label: "Run locally" },
  { id: "next", label: "Next steps" },
];

function Page() {
  return (
    <DocPageShell
      tag="01"
      category="Getting Started"
      title="Start with CultureCast."
      intro="CultureCast is a browser-first research surface for BNB Chain. Three products, one workflow: detect culture early on Drift, validate any token contract on Cast, and (Elite) launch directly on Four.meme. No signup required — connect a wallet only when you want to personalize the feed, save your own API keys, or launch."
      toc={TOC}
      next={{ to: "/docs/drift", label: "Drift Dashboard" }}
    >
      <DocSection id="overview" title="What you get">
        <p>
          CultureCast combines off-chain cultural signals (Reddit, four.meme
          activity, CoinGecko trending) with on-chain verification (BscScan +
          GeckoTerminal — holders, transfers, contract age, liquidity) and
          lets a multi-AI reasoning layer (OpenAI, Gemini, or Anthropic) turn
          both into a single, defensible verdict.
        </p>
        <p>
          The default experience uses shared API keys with conservative rate
          limits and a randomly chosen AI provider per analysis. Power users
          connect a wallet and supply their own keys via Settings for unlimited
          usage and provider control.
        </p>
        <DataTable
          headers={["Surface", "What it does", "Wallet?"]}
          rows={[
            ["Drift", "Live multi-source cultural feed (0–100 score)", "Optional"],
            ["Cast", "Per-contract BUY · WAIT · AVOID verdict", "Optional"],
            ["Settings", "Bring Your Own Keys (BscScan + AI provider)", "Required"],
            ["Launch (Elite)", "Create a Four.meme token from any signal", "Required"],
          ]}
        />
      </DocSection>

      <DocSection id="quickstart" title="Quickstart">
        <p>
          The fastest path from zero to a real verdict is four clicks. You can
          do all four without ever signing a transaction or sharing an email.
        </p>
        <Steps
          items={[
            "Open Drift — review the live cultural feed (Reddit, DexScreener, GeckoTerminal, four.meme, CoinGecko).",
            "Click any signal to open its detail panel — review AI reasoning and (Elite) launch kit.",
            "Open Cast and paste a 0x... contract — get a BUY/WAIT/AVOID verdict in ~10 seconds.",
            "Connect a wallet and visit Settings to add your own keys for unlimited usage.",
          ]}
        />
        <Callout kind="tip">
          You can use Drift and Cast without a wallet, but rate limits apply
          and the AI provider is randomized per run. Connect a wallet to lift
          limits via <Kbd>Bring Your Own Keys</Kbd>.
        </Callout>
      </DocSection>

      <DocSection id="byok" title="Bring Your Own Keys (BYOK)">
        <p>
          Once connected, open <Kbd>Settings</Kbd> and paste any combination of
          the keys below. Each unlocks a different surface — you do not need
          all of them.
        </p>
        <DataTable
          headers={["Key", "Unlocks", "Required for"]}
          rows={[
            ["BscScan", "Unlimited on-chain data lookups", "Cast + Drift enrich"],
            ["OpenAI", "GPT-4o/5 verdict reasoning", "Cast (your choice)"],
            ["Google Gemini", "Gemini Flash/Pro verdict reasoning", "Cast (your choice)"],
            ["Anthropic Claude", "Claude Sonnet verdict reasoning", "Cast (your choice)"],
          ]}
        />
        <Callout kind="note">
          Keys are stored in browser <Kbd>localStorage</Kbd>, scoped to your
          wallet address. They are never sent to our servers — only forwarded
          as headers per request to the upstream provider.
        </Callout>
      </DocSection>

      <DocSection id="local" title="Run locally">
        <p>
          The full stack runs on Bun + Vite with TanStack Start. Clone the
          repository, install once, and the dev server hot-reloads on every
          edit.
        </p>
        <CodeBlock
          language="bash"
          lines={[
            "# Install dependencies",
            "bun install",
            "",
            "# Start dev server (http://localhost:5173)",
            "bun run dev",
          ]}
        />
        <Callout kind="note">
          You do not need any environment variables to run the app. BYOK keys
          are entered from the Settings UI and stored in your browser.
        </Callout>
      </DocSection>

      <DocSection id="next" title="Next steps">
        <p>
          Once the app is running, the most useful documents to read next are
          the <strong>Drift Dashboard</strong> guide (how signals are scored
          and surfaced), <strong>Token Verdict</strong> (the Cast verdict
          model with multi-AI selection, on-chain provenance badges, and the
          5-min cache), <strong>Scoring System</strong> (the velocity /
          diversity / pre-mainstream weights behind the 0–100 score), and{" "}
          <strong>Plans &amp; Payment</strong> if you're considering Pro or
          Elite (USDT on BNB Chain, Stripe coming soon).
        </p>
      </DocSection>
    </DocPageShell>
  );
}
