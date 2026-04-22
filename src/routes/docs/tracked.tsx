import { createFileRoute } from "@tanstack/react-router";
import {
  DocPageShell,
  DocSection,
  Steps,
  Callout,
  DataTable,
  CodeBlock,
} from "@/components/cc/docs/DocPageShell";

export const Route = createFileRoute("/docs/tracked")({
  head: () => ({
    meta: [
      { title: "Tracked & AI Agent — CultureCast Docs" },
      {
        name: "description",
        content:
          "Live Four.meme watchlist auto-bucketed into Safe to Ape, Medium Risk, and Gem — plus an AI agent that parses natural prompts into trades.",
      },
      { property: "og:title", content: "Tracked & AI Agent · CultureCast Docs" },
      {
        property: "og:description",
        content:
          "Auto-bucketed Four.meme tokens (Safe to Ape · Medium Risk · Gem) and a Gemini-powered command bar for buys, sells, swaps, and tracking.",
      },
    ],
  }),
  component: Page,
});

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "buckets", label: "Risk buckets" },
  { id: "data", label: "Live data sources" },
  { id: "agent", label: "AI Agent commands" },
  { id: "examples", label: "Example prompts" },
];

function Page() {
  return (
    <DocPageShell
      tag="04"
      category="Product"
      title="Tracked & AI Agent."
      intro="Tracked is a live, auto-categorized watchlist of Four.meme tokens, fused with an AI command bar so you can act on a token without leaving the page. Buckets refresh every few minutes from on-chain data and free public APIs."
      toc={TOC}
      prev={{ to: "/docs/cast", label: "Cast — Token Verdict" }}
      next={{ to: "/docs/scoring", label: "Scoring System" }}
    >
      <DocSection id="overview" title="Overview">
        <p>
          The page pulls trending Four.meme tokens, enriches each one with
          price, liquidity, market cap, and 24-hour change from GeckoTerminal,
          then drops them into one of three risk buckets. A search bar and
          per-bucket filter chips let you triage quickly; clicking{" "}
          <strong>Cast</strong> on any card deep-links to{" "}
          <code className="text-foreground">/cast?addr=0x...</code> for a full
          AI verdict.
        </p>
      </DocSection>

      <DocSection id="buckets" title="Risk buckets">
        <DataTable
          headers={["Bucket", "Criteria", "Use it for"]}
          rows={[
            [
              "Safe to Ape",
              "Liquidity ≥ $80k · Top 10 holders ≤ 35% · culture score ≥ 70",
              "Larger size, lower drawdown risk",
            ],
            [
              "Medium Risk",
              "Anything that doesn't qualify for Safe or Gem",
              "Standard meme exposure with full DD",
            ],
            [
              "Gem",
              "Fresh (<12h) · MC < $100k · liquidity ≥ $2k",
              "High-asymmetry early plays",
            ],
          ]}
        />
        <Callout kind="warn">
          Buckets are heuristics, not financial advice. Always cross-check
          liquidity locks and ownership renouncement before sizing in.
        </Callout>
      </DocSection>

      <DocSection id="data" title="Live data sources">
        <p>
          The list is composed by combining a Four.meme trending feed with
          per-token enrichment from GeckoTerminal. When a source is rate-limited
          or returns no data the page falls back to the most recent cached
          snapshot and surfaces a small "fallback" badge so you know it's not
          fresh.
        </p>
        <DataTable
          headers={["Source", "Used for", "Notes"]}
          rows={[
            ["Four.meme", "Trending tokens, age, contract", "On-chain index"],
            ["GeckoTerminal", "Price, liquidity, MC, 24h change", "Free public API"],
            ["BscScan (BYOK)", "Top 10 holders concentration", "Optional — set in Settings"],
          ]}
        />
      </DocSection>

      <DocSection id="agent" title="AI Agent commands">
        <p>
          The command bar uses Gemini 2.5 Flash with a structured tool call
          to convert a natural prompt into one of four typed intents. Output
          is logged to the on-page history so you can replay or audit the
          last eight actions. Press <kbd>⌘</kbd>+<kbd>K</kbd> to focus the
          input from anywhere on the page.
        </p>
        <DataTable
          headers={["Intent", "What it does", "Required fields"]}
          rows={[
            ["buy", "Mocked buy with BNB amount", "amount + token reference (CA or alias)"],
            ["sell", "Mocked sell as a percentage", "percent + token reference"],
            ["swap", "Mocked token-to-token swap", "amount + from + to"],
            ["track", "Adds a CA to the watchlist", "contract address"],
          ]}
        />
        <CodeBlock
          language="ts"
          lines={[
            "type AgentIntent =",
            '  | { kind: "buy";   amountBnb: number; addr: string }',
            '  | { kind: "sell";  percent: number;   addr: string }',
            '  | { kind: "swap";  amount: number; from: string; to: string }',
            '  | { kind: "track"; addr: string };',
          ]}
        />
        <Callout kind="note">
          All trade intents are <strong>mocked</strong> in this release —
          they do not broadcast a transaction. Wiring the agent to a real
          router is on the roadmap.
        </Callout>
      </DocSection>

      <DocSection id="examples" title="Example prompts">
        <Steps
          items={[
            "ape 0.05 into the doge one",
            "buy 0.1 bnb 0xabc123…",
            "dump half of pizza",
            "swap 50 USDT to BNB",
            "track 0xdef456…",
          ]}
        />
      </DocSection>
    </DocPageShell>
  );
}
