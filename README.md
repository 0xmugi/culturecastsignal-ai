# CultureCast

> Cast the culture. Catch the alpha.

Cultural intelligence for **Four.meme on BNB Chain**. CultureCast detects
tokenizable internet culture *before* it launches, gives any live token a
defensible AI verdict in ~10 seconds, and bundles the whole research →
decision → action workflow on a single browser-first surface.

Built for the **Four.meme AI Sprint 2026**.

---

## Surfaces

| Route       | Name      | What it does                                                                                          |
|-------------|-----------|-------------------------------------------------------------------------------------------------------|
| `/`         | Landing   | Marketing hero, two-system pitch, how-it-works.                                                       |
| `/drift`    | **Drift** | Pre-launch radar. Live cultural feed scored 0–100 with status pills, source attribution, AI Launch Kit. |
| `/cast`     | **Cast**  | Post-launch verdict. Paste any BNB Chain contract → BUY · WAIT · AVOID with risk, phase, red/green flags. |
| `/tracked`  | Tracked   | Live Four.meme watchlist auto-bucketed into **Safe to Ape**, **Medium Risk**, **Gem** + AI command-bar agent. |
| `/settings` | Settings  | BYOK — wallet-scoped API key management for BscScan, OpenAI, Gemini, Anthropic.                        |
| `/docs`     | Docs      | Full product docs with sidebar TOC, search, and scrollspy.                                            |
| `/pricing`  | Pricing   | Free / Pro / Elite tiers + USDT on BNB Chain payment.                                                 |
| `/changelog`| Changelog | Every release shipped, in reverse chronological order.                                                |
| `/about`    | About     | Why we built this.                                                                                    |

> **Naming history:** Drift was previously `Radar` and Cast was previously
> `Decide`. Old internal identifiers may still reference the legacy names —
> all user-facing routes and labels are now **Drift** and **Cast**.

---

## The two-system architecture

CultureCast covers the full meme-token lifecycle in two complementary engines.

### 1. Drift — pre-launch radar
Pulls Reddit, DexScreener, GeckoTerminal, four.meme, and CoinGecko on a short
loop. Clusters and dedupes signals by topic fingerprint and scores each one
0–100 on cultural momentum. HOT / RISING / NEW / COOLING pills make the feed
scannable in seconds. The detail panel includes an **AI Launch Kit** (names,
ticker, tagline, audience, ready-to-post Twitter/Telegram copy) and an Elite
launch wizard that posts directly to Four.meme.

### 2. Cast — post-launch verdict
Paste any BNB Chain contract address. In ~10 seconds Cast pulls live holders
and 24h transfers from BscScan (with GeckoTerminal as fallback), runs
multi-AI reasoning (OpenAI, Gemini, Anthropic), and returns a typed verdict:
`BUY` · `WAIT` · `AVOID` with confidence, risk score, phase, and explicit
red/green flags. Every metric carries a per-field **provenance badge** so
you can audit which source contributed which number. Results are cached for
5 minutes per `provider:address` pair.

### 3. Tracked — live watchlist + AI agent
Auto-bucketed live Four.meme tokens, refreshed every few minutes:

- **Safe to Ape** — liquidity ≥ $80k · top-10 holders ≤ 35% · culture score ≥ 70
- **Medium Risk** — anything that doesn't qualify for Safe or Gem
- **Gem** — fresh (<12h) · MC < $100k · liquidity ≥ $2k

Underneath sits an **AI command bar** powered by Gemini 2.5 Flash that turns
natural prompts into typed intents:

```
ape 0.05 into the doge one
buy 0.1 bnb 0xabc123…
dump half of pizza
swap 50 USDT to BNB
track 0xdef456…
```

Trade intents are mocked in this release; routing is on the roadmap.

---

## Data sources

| Source         | Surface         | Auth      |
|----------------|-----------------|-----------|
| Reddit         | Drift           | Public    |
| DexScreener    | Drift / Tracked | Public    |
| GeckoTerminal  | Drift / Cast / Tracked | Public |
| Four.meme      | Drift / Tracked | On-chain  |
| CoinGecko      | Drift           | Public    |
| BscScan        | Cast (top-10 holders) | BYOK |
| OpenAI         | Cast            | Shared or BYOK |
| Google Gemini  | Cast / Agent    | Shared (AI Gateway) or BYOK |
| Anthropic      | Cast (Pro/Elite)| BYOK      |

---

## Tech stack

- **Framework:** TanStack Start v1 (React 19, Vite 7, file-based routing, SSR)
- **Wallet:** RainbowKit + Wagmi (BNB Chain)
- **Backend:** Supabase + edge server functions
- **AI:**  AI Gateway (Gemini 2.5 Flash default) + per-provider BYOK
- **Styling:** Tailwind v4 with semantic tokens in `src/styles.css`
- **State / data:** TanStack Query, localStorage (BYOK keys, cache, last-used provider)
- **Animation:** Framer Motion + custom CSS

---

## Project layout

```
src/
├── routes/                      # File-based TanStack routes
│   ├── __root.tsx
│   ├── index.tsx                # /
│   ├── drift/index.tsx          # /drift
│   ├── cast/index.tsx           # /cast
│   ├── tracked/index.tsx        # /tracked
│   ├── settings.tsx
│   ├── docs/                    # /docs/*
│   └── ...
├── components/
│   └── cc/
│       ├── layout/              # Sidebar, Topbar, MobileTabBar, ConnectWallet, …
│       ├── drift/               # SignalCard, SignalDetail, RadarSweep, RadarFilters, LaunchOnFourMemeModal
│       ├── cast/                # DecideHero, DecideAiSidebar, DecideEnrichmentBlock, …
│       ├── tracked/             # TrackedTokenCard, AgentCommandBar
│       ├── docs/                # DocsSidebar, DocPageShell
│       └── shared/              # ScrambleText, etc.
├── lib/                         # Server functions, caches, scoring, plan, BYOK keys
└── integrations/supabase/       # Auto-generated client + types
```

> Internal component names (e.g. `RadarSweep`, `DecideHero`) preserve their
> historical identifiers for stability. Folders mirror the new product names.

---

## Local development

```bash
bun install
bun run dev
```

The router auto-generates `src/routeTree.gen.ts` from files in `src/routes/`.
Do **not** edit it by hand.

---

## Promo assets

A `remotion-promo/` workspace renders a 60-second product walkthrough with
an ElevenLabs voiceover. See `remotion-promo/README.md` for instructions.

---

## License

Built for the Four.meme AI Sprint 2026. All rights reserved.
