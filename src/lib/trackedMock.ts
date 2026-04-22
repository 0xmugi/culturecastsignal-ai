// Mock data for the Tracked page — Four.meme inspired token list.
// All numbers are fabricated for the demo. Replace with real Four.meme API later.

export type Bucket = "safe" | "medium" | "gem";

export interface TrackedToken {
  id: string;
  name: string;
  ticker: string;
  contract: string;
  bucket: Bucket;
  logo?: string; // emoji fallback
  // market data
  marketCap: number; // USD
  liquidity: number; // USD
  volume24h: number; // USD
  change24h: number; // %
  // health
  holders: number;
  top10Pct: number; // 0-100
  ageHours: number;
  // signals
  cultureScore: number; // 0-100
  fourMemeUrl: string;
  // narrative tags
  tags: string[];
}

export const MOCK_TRACKED: TrackedToken[] = [
  // ---------- SAFE TO APE ----------
  {
    id: "t1",
    name: "Doge Boss",
    ticker: "DBOSS",
    contract: "0x9a8b...c421",
    bucket: "safe",
    logo: "🐕",
    marketCap: 2_840_000,
    liquidity: 184_200,
    volume24h: 612_400,
    change24h: 38.6,
    holders: 1842,
    top10Pct: 24.1,
    ageHours: 18,
    cultureScore: 94,
    fourMemeUrl: "https://four.meme/token/0x9a8b",
    tags: ["meme", "doge-arc", "viral"],
  },
  {
    id: "t2",
    name: "Pizza Ninja",
    ticker: "PZNJ",
    contract: "0x44ee...8812",
    bucket: "safe",
    logo: "🍕",
    marketCap: 1_220_000,
    liquidity: 96_400,
    volume24h: 318_900,
    change24h: 22.4,
    holders: 940,
    top10Pct: 28.7,
    ageHours: 9,
    cultureScore: 87,
    fourMemeUrl: "https://four.meme/token/0x44ee",
    tags: ["food", "tiktok", "rising"],
  },
  // ---------- MEDIUM RISK ----------
  {
    id: "t3",
    name: "Sad Hamster",
    ticker: "SADHM",
    contract: "0x7711...aabb",
    bucket: "medium",
    logo: "🐹",
    marketCap: 412_000,
    liquidity: 38_200,
    volume24h: 121_400,
    change24h: -8.1,
    holders: 612,
    top10Pct: 41.3,
    ageHours: 32,
    cultureScore: 78,
    fourMemeUrl: "https://four.meme/token/0x7711",
    tags: ["meme", "reddit", "cooling"],
  },
  {
    id: "t4",
    name: "Banana Cat",
    ticker: "BNCT",
    contract: "0x2233...ff09",
    bucket: "medium",
    logo: "🍌",
    marketCap: 198_000,
    liquidity: 22_800,
    volume24h: 64_300,
    change24h: 12.9,
    holders: 318,
    top10Pct: 47.2,
    ageHours: 6,
    cultureScore: 65,
    fourMemeUrl: "https://four.meme/token/0x2233",
    tags: ["cat", "tiktok"],
  },
  // ---------- GEM ----------
  {
    id: "t5",
    name: "Astro Frog",
    ticker: "AFROG",
    contract: "0xdead...beef",
    bucket: "gem",
    logo: "🐸",
    marketCap: 48_200,
    liquidity: 9_400,
    volume24h: 18_900,
    change24h: 184.2,
    holders: 92,
    top10Pct: 58.4,
    ageHours: 2,
    cultureScore: 71,
    fourMemeUrl: "https://four.meme/token/0xdead",
    tags: ["fresh", "low-cap", "stealth"],
  },
  {
    id: "t6",
    name: "Lazy Capybara",
    ticker: "LZCAP",
    contract: "0xc0de...1234",
    bucket: "gem",
    logo: "🦫",
    marketCap: 31_800,
    liquidity: 6_100,
    volume24h: 12_400,
    change24h: 92.1,
    holders: 64,
    top10Pct: 62.8,
    ageHours: 4,
    cultureScore: 68,
    fourMemeUrl: "https://four.meme/token/0xc0de",
    tags: ["fresh", "meme"],
  },
];

export const BUCKET_META: Record<Bucket, {
  label: string;
  short: string;
  desc: string;
  color: string; // tailwind text class
  bg: string;    // tailwind bg class
  border: string;
  glyph: string;
}> = {
  safe: {
    label: "Safe to Ape",
    short: "SAFE",
    desc: "Strong liquidity, healthy holder spread, momentum confirmed.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    glyph: "✓",
  },
  medium: {
    label: "Medium Risk",
    short: "MED",
    desc: "Promising signal but concentration or volatility flagged.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    glyph: "≈",
  },
  gem: {
    label: "Gem (Early)",
    short: "GEM",
    desc: "Low cap, high upside, high risk. Verify before you ape.",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/30",
    glyph: "◆",
  },
};

// ------- Mock agent parser -------

export interface AgentResult {
  ok: boolean;
  intent: "buy" | "sell" | "swap" | "track" | "help" | "unknown";
  message: string;
  details?: Record<string, string>;
}

export function parseAgentCommand(raw: string): AgentResult {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return { ok: false, intent: "unknown", message: "Type a command. Try: buy 0.1 bnb 0xCONTRACT" };
  if (cmd === "help" || cmd === "/help") {
    return {
      ok: true,
      intent: "help",
      message: "Commands: buy <amount> bnb <ca> · sell <pct>% <ca> · swap <amount> <from> to <to> · track <ca>",
    };
  }
  // buy 0.1 bnb 0x...
  const buy = cmd.match(/^buy\s+(\d*\.?\d+)\s*bnb\s+(0x[a-f0-9]{4,})/);
  if (buy) {
    return {
      ok: true,
      intent: "buy",
      message: `Buying ${buy[1]} BNB of ${shortAddr(buy[2])} via Four.meme router…`,
      details: { amount: `${buy[1]} BNB`, contract: shortAddr(buy[2]), slippage: "5%", route: "Four.meme → PancakeSwap V3" },
    };
  }
  // sell 50% 0x...
  const sell = cmd.match(/^sell\s+(\d+)%\s+(0x[a-f0-9]{4,})/);
  if (sell) {
    return {
      ok: true,
      intent: "sell",
      message: `Selling ${sell[1]}% of ${shortAddr(sell[2])} for BNB…`,
      details: { amount: `${sell[1]}%`, contract: shortAddr(sell[2]), slippage: "5%" },
    };
  }
  // swap 1 bnb to 0x...
  const swap = cmd.match(/^swap\s+(\d*\.?\d+)\s+(\w+)\s+to\s+(0x[a-f0-9]{4,}|\w+)/);
  if (swap) {
    return {
      ok: true,
      intent: "swap",
      message: `Swapping ${swap[1]} ${swap[2].toUpperCase()} → ${swap[3].startsWith("0x") ? shortAddr(swap[3]) : swap[3].toUpperCase()}`,
      details: { from: `${swap[1]} ${swap[2].toUpperCase()}`, to: swap[3], slippage: "5%" },
    };
  }
  // track 0x...
  const track = cmd.match(/^track\s+(0x[a-f0-9]{4,})/);
  if (track) {
    return {
      ok: true,
      intent: "track",
      message: `Tracking ${shortAddr(track[1])} — added to watchlist.`,
      details: { contract: shortAddr(track[1]) },
    };
  }
  return {
    ok: false,
    intent: "unknown",
    message: "Couldn't parse. Try: buy 0.1 bnb 0xCONTRACT · sell 50% 0xCA · swap 1 bnb to 0xCA · track 0xCA · help",
  };
}

function shortAddr(a: string) {
  return a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

export function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}
