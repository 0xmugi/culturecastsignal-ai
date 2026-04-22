// Multi-provider AI decision engine for the /decide page.
// Supports OpenAI (GPT), Google Gemini, and Anthropic Claude.
// Strategy: prefer user's BYOK; fall back to platform key (server env) for Free trial.
// Returns strict JSON verdict.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ProviderSchema = z.enum(["openai", "gemini", "anthropic"]);
export type DecideProvider = z.infer<typeof ProviderSchema>;

const InputSchema = z.object({
  provider: ProviderSchema,
  userKey: z.string().min(8).max(200).optional(),
  signal: z.object({
    name: z.string().min(1).max(120),
    symbol: z.string().min(1).max(20),
    address: z.string().min(8).max(80),
    holders: z.number().nullable(),
    txCount24h: z.number().nullable(),
    ageDays: z.number().nullable(),
    totalSupply: z.string().max(80).optional(),
  }),
});

export type AIDecision = "BUY" | "WAIT" | "AVOID";
export type AIRisk = "LOW" | "MEDIUM" | "HIGH";
export type AIPhase = "EARLY" | "PEAK" | "LATE" | "DEAD";

export interface AIDecideResult {
  decision: AIDecision;
  confidence: number;
  risk: AIRisk;
  phase: AIPhase;
  reason: string;
  green: string[];
  red: string[];
  provider: DecideProvider;
  keySource: "user" | "platform" | "none";
  error?: string;
}

const SYSTEM_PROMPT = `You are CultureCast's token decision engine for BNB Chain Four.meme tokens. Given on-chain stats, return a STRICT JSON verdict.

Reply with valid JSON ONLY, no markdown, matching this schema exactly:
{
  "decision": "BUY" | "WAIT" | "AVOID",
  "confidence": <integer 0-100>,
  "risk": "LOW" | "MEDIUM" | "HIGH",
  "phase": "EARLY" | "PEAK" | "LATE" | "DEAD",
  "reason": "2-3 sentences. Direct, terse, data-driven. No hype. Mention specific numbers.",
  "green": ["3-5 short green-flag bullet points"],
  "red": ["2-4 short red-flag bullet points"]
}

Heuristics:
- holders > 5000 + txCount24h > 800 + age < 14d → lean BUY
- holders < 500 OR txCount24h < 50 → lean AVOID
- Otherwise WAIT
- Always include red flags about concentration, age, and liquidity even on BUY.`;

function buildUserPrompt(s: z.infer<typeof InputSchema>["signal"]): string {
  return `Token: ${s.name} ($${s.symbol})
Address: ${s.address}
Holders: ${s.holders ?? "unknown"}
24h transfers: ${s.txCount24h ?? "unknown"}
Age (days): ${s.ageDays ?? "unknown"}
Total supply: ${s.totalSupply ?? "unknown"}

Return JSON verdict.`;
}

interface RawJSON {
  decision?: string;
  confidence?: number;
  risk?: string;
  phase?: string;
  reason?: string;
  green?: unknown;
  red?: unknown;
}

/**
 * Robust JSON parser for LLM output.
 * Handles common issues: ```json fences, trailing prose, unescaped newlines
 * inside string values, smart quotes, and trailing commas.
 */
function safeParseJSON(raw: string): RawJSON {
  let s = raw.trim();
  // Strip markdown fences
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  // Slice from first { to last }
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);

  const tryParse = (str: string): RawJSON | null => {
    try { return JSON.parse(str) as RawJSON; } catch { return null; }
  };

  let parsed = tryParse(s);
  if (parsed) return parsed;

  // Repair pass: escape raw newlines/tabs that appear inside string literals.
  let inStr = false;
  let prev = "";
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && prev !== "\\") inStr = !inStr;
    if (inStr && ch === "\n") out += "\\n";
    else if (inStr && ch === "\r") out += "\\r";
    else if (inStr && ch === "\t") out += "\\t";
    else out += ch;
    prev = ch;
  }
  // Strip trailing commas
  out = out.replace(/,(\s*[}\]])/g, "$1");
  parsed = tryParse(out);
  if (parsed) return parsed;

  // Repair pass 2: handle truncated JSON (model hit max_tokens mid-output).
  // Close any open string, then close all open brackets in reverse order.
  let inStr2 = false;
  let prev2 = "";
  const stack: string[] = [];
  for (let i = 0; i < out.length; i++) {
    const ch = out[i];
    if (ch === '"' && prev2 !== "\\") inStr2 = !inStr2;
    if (!inStr2) {
      if (ch === "{") stack.push("}");
      else if (ch === "[") stack.push("]");
      else if (ch === "}" || ch === "]") stack.pop();
    }
    prev2 = ch;
  }
  let repaired = out;
  if (inStr2) repaired += '"';
  // Drop a dangling comma/colon at the end before closing.
  repaired = repaired.replace(/[,:\s]+$/g, "");
  while (stack.length) repaired += stack.pop();
  parsed = tryParse(repaired);
  if (parsed) return parsed;

  throw new Error(`Could not parse model JSON: ${raw.slice(0, 200)}`);
}

function normalize(parsed: RawJSON): Omit<AIDecideResult, "provider" | "keySource"> {
  const decision: AIDecision = ["BUY", "WAIT", "AVOID"].includes(parsed.decision ?? "")
    ? (parsed.decision as AIDecision)
    : "WAIT";
  const risk: AIRisk = ["LOW", "MEDIUM", "HIGH"].includes(parsed.risk ?? "")
    ? (parsed.risk as AIRisk)
    : "MEDIUM";
  const phase: AIPhase = ["EARLY", "PEAK", "LATE", "DEAD"].includes(parsed.phase ?? "")
    ? (parsed.phase as AIPhase)
    : "EARLY";
  return {
    decision,
    confidence: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 50))),
    risk,
    phase,
    reason: String(parsed.reason ?? "").slice(0, 800),
    green: Array.isArray(parsed.green)
      ? parsed.green.slice(0, 6).map((g) => String(g).slice(0, 160))
      : [],
    red: Array.isArray(parsed.red)
      ? parsed.red.slice(0, 6).map((g) => String(g).slice(0, 160))
      : [],
  };
}

function fallback(s: z.infer<typeof InputSchema>["signal"]): Omit<AIDecideResult, "provider" | "keySource"> {
  const h = s.holders ?? 0;
  const tx = s.txCount24h ?? 0;
  const age = s.ageDays ?? 0;
  let decision: AIDecision = "WAIT";
  if (h > 5000 && tx > 800 && age < 14) decision = "BUY";
  else if (h < 500 || tx < 50) decision = "AVOID";
  const phase: AIPhase = age < 2 ? "EARLY" : age < 7 ? "PEAK" : age < 21 ? "LATE" : "DEAD";
  return {
    decision,
    confidence: 50,
    risk: decision === "BUY" ? "MEDIUM" : "HIGH",
    phase,
    reason: "AI provider unavailable — heuristic fallback used. Verify on BscScan before acting.",
    green: h > 1000 ? [`${h.toLocaleString()} holders`] : [],
    red: ["AI analysis unavailable", h < 500 ? "Low holder count" : "Verify liquidity manually"],
  };
}

// ---------- Provider callers ----------

async function callOpenAI(apiKey: string, system: string, user: string): Promise<RawJSON> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.4,
      max_tokens: 800,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty OpenAI response");
  return safeParseJSON(content);
}

async function callAnthropic(apiKey: string, system: string, user: string): Promise<RawJSON> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: user + "\n\nReply with JSON only, no markdown." }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const text = json.content?.[0]?.text;
  if (!text) throw new Error("Empty Anthropic response");
  return safeParseJSON(text);
}

async function callGemini(apiKey: string, system: string, user: string): Promise<RawJSON> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
          // Gemini Flash counts thinking tokens against this budget; bump high
          // to avoid truncated JSON ("Unterminated string" parse errors).
          maxOutputTokens: 2048,
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");
  return safeParseJSON(text);
}

function platformKeyFor(provider: DecideProvider): string | undefined {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "gemini":
      return process.env.GEMINI_API_KEY;
  }
}

export const decideWithAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<AIDecideResult> => {
    const userKey = data.userKey?.trim();
    const platformKey = platformKeyFor(data.provider);
    const apiKey = userKey || platformKey;
    const keySource: AIDecideResult["keySource"] = userKey ? "user" : platformKey ? "platform" : "none";

    if (!apiKey) {
      return {
        ...fallback(data.signal),
        provider: data.provider,
        keySource: "none",
        error: `No ${data.provider} key configured. Add yours in Settings.`,
      };
    }

    const sysPrompt = SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt(data.signal);

    try {
      let raw: RawJSON;
      if (data.provider === "openai") raw = await callOpenAI(apiKey, sysPrompt, userPrompt);
      else if (data.provider === "anthropic") raw = await callAnthropic(apiKey, sysPrompt, userPrompt);
      else raw = await callGemini(apiKey, sysPrompt, userPrompt);

      return { ...normalize(raw), provider: data.provider, keySource };
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      console.error(`[decideWithAI:${data.provider}]`, raw);
      const is429 = /\b429\b/.test(raw);
      const niceMsg = is429
        ? `${data.provider.toUpperCase()} is rate-limiting our shared key. Wait ~30s and retry, or add your own ${data.provider.toUpperCase()} key in Settings.`
        : raw.slice(0, 240);
      return {
        ...fallback(data.signal),
        provider: data.provider,
        keySource,
        error: niceMsg,
      };
    }
  });
