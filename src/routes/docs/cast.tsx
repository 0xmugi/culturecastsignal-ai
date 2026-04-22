import { createFileRoute } from "@tanstack/react-router";
import {
  DocPageShell,
  DocSection,
  Steps,
  CodeBlock,
  Callout,
  DataTable,
  Kbd,
} from "@/components/cc/docs/DocPageShell";

export const Route = createFileRoute("/docs/cast")({
  head: () => ({
    meta: [
      { title: "Token Verdict — CultureCast Docs" },
      {
        name: "description",
        content:
          "Paste a BNB Chain contract and get a multi-AI verdict in seconds, backed by live BscScan + GeckoTerminal on-chain data.",
      },
      { property: "og:title", content: "Token Verdict · CultureCast Docs" },
      {
        property: "og:description",
        content:
          "BUY · WAIT · AVOID verdicts with confidence, risk, on-chain provenance badges, and a 5-minute result cache.",
      },
    ],
  }),
  component: Page,
});

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "input", label: "Input & persistence" },
  { id: "providers", label: "AI providers" },
  { id: "data", label: "On-chain data" },
  { id: "verdict", label: "Verdict model" },
  { id: "cache", label: "Cache & freshness" },
  { id: "errors", label: "Error states" },
  { id: "workflow", label: "Workflow" },
];

function Page() {
  return (
    <DocPageShell
      tag="03"
      category="Product"
      title="Token Verdict."
      intro="Cast turns any BNB Chain contract into a single, defensible verdict in roughly ten seconds. Live on-chain data is fetched in parallel from BscScan and GeckoTerminal, then your chosen AI (OpenAI, Gemini, or Anthropic) assigns BUY, WAIT, or AVOID with explicit risk, confidence, and red/green flags."
      toc={TOC}
      prev={{ to: "/docs/drift", label: "Drift Dashboard" }}
      next={{ to: "/docs/scoring", label: "Scoring System" }}
    >
      <DocSection id="overview" title="Overview">
        <p>
          Cast is designed for fast, repeatable token triage. The output
          always includes a written rationale, an explicit list of red/green
          flags, and a per-field provenance badge so you can audit which data
          source contributed which metric instead of trusting the label
          blindly.
        </p>
        <p>
          Results are cached locally for 5 minutes per{" "}
          <code className="text-foreground">provider:address</code> pair, so
          re-analyzing the same token is instant and never burns AI quota.
          Use the <strong>Force refresh</strong> button when you need fresh
          on-chain data.
        </p>
      </DocSection>

      <DocSection id="input" title="Input & persistence">
        <p>
          Paste a 42-character BNB Chain contract address (starting with{" "}
          <code className="text-foreground">0x</code>). Address format is
          validated client-side before any API call is made, so typos never
          consume your rate limit. The last-pasted address is saved to{" "}
          <Kbd>localStorage</Kbd> and pre-fills on refresh — but{" "}
          <strong>never auto-runs</strong> on a normal page reload. Auto-run
          only fires when you arrive via a Drift deep-link
          (<code className="text-foreground">/cast?addr=0x...</code>).
        </p>
        <CodeBlock
          language="ts"
          lines={[
            "// Validation regex used by Cast",
            "const BSC_ADDR = /^0x[a-fA-F0-9]{40}$/;",
            "",
            "function isValidAddress(input: string) {",
            "  return BSC_ADDR.test(input.trim());",
            "}",
          ]}
        />
      </DocSection>

      <DocSection id="providers" title="AI providers">
        <p>
          On <strong>Free</strong>, the AI provider is chosen at random from
          OpenAI and Gemini per analysis (Anthropic requires BYOK). On{" "}
          <strong>Pro</strong> and <strong>Elite</strong>, you pick the
          provider per run from the dropdown next to the Analyze button.
          Your last-used provider is remembered locally so it doesn't reset
          between visits.
        </p>
        <DataTable
          headers={["Provider", "Default model", "How to enable"]}
          rows={[
            ["OpenAI", "gpt-4o-mini", "Free (shared) or BYOK"],
            ["Google Gemini", "gemini-2.5-flash", "Free (shared) or BYOK"],
            ["Anthropic Claude", "claude-sonnet", "BYOK only — paste key in Settings"],
          ]}
        />
        <Callout kind="tip">
          The provider dropdown shows a small "Add Claude key" hint when
          Anthropic isn't configured. Click through to Settings to paste
          your key and unlock it.
        </Callout>
      </DocSection>

      <DocSection id="data" title="On-chain data sources">
        <p>
          The verifier collects the snapshot below from BscScan first, with
          GeckoTerminal as a fallback for tokens not yet indexed by BscScan.
          Every metric carries a small badge in the result UI showing which
          source supplied that field — <strong>BscScan</strong>,{" "}
          <strong>GeckoTerminal</strong>, or <strong>no data</strong>.
        </p>
        <CodeBlock
          language="ts"
          lines={[
            "type TokenInfo = {",
            "  holders: number;",
            "  txCount24h: number;",
            "  ageDays: number;",
            "  totalSupply: string;",
            "  fieldSources: {",
            '    holders: "bscscan" | "gecko" | "none";',
            '    txCount24h: "bscscan" | "gecko" | "none";',
            '    ageDays:   "bscscan" | "gecko" | "none";',
            "  };",
            "};",
          ]}
        />
        <Callout kind="note">
          When both BscScan and GeckoTerminal return no data, Cast shows a{" "}
          <strong>"This token may be too new"</strong> banner and recommends
          retrying in a few hours.
        </Callout>
      </DocSection>

      <DocSection id="verdict" title="Verdict model">
        <p>
          The reasoning layer returns a typed verdict. The schema is stable
          across providers so you can build downstream dashboards or alerts
          without breakage. Robust JSON parsing (with auto-repair for
          truncated or unescaped Gemini output) ensures the UI never crashes
          on a malformed AI response — a fallback verdict is shown instead.
        </p>
        <CodeBlock
          language="ts"
          lines={[
            "type Verdict = {",
            '  label: "BUY" | "WAIT" | "AVOID";',
            "  confidence: number;     // 0..1",
            "  riskScore: number;      // 0..100",
            '  phase: "EARLY" | "MID" | "LATE" | "DEAD";',
            "  redFlags: string[];",
            "  greenFlags: string[];",
            "  rationale: string;",
            "};",
          ]}
        />
        <DataTable
          headers={["Label", "When it fires", "Suggested action"]}
          rows={[
            ["BUY", "Risk < 30, confidence > 0.7", "Size in tranches"],
            ["WAIT", "Mixed signals or thin data", "Re-run in 1–6h"],
            ["AVOID", "Red flags or risk > 70", "Skip — log to watchlist"],
          ]}
        />
        <Callout kind="warn">
          Verdicts are research output — never financial advice. Always
          cross-check liquidity locks, ownership renouncement, and audit
          status before acting.
        </Callout>
      </DocSection>

      <DocSection id="cache" title="Cache & freshness">
        <p>
          Cast caches each <code className="text-foreground">provider:address</code>{" "}
          result for 5 minutes in <Kbd>localStorage</Kbd>. The result UI
          displays a "Cached result · Xs old" chip when serving from cache.
          Press <strong>Force refresh</strong> to bypass the cache and re-run
          the full pipeline.
        </p>
      </DocSection>

      <DocSection id="errors" title="Error & fallback states">
        <DataTable
          headers={["State", "Trigger", "What happens"]}
          rows={[
            ["Rate-limited", "Shared key cap hit", "Toast — add your own key in Settings"],
            ["AI parse error", "Truncated / malformed JSON", "Auto-repair, then heuristic fallback"],
            ["No on-chain data", "Token absent from BscScan + Gecko", "'Too new' banner, retry suggestion"],
            ["Invalid address", "Length / hex mismatch", "Inline error, no API call made"],
          ]}
        />
      </DocSection>

      <DocSection id="workflow" title="Workflow">
        <p>
          Aim to spend under a minute per address; if a token deserves more,
          open the explorer and dig from there.
        </p>
        <Steps
          items={[
            "Paste a 0x... contract (42 characters), or arrive via Drift's ⚡ Analyze.",
            "Pick your AI provider (Pro/Elite) or accept the random pick (Free).",
            "Press Analyze. Live data streams in (~10 seconds first run, instant if cached).",
            "Read the verdict, confidence, risk, and per-field provenance badges.",
            "Use Share to copy a result card or Force refresh to re-run.",
          ]}
        />
      </DocSection>
    </DocPageShell>
  );
}
