// AI signal analyzer (Groq, fast & cheap).
// Used by Radar to enrich each signal with a launch kit + ready-to-post memes.
// Strategy: prefer user's BYOK Groq key; fall back to platform GROQ_API_KEY for Free trial.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  // Optional — server falls back to platform key when missing.
  groqKey: z.string().min(20).max(200).optional(),
  signal: z.object({
    name: z.string().min(1).max(120),
    symbol: z.string().min(1).max(20),
    score: z.number().min(0).max(100),
    status: z.string().min(1).max(20),
    velocity: z.string().min(1).max(60),
    sources: z.array(z.string().min(1).max(20)).max(20),
    windowHoursLeft: z.number().min(0).max(720),
    launched: z.boolean(),
    fourMemeLive: z.boolean().optional(),
    pricePctChange24h: z.number().nullable().optional(),
  }),
});

export interface AIAnalysisResult {
  why: string;
  opportunity: string;
  risk: string;
  confidence: number;
  timing: "immediate" | "soon" | "monitor" | "skip";
  tagline: string;
  description: string;
  audience: string;
  memes: { channel: string; text: string; format: string }[];
  source: "groq" | "fallback";
  keySource: "user" | "platform" | "none";
  error?: string;
}

const FALLBACK = (sig: z.infer<typeof InputSchema>["signal"]): Omit<AIAnalysisResult, "source" | "keySource"> => ({
  why: `${sig.name} shows ${sig.velocity} across ${sig.sources.length} platform(s). Status: ${sig.status}.`,
  opportunity: `Window: ~${sig.windowHoursLeft}h. ${sig.fourMemeLive ? "Already live on Four.meme." : "Not launched yet — first-mover edge available."}`,
  risk: sig.status === "HOT" ? "Late entries may dump on you." : "Could fizzle in 48h if no creator picks it up.",
  confidence: Math.min(99, Math.max(20, sig.score + 2)),
  timing: sig.status === "HOT" ? "immediate" : sig.status === "RISING" ? "soon" : "monitor",
  tagline: `${sig.name.toLowerCase()} szn just dropped 🫡`,
  description: `gm. ${sig.name.toLowerCase()} is doing numbers — ${sig.velocity}. early or ngmi. wagmi 🐸`,
  audience: "Degens 18-28, terminally online",
  memes: [],
});

export const analyzeSignalWithGroq = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<AIAnalysisResult> => {
    const userKey = data.groqKey?.trim();
    const platformKey = process.env.GROQ_API_KEY;
    const apiKey = userKey || platformKey;
    const keySource: AIAnalysisResult["keySource"] = userKey ? "user" : platformKey ? "platform" : "none";

    if (!apiKey) {
      return {
        ...FALLBACK(data.signal),
        source: "fallback",
        keySource: "none",
        error: "No Groq key available. Add yours in Settings.",
      };
    }

    const systemPrompt = `You are CultureCast's meme analyst. Analyze cultural/crypto signals and return strict JSON. Be terse and data-driven for "why/opportunity/risk", but "tagline" and "description" MUST sound like crypto Twitter — playful, lowercase ok, emojis ok, gm/wagmi/ngmi/cope/cooked/it's so over/we're so back energy. Audience: degens timing meme launches on BNB Chain Four.meme. Do NOT write whitepaper copy in tagline/description — write tweets.`;

    const userPrompt = `Analyze this signal and respond ONLY with valid JSON matching this schema:
{
  "why": "1-2 sentences why this is significant now (analytical tone)",
  "opportunity": "1 sentence specific opportunity (timing, angle)",
  "risk": "1 sentence specific risk",
  "confidence": <integer 0-100>,
  "timing": "immediate" | "soon" | "monitor" | "skip",
  "tagline": "punchy 6-10 word tagline — meme tweet voice, lowercase ok, emojis ok",
  "description": "1-2 sentence token description in meme/CT voice — NOT whitepaper. Lowercase ok, emojis ok, slang ok",
  "audience": "target audience in 6-12 words",
  "memes": [
    {"channel": "X / Twitter", "text": "<280 chars max>", "format": "shitpost"},
    {"channel": "Telegram", "text": "<announcement>", "format": "announce"},
    {"channel": "TikTok caption", "text": "<pov caption>", "format": "POV"}
  ]
}

Signal data:
${JSON.stringify(data.signal, null, 2)}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 1200,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Groq error:", res.status, text);
        const niceErr =
          res.status === 401
            ? "Invalid Groq API key."
            : res.status === 429
            ? "Groq rate-limited right now. Wait ~30s and retry, or add your own free Groq key in Settings to skip the queue."
            : `Groq error ${res.status}.`;
        return {
          ...FALLBACK(data.signal),
          source: "fallback",
          keySource,
          error: niceErr,
        };
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        return { ...FALLBACK(data.signal), source: "fallback", keySource, error: "Empty Groq response." };
      }

      const parsed = JSON.parse(content);
      return {
        why: String(parsed.why ?? FALLBACK(data.signal).why).slice(0, 500),
        opportunity: String(parsed.opportunity ?? "").slice(0, 300),
        risk: String(parsed.risk ?? "").slice(0, 300),
        confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || data.signal.score)),
        timing: ["immediate", "soon", "monitor", "skip"].includes(parsed.timing)
          ? parsed.timing
          : "monitor",
        tagline: String(parsed.tagline ?? "").slice(0, 120),
        description: String(parsed.description ?? "").slice(0, 300),
        audience: String(parsed.audience ?? "").slice(0, 120),
        memes: Array.isArray(parsed.memes)
          ? parsed.memes.slice(0, 5).map((m: { channel?: string; text?: string; format?: string }) => ({
              channel: String(m.channel ?? "X").slice(0, 30),
              text: String(m.text ?? "").slice(0, 400),
              format: String(m.format ?? "post").slice(0, 30),
            }))
          : [],
        source: "groq",
        keySource,
      };
    } catch (e) {
      console.error("Groq request failed:", e);
      return { ...FALLBACK(data.signal), source: "fallback", keySource, error: "Network error contacting Groq." };
    }
  });
