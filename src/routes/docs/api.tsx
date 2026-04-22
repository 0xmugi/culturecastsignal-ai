import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DocPageShell,
  DocSection,
  CodeBlock,
  DataTable,
  Callout,
  Kbd,
} from "@/components/cc/docs/DocPageShell";

export const Route = createFileRoute("/docs/api")({
  head: () => ({
    meta: [
      { title: "API Reference — CultureCast Docs" },
      {
        name: "description",
        content:
          "Bring Your Own Keys, supported AI providers, on-chain data sources, and rate limits for CultureCast.",
      },
      { property: "og:title", content: "API Reference · CultureCast Docs" },
      {
        property: "og:description",
        content:
          "Wire your own BscScan + OpenAI / Gemini / Anthropic keys for unlimited usage and provider control.",
      },
    ],
  }),
  component: Page,
});

const TOC = [
  { id: "byok", label: "Bring Your Own Keys" },
  { id: "providers", label: "AI providers" },
  { id: "storage", label: "Key storage" },
  { id: "sources", label: "On-chain sources" },
  { id: "limits", label: "Rate limits" },
];

function Page() {
  return (
    <DocPageShell
      tag="05"
      category="API"
      title="API Reference."
      intro="CultureCast ships with shared API keys for demos, but they have rate limits and the AI provider is randomized per run on Free. Connect a wallet and supply your own keys for unlimited use and full provider control. Keys never leave your browser — they are forwarded per-request as headers."
      toc={TOC}
      prev={{ to: "/docs/scoring", label: "Scoring System" }}
      next={{ to: "/docs/faq", label: "FAQ" }}
    >
      <DocSection id="byok" title="Bring Your Own Keys">
        <p>
          After connecting your wallet, open <Kbd>Settings</Kbd> and paste any
          of: <Kbd>BscScan</Kbd>, <Kbd>OpenAI</Kbd>, <Kbd>Google Gemini</Kbd>,
          or <Kbd>Anthropic</Kbd>. The app immediately starts routing requests
          through your keys — no restart needed.
        </p>
        <Callout kind="tip">
          You only need the keys for the surfaces you use. BscScan unlimited =
          Cast + Drift enrich. Add an AI key to pick that provider in the
          Cast dropdown. Add Anthropic specifically to unlock Claude (it is
          BYOK-only — no shared key).
        </Callout>
      </DocSection>

      <DocSection id="providers" title="AI providers">
        <DataTable
          headers={["Provider", "Default model", "Shared key", "BYOK"]}
          rows={[
            ["OpenAI", "gpt-4o-mini", "Yes (rate-limited)", "Unlimited"],
            ["Google Gemini", "gemini-2.5-flash", "Yes (rate-limited)", "Unlimited"],
            ["Anthropic Claude", "claude-sonnet", "No — BYOK only", "Required"],
          ]}
        />
        <Callout kind="note">
          Anthropic is intentionally BYOK-only because Claude pricing is
          higher than the other providers. The Cast dropdown shows a small
          "Add Claude key" hint when Anthropic is unavailable.
        </Callout>
      </DocSection>

      <DocSection id="storage" title="Key storage">
        <p>
          Keys are stored in <Kbd>localStorage</Kbd> scoped to the connected
          wallet address. They are never persisted to our servers — they are
          included as headers on outbound requests to the upstream API only.
        </p>
        <CodeBlock
          language="ts"
          lines={[
            "// Storage shape (per wallet)",
            "localStorage[`cc:apikeys:${wallet.toLowerCase()}`] = {",
            '  bscscan:   "YOUR_BSCSCAN_KEY",',
            '  openai:    "sk-...",',
            '  gemini:    "AIza...",',
            '  anthropic: "sk-ant-...",',
            "};",
          ]}
        />
      </DocSection>

      <DocSection id="sources" title="On-chain & data sources">
        <DataTable
          headers={["Provider", "Used for", "Status"]}
          rows={[
            ["BscScan", "Holders, transfers, contract age, token meta", "Primary"],
            ["GeckoTerminal", "Pool data, holders, age (BscScan fallback)", "Fallback"],
            ["DexScreener", "Trending pairs, volume spikes", "Bundled (Drift)"],
            ["four.meme", "Newly launched tokens index", "Bundled (Drift)"],
            ["CoinGecko", "Market context, trending tokens", "Bundled (Drift)"],
            ["Reddit", "Subreddit chatter & meme detection", "Bundled (Drift)"],
            ["Groq", "AI Launch Kit copy + audience analysis", "Bundled (Elite)"],
          ]}
        />
      </DocSection>

      <DocSection id="limits" title="Rate limits">
        <DataTable
          headers={["Tier", "Limit", "Notes"]}
          rows={[
            ["BscScan (shared)", "5 req / sec", "Free tier"],
            ["BscScan (your key)", "Up to 100k / day", "BYOK"],
            ["OpenAI / Gemini (shared)", "10 req / min", "Demo cap, randomized provider"],
            ["OpenAI / Gemini (your key)", "Provider limit", "BYOK + you pick the provider"],
            ["Anthropic (your key)", "Provider limit", "BYOK only"],
            ["Cast cache", "5-min TTL per provider:address", "Local, no server hit"],
          ]}
        />
        <Callout kind="note">
          See <Link to="/docs/pricing" className="text-primary hover:underline">Plans &amp; Payment</Link>{" "}
          for hosted tiers if you'd rather not manage keys yourself.
        </Callout>
      </DocSection>
    </DocPageShell>
  );
}
