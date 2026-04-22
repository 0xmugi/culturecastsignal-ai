// AI agent for the Tracked page command bar.
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        intent: "unknown",
        message: "AI agent not configured (missing GEMINI_API_KEY).",
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
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: userMessage }] }],
            tools: [{
              functionDeclarations: [{
                name: "execute_action",
                description: "Resolve the user's natural-language prompt into a concrete trading action.",
                parameters: {
                  type: "object",
                  properties: {
                    intent: {
                      type: "string",
                      enum: ["buy", "sell", "swap", "track", "help", "unknown"],
                    },
                    resolvedTokenId: { type: "string" },
                    resolvedTokenLabel: { type: "string" },
                    amount: { type: "string" },
                    swapTo: { type: "string" },
                    message: { type: "string" },
                    reasoning: { type: "string" },
                  },
                  required: ["intent", "message"],
                },
              }],
            }],
            toolConfig: {
              functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["execute_action"] },
            },
            generationConfig: { temperature: 0.4 },
          }),
        }
      );

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
          message: " AI credits exhausted. Add funds in Workspace settings.",
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
        candidates?: Array<{
          content?: {
            parts?: Array<{
              functionCall?: {
                name?: string;
                args?: {
                  intent?: AgentIntent;
                  resolvedTokenId?: string;
                  resolvedTokenLabel?: string;
                  amount?: string;
                  swapTo?: string;
                  message?: string;
                  reasoning?: string;
                };
              };
            }>;
          };
        }>;
      };

      const call = json.candidates?.[0]?.content?.parts?.[0]?.functionCall;
      if (!call?.args) {
        return {
          ok: false,
          intent: "unknown",
          message: "Agent returned no action. Try rephrasing.",
        };
      }
      
      const parsed: {
        intent?: AgentIntent;
        resolvedTokenId?: string;
        resolvedTokenLabel?: string;
        amount?: string;
        swapTo?: string;
        message?: string;
        reasoning?: string;
      } = call.args as {
        intent?: AgentIntent;
        resolvedTokenId?: string;
        resolvedTokenLabel?: string;
        amount?: string;
        swapTo?: string;
        message?: string;
        reasoning?: string;
      };
      
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
