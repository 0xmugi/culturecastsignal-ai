// Lovable AI agent for the Tracked page command bar.
// Uses Gemini 2.5 Flash with structured tool calling to resolve a natural-
// language prompt + the user's current watchlist into a typed action.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TokenContext = z.object({
  id: z.string(),
  name: z.string(),
  ticker: z.string(),
  contract: z.string(),
  bucket: z.enum(["safe", "medium", "gem"]),
  tags: z.array(z.string()).optional(),
});

const InputSchema = z.object({
  prompt: z.string().min(1).max(400),
  tokens: z.array(TokenContext).max(40),
});

export type AgentIntent = "buy" | "sell" | "swap" | "track" | "help" | "unknown";

export interface AgentAction {
  ok: boolean;
  intent: AgentIntent;
  message: string;
  resolvedTokenId?: string; // matches a token.id (== contract) when intent is buy/sell/track
  resolvedTokenLabel?: string; // human label for the resolved token
  details?: Record<string, string>;
  reasoning?: string;
}

const SYSTEM_PROMPT = `You are CultureCast's trading agent.
The user types short, casual prompts like "ape 0.05 into the doge one" or "dump half of pizza" or "track that ghost token".
You receive the user's current watchlist as TOKENS (each has id, ticker, name, bucket, tags).
Your job: pick exactly one tool call that captures their intent.

Rules:
- For buy/sell/track, resolve to ONE token from the watchlist using fuzzy match on name/ticker/tags. Pass its "id" as resolvedTokenId.
- If the user pastes a raw 0x… contract address, use that as resolvedTokenId for buy/sell/track.
- If the user is ambiguous (multiple plausible tokens, or no good match), use intent="unknown" and explain in 'message' what's missing.
- "ape", "snipe", "buy", "long", "get me" → buy. Default amount to 0.05 BNB if unspecified.
- "dump", "sell", "exit", "close" → sell. Default to 100% if unspecified.
- "swap", "convert", "trade X for Y" → swap.
- "watch", "track", "follow", "save" → track.
- "help", "what can you do" → help.
- Always keep 'message' under 140 chars and crypto-native in tone.`;

export const runAgentCommand = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<AgentAction> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        intent: "unknown",
        message: "AI agent not configured (missing LOVABLE_API_KEY).",
      };
    }

    const tokenList = data.tokens
      .slice(0, 40)
      .map(
        (t) =>
          `- id:${t.contract} | $${t.ticker} | ${t.name} | bucket:${t.bucket} | tags:${(t.tags ?? []).join(",")}`,
      )
      .join("\n");

    const userMessage = `WATCHLIST:\n${tokenList || "(empty)"}\n\nUSER PROMPT: ${data.prompt}`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "execute_action",
                description: "Resolve the user's natural-language prompt into a concrete trading action.",
                parameters: {
                  type: "object",
                  properties: {
                    intent: {
                      type: "string",
                      enum: ["buy", "sell", "swap", "track", "help", "unknown"],
                    },
                    resolvedTokenId: {
                      type: "string",
                      description:
                        "Token contract address (from the watchlist's id field) for buy/sell/track. Empty for swap/help/unknown.",
                    },
                    resolvedTokenLabel: {
                      type: "string",
                      description: "Human label like '$DBOSS (Doge Boss)'. Empty if not applicable.",
                    },
                    amount: {
                      type: "string",
                      description:
                        "For buy: amount in BNB (e.g. '0.05'). For sell: percentage like '50%' or '100%'. For swap: '<amt> <fromSymbol>'.",
                    },
                    swapTo: {
                      type: "string",
                      description: "Target token symbol or address for swap intent. Empty otherwise.",
                    },
                    message: {
                      type: "string",
                      description: "Short crypto-native confirmation/explanation, under 140 chars.",
                    },
                    reasoning: {
                      type: "string",
                      description: "One-sentence reason you picked this token / intent.",
                    },
                  },
                  required: ["intent", "message"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "execute_action" } },
        }),
      });

      if (res.status === 429) {
        return {
          ok: false,
          intent: "unknown",
          message: "Agent rate-limited. Wait a few seconds and try again.",
        };
      }
      if (res.status === 402) {
        return {
          ok: false,
          intent: "unknown",
          message: "Lovable AI credits exhausted. Add funds in Workspace settings.",
        };
      }
      if (!res.ok) {
        const txt = await res.text();
        console.error("agent gateway error:", res.status, txt);
        return {
          ok: false,
          intent: "unknown",
          message: `Agent error (${res.status}). Try a simpler prompt.`,
        };
      }

      const json = (await res.json()) as {
        choices?: Array<{
          message?: {
            tool_calls?: Array<{
              function?: { name?: string; arguments?: string };
            }>;
          };
        }>;
      };

      const call = json.choices?.[0]?.message?.tool_calls?.[0];
      if (!call?.function?.arguments) {
        return {
          ok: false,
          intent: "unknown",
          message: "Agent returned no action. Try rephrasing.",
        };
      }

      let parsed: {
        intent?: AgentIntent;
        resolvedTokenId?: string;
        resolvedTokenLabel?: string;
        amount?: string;
        swapTo?: string;
        message?: string;
        reasoning?: string;
      };
      try {
        parsed = JSON.parse(call.function.arguments);
      } catch {
        return {
          ok: false,
          intent: "unknown",
          message: "Agent returned malformed action. Try again.",
        };
      }

      const intent = (parsed.intent ?? "unknown") as AgentIntent;
      const details: Record<string, string> = {};
      if (parsed.amount) details.amount = parsed.amount;
      if (parsed.swapTo) details.swapTo = parsed.swapTo;
      if (parsed.resolvedTokenId) details.contract = shortAddr(parsed.resolvedTokenId);

      return {
        ok: intent !== "unknown",
        intent,
        message: parsed.message ?? "Done.",
        resolvedTokenId: parsed.resolvedTokenId || undefined,
        resolvedTokenLabel: parsed.resolvedTokenLabel || undefined,
        reasoning: parsed.reasoning,
        details: Object.keys(details).length ? details : undefined,
      };
    } catch (err) {
      console.error("runAgentCommand failed:", err);
      return {
        ok: false,
        intent: "unknown",
        message: "Agent unreachable. Check connection and retry.",
      };
    }
  });

function shortAddr(a: string) {
  if (!a) return "";
  return a.length > 10 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}
