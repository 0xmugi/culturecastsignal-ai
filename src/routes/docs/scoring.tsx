import { createFileRoute } from "@tanstack/react-router";
import { DocPageShell, DocSection, DataTable, Callout, CodeBlock } from "@/components/cc/docs/DocPageShell";

export const Route = createFileRoute("/docs/scoring")({
  head: () => ({
    meta: [
      { title: "Scoring System — CultureCast Docs" },
      {
        name: "description",
        content: "How CultureCast computes the 0–100 cultural signal score from velocity, diversity, and momentum.",
      },
      { property: "og:title", content: "Scoring System · CultureCast Docs" },
      { property: "og:description", content: "Inputs, weights, and bands behind the cultural score." },
    ],
  }),
  component: Page,
});

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "inputs", label: "Inputs" },
  { id: "bands", label: "Score bands" },
  { id: "decay", label: "Decay & freshness" },
];

function Page() {
  return (
    <DocPageShell
      tag="04"
      category="Concept"
      title="Scoring System."
      intro="Every signal in Drift receives a 0–100 score that combines velocity, source diversity, and pre-mainstream strength. The score is intentionally simple to read, but the underlying inputs are weighted to favor early, multi-source culture over single-platform spikes."
      toc={TOC}
      prev={{ to: "/docs/cast", label: "Token Verdict" }}
      next={{ to: "/docs/api", label: "API Reference" }}
    >
      <DocSection id="overview" title="Overview">
        <p>
          The score is a weighted blend of three families of inputs. Each input
          is normalized to a 0–1 scale before weighting so a viral Reddit post
          and a steady search trend can be compared on the same axis.
        </p>
        <CodeBlock
          language="ts"
          lines={[
            "// Pseudocode: final score in 0..100",
            "const score = Math.round(",
            "  100 * (",
            "    0.45 * velocity +",
            "    0.30 * diversity +",
            "    0.25 * preMainstream",
            "  )",
            ");",
          ]}
        />
      </DocSection>

      <DocSection id="inputs" title="Inputs and weights">
        <p>
          Velocity dominates the score because acceleration is the strongest
          predictor of imminent breakout. Diversity acts as a quality filter
          and pre-mainstream rewards signals that have not yet been picked up
          by major outlets.
        </p>
        <DataTable
          headers={["Family", "Inputs", "Weight"]}
          rows={[
            ["Velocity", "Search delta, mention delta, post rate", "45%"],
            ["Diversity", "Unique sources, unique communities", "30%"],
            ["Pre-mainstream", "News absence, niche-to-broad ratio", "25%"],
          ]}
        />
      </DocSection>

      <DocSection id="bands" title="Score bands">
        <p>
          Bands turn a continuous score into a glanceable status pill. The
          thresholds were tuned against six months of historical signals — the
          goal is to keep HOT rare enough to mean something, and NEW broad
          enough to surface genuinely early movers.
        </p>
        <DataTable
          headers={["Range", "Pill", "Meaning"]}
          rows={[
            ["80–100", "HOT", "Act fast, window is narrow"],
            ["60–79", "RISING", "Strong momentum, room to run"],
            ["40–59", "NEW", "Early, watch closely"],
            ["0–39", "WEAK", "Culture is fading or noise"],
          ]}
        />
      </DocSection>

      <DocSection id="decay" title="Decay & freshness">
        <p>
          Scores decay over time when fresh evidence stops arriving. A 24-hour
          rolling window prevents stale virality from inflating the feed and
          keeps Drift focused on signals you can still act on.
        </p>
        <CodeBlock
          language="ts"
          lines={[
            "// Hourly decay applied between refreshes",
            "function decay(score: number, hoursSinceLastEvidence: number) {",
            "  const k = score >= 80 ? 0.08 : 0.04; // HOT decays 2x faster",
            "  return score * Math.exp(-k * hoursSinceLastEvidence);",
            "}",
          ]}
        />
        <Callout kind="note">
          Decay is non-linear — HOT signals fall faster than RISING signals so
          the top of the feed always reflects current attention, not yesterday's.
        </Callout>
      </DocSection>
    </DocPageShell>
  );
}
