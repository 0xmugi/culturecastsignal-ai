export type SignalStatus = "HOT" | "RISING" | "NEW" | "COOLING";
export type SignalSource =
  | "reddit"
  | "google"
  | "tiktok"
  | "twitter"
  | "cryptopanic"
  | "coingecko"
  | "bscscan"
  | "trending"
  | "dexscreener"
  | "geckoterminal"
  | "fourmeme";

export interface CollisionRef {
  name: string;
  symbol: string;
  address?: string;
  url: string;
}

export interface Signal {
  id: string;
  name: string;
  score: number;
  status: SignalStatus;
  sources: SignalSource[];
  velocity: string;
  detectedHoursAgo: number;
  launched: boolean;
  ticker?: string;
  contract?: string;
  windowHoursLeft: number;
  fourMemeLive?: boolean;
  fourMemeUrl?: string;
  memeability?: number;
  tickerCollisions?: number;
  /** Conflicting Four.meme launches (excluding self). */
  collisions?: CollisionRef[];
}

export const signals: Signal[] = [
  { id: "1", name: "Skibidi Rizzler", score: 94, status: "HOT", sources: ["reddit", "tiktok", "google"], velocity: "+340% / 24h", detectedHoursAgo: 6, launched: false, windowHoursLeft: 18 },
  { id: "2", name: "Brat Summer 2.0", score: 81, status: "RISING", sources: ["twitter", "google", "tiktok"], velocity: "+180% / 24h", detectedHoursAgo: 12, launched: true, ticker: "BRAT2", contract: "0x7c3bF4A2eD51a9E0bDaF1234567890aBcDeF1234", windowHoursLeft: 36 },
  { id: "3", name: "NPC Mode", score: 77, status: "RISING", sources: ["reddit", "twitter"], velocity: "+142% / 24h", detectedHoursAgo: 9, launched: false, windowHoursLeft: 24 },
  { id: "4", name: "Delulu Era", score: 71, status: "RISING", sources: ["tiktok", "google"], velocity: "+118% / 24h", detectedHoursAgo: 14, launched: false, windowHoursLeft: 30 },
  { id: "5", name: "Brain Rot Cat", score: 63, status: "NEW", sources: ["reddit", "tiktok"], velocity: "+92% / 24h", detectedHoursAgo: 4, launched: false, windowHoursLeft: 48 },
  { id: "6", name: "Sigma Grindset", score: 58, status: "NEW", sources: ["twitter", "reddit"], velocity: "+71% / 24h", detectedHoursAgo: 8, launched: true, ticker: "SIGMA", contract: "0x2aB3cDeF1234567890aBcDeF1234567890aBcDeF", windowHoursLeft: 60 },
  { id: "7", name: "Demure Core", score: 52, status: "NEW", sources: ["tiktok", "twitter"], velocity: "+54% / 24h", detectedHoursAgo: 18, launched: false, windowHoursLeft: 72 },
  { id: "8", name: "Very Mindful", score: 48, status: "COOLING", sources: ["google"], velocity: "-12% / 24h", detectedHoursAgo: 36, launched: false, windowHoursLeft: 12 },
];

export function statusColorVar(status: SignalStatus): string {
  switch (status) {
    case "HOT": return "var(--hot)";
    case "RISING": return "var(--rising)";
    case "NEW": return "var(--info)";
    case "COOLING": return "var(--text-dim)";
  }
}

export function scoreColorVar(score: number): string {
  if (score >= 80) return "var(--hot)";
  if (score >= 60) return "var(--rising)";
  if (score >= 40) return "var(--info)";
  return "var(--text-dim)";
}
