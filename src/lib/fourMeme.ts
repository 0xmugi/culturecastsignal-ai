// Minimal Four.meme on-chain integration.
// Uses TokenManagerHelper3 (single tx token creation on BSC mainnet).
// Reference: API-Documents.03-03-2026 + TokenManagerHelper3.abi (user-provided).
//
// NOTE: Four.meme's exact createToken signature varies by helper version.
// We implement the most common pattern: createToken(name, symbol, metadata)
// with a fixed BNB launch fee. User must have ≥0.01 BNB on BSC.

import { bsc } from "wagmi/chains";

// TokenManagerHelper3 contract on BSC mainnet (per Four.meme API docs).
export const TOKEN_MANAGER_HELPER_ADDRESS =
  "0xF251F83e40a78868FcfA3FA4599Dad6494E46034" as const;

// Default launch fee (BNB). Real fee may be returned by `tryCreateToken` view —
// we use a safe upper bound as msg.value; protocol refunds excess.
export const DEFAULT_LAUNCH_FEE_BNB = "0.01"; // ~$5

// Minimal ABI — covers the createToken entry point we need.
// Full ABI lives at user upload TokenManagerHelper3.abi but we only need this fragment.
export const TOKEN_MANAGER_HELPER_ABI = [
  {
    type: "function",
    name: "createToken",
    stateMutability: "payable",
    inputs: [
      {
        name: "args",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "shortName", type: "string" },
          { name: "desc", type: "string" },
          { name: "imgUrl", type: "string" },
          { name: "launchTime", type: "uint256" },
          { name: "preSale", type: "uint256" },
          { name: "label", type: "string" },
          { name: "webUrl", type: "string" },
          { name: "twitterUrl", type: "string" },
          { name: "telegramUrl", type: "string" },
        ],
      },
    ],
    outputs: [{ name: "tokenAddress", type: "address" }],
  },
] as const;

export interface LaunchTokenArgs {
  name: string;
  symbol: string; // shortName, max 10 chars
  description: string;
  imageUrl?: string;
  preSale?: string; // BNB amount for initial buy, e.g. "0.05"
  webUrl?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  label?: string; // category tag
}

export const FOUR_MEME_CHAIN_ID = bsc.id;
