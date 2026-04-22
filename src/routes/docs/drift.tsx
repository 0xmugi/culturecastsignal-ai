import { createFileRoute } from "@tanstack/react-router";
import {
  DocPageShell,
  DocSection,
  Steps,
  Callout,
  DataTable,
  CodeBlock,
} from "@/components/cc/docs/DocPageShell";

export const Route = createFileRoute("/docs/drift")({
  head: () => ({
    meta: [
      { title: "Drift Dashboard — CultureCast Docs" },
      {
        name: "description",
        content:
          "How the Drift feed surfaces cultural signals from Reddit, DexScreener, GeckoTerminal, four.meme, and CoinGecko before they tokenize on BNB Chain.",
      },
      { property: "og:title", content: "Drift Dashboard · CultureCast Docs" },
      {
        property: "og:description",
        content:
          "Live cultural feed scored 0–100 with status pills, multi-source attribution, and one-click Analyze handoff to Cast.",
      },
    ],
  }),
  component: Page,
});

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "sources", label: "Data sources" },
  { id: "feed", label: "The feed" },
  { id: "status", label: "Status pills" },
  { id: "analyze", label: "Analyze handoff" },
  { id: "launch-kit", label: "AI Launch Kit" },
  { id: "filters", label: "Filters & search" },
  { id: "workflow", label: "Workflow" },
];

function Page() {
  return (
    <DocPageShell
      tag="02"
      category="Product"
      title="Drift Dashboard."
      intro="Drift is the live cultural feed. Each card represents a meme, token, or trend with a 0–100 score, source attribution, and momentum read. Use it to spot tokenizable culture before it hits mainstream — then jump to Cast or Launch in one click."
      toc={TOC}
      prev={{ to: "/docs/getting-started", label: "Getting Started" }}
      next={{ to: "/docs/cast", label: "Token Verdict" }}
    >
      <DocSection id="overview" title="Overview">
        <p>
          Drift continuously aggregates signals from Reddit, DexScreener,
          GeckoTerminal, four.meme, and CoinGecko, then scores each cluster on
          a 0–100 scale. Higher scores mean stronger pre-mainstream momentum
          and more diverse source coverage. Results are cached for short
          windows to stay snappy without burning provider quota.
        </p>
        <p>
          The feed refreshes every few minutes. Cards are deduplicated by
          topic fingerprint so a meme spreading across multiple subreddits and
          DEX pools appears once with merged source attribution rather than
          duplicates that drown out other signals. Drift is read-only and
          does not require a wallet — connect only to personalize filters,
          save lists, or supply your own keys for unlimited refreshes.
        </p>
      </DocSection>

      <DocSection id="sources" title="Data sources">
        <p>
          Every signal cites at least one of the following sources. The icon
          row on each card shows exactly which platforms contributed.
        </p>
        <DataTable
          headers={["Source", "Used for", "Notes"]}
          rows={[
            ["Reddit", "Subreddit chatter & meme detection", "Free public API"],
            ["DexScreener", "Trending pairs, volume spikes (BNB)", "Free public API"],
            ["GeckoTerminal", "Pool data, holders, age (fallback)", "Free public API"],
            ["four.meme", "Newly launched meme tokens on BNB", "On-chain index"],
            ["CoinGecko", "Market context, trending tokens", "Free public API"],
          ]}
        />
      </DocSection>

      <DocSection id="feed" title="The feed">
        <p>
          Cards are sorted by recency-weighted score. Each card shows the
          topic, contributing sources, a momentum sparkline, status pill, and
          two quick actions: <strong>Analyze</strong> (jump to Cast with the
          contract pre-filled) and <strong>Launch</strong> (Elite — open the
          Four.meme wizard with the AI Launch Kit pre-filled).
        </p>
        <DataTable
          headers={["Element", "What it means"]}
          rows={[
            ["Topic", "Short canonical label for the cultural cluster"],
            ["Sources", "Icons of every platform contributing evidence"],
            ["Sparkline", "Score trajectory over the last 24 hours"],
            ["Status pill", "HOT / RISING / NEW / COOLING band"],
            ["Score", "Normalized 0–100 cultural momentum score"],
            ["Analyze", "Quick handoff to /cast?addr=0x... (no detail open)"],
          ]}
        />
        <Callout kind="note">
          Click anywhere else on the card to open the detail panel with full
          AI reasoning, source breakdown, and the launch kit.
        </Callout>
      </DocSection>

      <DocSection id="status" title="Status pills">
        <p>
          Each card carries one status pill so you can scan the feed in
          seconds and triage by urgency. Pills map directly to score bands.
        </p>
        <DataTable
          headers={["Pill", "Score range", "Meaning"]}
          rows={[
            ["HOT", "80–100", "Act fast — window is narrow"],
            ["RISING", "60–79", "Strong momentum, room to run"],
            ["NEW", "40–59", "Early — watch closely"],
            ["COOLING", "0–39", "Culture is fading or noise"],
          ]}
        />
        <Callout kind="tip">
          HOT signals decay faster than RISING signals. If a card has been HOT
          for more than 12 hours, treat it as RISING — the easy upside is gone.
        </Callout>
      </DocSection>

      <DocSection id="analyze" title="Analyze handoff to Cast">
        <p>
          Every card with an associated contract address shows a small{" "}
          <strong>⚡ Analyze</strong> button next to the score. Clicking it
          navigates to <code className="text-foreground">/cast?addr=0x...</code>{" "}
          and auto-runs the analysis using your last-used AI provider. This is
          the fastest path from "I see culture" to "I have a verdict."
        </p>
        <Callout kind="note">
          Auto-run only fires for signals navigated from Drift (deep-link with
          <code className="text-foreground">?addr=</code>). On a normal page
          refresh, Cast pre-fills the address but waits for you to press
          Analyze — so a refresh never burns AI quota.
        </Callout>
      </DocSection>

      <DocSection id="launch-kit" title="AI Launch Kit (Elite)">
        <p>
          Each detail panel includes an AI-generated launch kit powered by
          Groq: candidate token names, tickers, taglines, target audience, and
          meme-ready copy for Twitter and Telegram. Elite users can also
          generate a logo with Gemini Nano Banana or upload one from disk
          (auto-converted to base64 for Four.meme).
        </p>
        <CodeBlock
          language="ts"
          lines={[
            "type LaunchKit = {",
            "  names: string[];      // 3-5 candidate names",
            "  ticker: string;       // matched 3-5 char symbol",
            "  tagline: string;      // one-line pitch",
            "  audience: string;     // target community",
            "  twitter: string;      // 240-char post draft",
            "  telegram: string;     // pinned message draft",
            "  logoDataUri?: string; // base64 PNG (uploaded or AI-gen)",
            "};",
          ]}
        />
        <Callout kind="warn">
          Names and tickers are AI suggestions, not trademark checks. Always
          run an independent search before committing to a brand.
        </Callout>
      </DocSection>

      <DocSection id="filters" title="Filters & search">
        <p>
          Use the filter bar above the feed to narrow by status pill (HOT,
          RISING, NEW), source (Reddit-only, DexScreener-only, etc.), or
          minimum score. Filters are URL-stateful — share a filtered view by
          copying the URL.
        </p>
      </DocSection>

      <DocSection id="workflow" title="Recommended workflow">
        <p>
          The fastest way to extract value from Drift is to make it part of a
          short daily ritual rather than a passive feed.
        </p>
        <Steps
          items={[
            "Scan Drift daily for HOT and RISING signals in your verticals.",
            "Click ⚡ Analyze on the strongest card to jump straight to Cast.",
            "Read the verdict + on-chain provenance badges (BscScan / GeckoTerminal).",
            "If positive — open the detail panel and (Elite) launch on Four.meme directly.",
          ]}
        />
      </DocSection>
    </DocPageShell>
  );
}
