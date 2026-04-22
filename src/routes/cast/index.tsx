import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Sidebar } from "@/components/cc/layout/Sidebar";
import { MobileTabBar } from "@/components/cc/layout/MobileTabBar";
import { ConnectWallet } from "@/components/cc/layout/ConnectWallet";
import { WalletGate } from "@/components/cc/layout/WalletGate";
import { AlertTriangle } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import {
  fetchTokenInfo,
  fetchTokenEnrichment,
  fetchTopHolders,
  type BscTokenInfo,
  type TokenEnrichment,
} from "@/lib/bscscan.functions";
import { decideWithAI, type AIDecideResult, type DecideProvider } from "@/lib/aiDecide.functions";
import { loadUserKeys } from "@/lib/userKeys";
import {
  getCachedDecide,
  setCachedDecide,
  saveLastAddr,
  loadLastAddr,
  DECIDE_CACHE_TTL_MS,
} from "@/lib/decideCache";
import { getCachedEnrichment, setCachedEnrichment } from "@/lib/enrichmentCache";
import { consumeAiQuota, readAiQuota } from "@/lib/aiQuota";
import { DecideHero } from "@/components/cc/cast/DecideHero";
import { DecideLoadingPanel } from "@/components/cc/cast/DecideLoadingPanel";
import { DecideVerdictHeader } from "@/components/cc/cast/DecideVerdictHeader";
import { DecideEnrichmentBlock } from "@/components/cc/cast/DecideEnrichmentBlock";
import { DecideAiSidebar } from "@/components/cc/cast/DecideAiSidebar";
import { DecideKeyChips } from "@/components/cc/cast/DecideKeyChips";

interface DecideSearch {
  addr?: string;
  provider?: DecideProvider;
}

export const Route = createFileRoute("/cast/")({
  validateSearch: (search: Record<string, unknown>): DecideSearch => ({
    addr: typeof search.addr === "string" ? search.addr.trim() : undefined,
    provider:
      search.provider === "openai" || search.provider === "gemini" || search.provider === "anthropic"
        ? search.provider
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "CultureCast — Cast · Token decision engine" },
      { name: "description", content: "Paste a contract address. Get an AI BUY / WAIT / AVOID decision in seconds." },
      { property: "og:title", content: "CultureCast — Cast" },
      { property: "og:description", content: "AI-powered token decisions for Four.meme tokens on BNB Chain." },
    ],
  }),
  component: DecidePage,
});

const ADDR_RE = /^0x[a-fA-F0-9]{40}$/;
const validateAddr = (v: string) => ADDR_RE.test(v.trim());

function randomDefaultProvider(): DecideProvider {
  return Math.random() < 0.5 ? "openai" : "gemini";
}

function DecidePage() {
  const { addr: initialAddr, provider: initialProvider } = Route.useSearch();
  const { address: wallet, isConnected } = useAccount();
  const [addr, setAddr] = useState(initialAddr ?? "");
  const [provider, setProvider] = useState<DecideProvider>(initialProvider ?? randomDefaultProvider());
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "loading" | "done">("idle");
  const [tokenInfo, setTokenInfo] = useState<BscTokenInfo | null>(null);
  const [aiResult, setAIResult] = useState<AIDecideResult | null>(null);
  const [enrichment, setEnrichment] = useState<TokenEnrichment | null>(null);
  /** When enrichment came from local 60s cache: how old (ms) at the moment of load. null = freshly fetched. */
  const [enrichmentCacheAgeMs, setEnrichmentCacheAgeMs] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [cacheNote, setCacheNote] = useState<string | null>(null);

  useEffect(() => {
    if (!initialAddr) {
      const last = loadLastAddr();
      if (last) setAddr(last);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (overrideAddr?: string) => {
    const target = (overrideAddr ?? addr).trim();
    if (!validateAddr(target)) {
      setError("Invalid contract address — must start with 0x and be 42 characters.");
      return;
    }
    setAddr(target);
    saveLastAddr(target);
    setError(null);
    setWarning(null);
    setCacheNote(null);

    const cached = getCachedDecide(provider, target);
    if (cached) {
      setTokenInfo(cached.tokenInfo);
      setAIResult(cached.aiResult);
      if (cached.tokenInfo.warning) setWarning(cached.tokenInfo.warning);
      const ageSec = Math.round(cached.ageMs / 1000);
      const ttlMin = Math.round(DECIDE_CACHE_TTL_MS / 60000);
      setCacheNote(`Cached result · ${ageSec}s old · refreshes after ${ttlMin}m`);
      // Try to populate enrichment from local cache too — keeps chart instant.
      const cEnrich = getCachedEnrichment(target);
      if (cEnrich) {
        setEnrichment(cEnrich.data);
        setEnrichmentCacheAgeMs(cEnrich.ageMs);
      } else {
        setEnrichment(null);
        setEnrichmentCacheAgeMs(null);
      }
      setStep("done");
      return;
    }

    setStep("loading");
    setTokenInfo(null);
    setAIResult(null);
    setEnrichment(null);
    setEnrichmentCacheAgeMs(null);
    try {
      const userKeys = loadUserKeys(wallet);
      const hasUserKey = !!userKeys[provider];
      const q = readAiQuota("decide", wallet, hasUserKey);
      if (q.exceeded) {
        const hrs = Math.ceil(q.resetInMs / 3_600_000);
        setError(
          `Daily Cast AI limit reached for your ${q.plan.toUpperCase()} plan (${q.limit}/day). Resets in ~${hrs}h. Upgrade your plan or add your own ${provider.toUpperCase()} key in Settings.`,
        );
        setStep("idle");
        return;
      }

      const info = await fetchTokenInfo({ data: { address: target, userKey: userKeys.bscscan } });
      if (info.warning) setWarning(info.warning);
      setTokenInfo(info);

      const ai = await decideWithAI({
        data: {
          provider,
          userKey: userKeys[provider],
          signal: {
            name: info.name,
            symbol: info.symbol,
            address: target,
            holders: info.holders,
            txCount24h: info.txCount24h,
            ageDays: info.ageDays,
            totalSupply: info.totalSupply,
          },
        },
      });
      setAIResult(ai);
      if (!ai.error) {
        setCachedDecide(provider, target, info, ai);
        consumeAiQuota("decide", wallet, hasUserKey);
      }

      // Enrichment — instant from cache, else fetch fresh.
      const cachedEnrich = getCachedEnrichment(target);
      if (cachedEnrich) {
        setEnrichment(cachedEnrich.data);
        setEnrichmentCacheAgeMs(cachedEnrich.ageMs);
      } else {
        fetchTokenEnrichment({ data: { address: target } })
          .then(async (e) => {
            if (userKeys.bscscan && info.totalSupply && info.totalSupply !== "0") {
              try {
                const top = await fetchTopHolders({
                  data: { address: target, userKey: userKeys.bscscan, totalSupply: info.totalSupply },
                });
                if (top.top10Pct != null) e = { ...e, top10HoldersPct: top.top10Pct };
              } catch { /* graceful */ }
            }
            setEnrichment(e);
            setEnrichmentCacheAgeMs(null);
            setCachedEnrichment(target, e);
          })
          .catch(() => {});
      }
      setStep("done");
    } catch (e) {
      console.error(e);
      setError("Failed to fetch on-chain data. Try again.");
      setStep("idle");
    }
  };

  useEffect(() => {
    if (initialAddr) {
      const cleaned = initialAddr.trim();
      if (validateAddr(cleaned)) {
        submit(cleaned);
      } else {
        setError(`Address from Drift is invalid: "${cleaned.slice(0, 50)}".`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAddr]);

  const userKeys = loadUserKeys(wallet);
  const hasAnthropicKey = !!userKeys.anthropic;
  const hasBscscanKey = !!userKeys.bscscan;

  return (
    <div className="min-h-screen flex bg-background text-foreground cc-page-enter">
      <Sidebar />

      <WalletGate
        feature="Cast"
        description="Cast hits BscScan and our AI verdict engine for every analysis. Connect a wallet to access — and optionally bring your own keys for unlimited usage."
      >
        <main className="flex-1 pb-16 md:pb-0">
          <div className="flex justify-end px-6 md:px-10 pt-6 border-b border-border pb-5">
            <ConnectWallet />
          </div>

          {/* Pre-results: centered single column hero */}
          {step !== "done" && (
            <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-20">
              <DecideHero
                addr={addr}
                setAddr={(v) => { setAddr(v); if (error) setError(null); }}
                onSubmit={() => submit()}
                error={error}
                disabled={step === "loading"}
                provider={provider}
                setProvider={setProvider}
                hasAnthropicKey={hasAnthropicKey}
              />
              {step === "loading" && <DecideLoadingPanel addr={addr} />}
            </div>
          )}

          {/* Results: 2-column with sticky AI sidebar on desktop */}
          {step === "done" && tokenInfo && aiResult && (
            <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 md:py-14">
              {/* Compact hero on top — keep the address bar accessible above results */}
              <div className="mb-10">
                <DecideHero
                  addr={addr}
                  setAddr={(v) => { setAddr(v); if (error) setError(null); }}
                  onSubmit={() => submit()}
                  error={error}
                  disabled={false}
                  provider={provider}
                  setProvider={setProvider}
                  hasAnthropicKey={hasAnthropicKey}
                />
              </div>

              <DecideKeyChips tokenInfo={tokenInfo} aiResult={aiResult} isConnected={isConnected} />

              {cacheNote && (
                <div className="mt-3 text-[10px] uppercase tracking-widest font-data text-[color:var(--text-dim)] flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                  {cacheNote}
                </div>
              )}

              {warning && (
                <div className="mt-4 flex items-start gap-2 border border-border px-4 py-3 text-[12px] font-data">
                  <AlertTriangle size={14} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-[color:var(--text-dim)]">{warning}</span>
                </div>
              )}

              {tokenInfo.holders == null && (tokenInfo.txCount24h == null || tokenInfo.txCount24h === 0) && (
                <div className="mt-4 flex items-start gap-3 border border-warn/40 bg-warn/5 px-4 py-3 text-[12px] font-data">
                  <AlertTriangle size={14} className="text-warn mt-0.5 shrink-0" />
                  <div className="text-[color:var(--text-dim)] leading-relaxed">
                    <span className="text-warn font-semibold">Token may be too new.</span>{" "}
                    Neither BscScan nor GeckoTerminal returned holder or transaction data yet.
                    On-chain indexers usually catch up within a few hours — try again later for a more accurate verdict.
                  </div>
                </div>
              )}

              {/* Two-column results layout */}
              <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
                <div className="min-w-0">
                  <DecideVerdictHeader info={tokenInfo} ai={aiResult} addr={addr} />
                  <DecideEnrichmentBlock
                    enrichment={enrichment}
                    info={tokenInfo}
                    cacheAgeMs={enrichmentCacheAgeMs}
                    hasBscscanKey={hasBscscanKey}
                  />
                </div>
                <DecideAiSidebar ai={aiResult} />
              </div>
            </div>
          )}
        </main>
      </WalletGate>

      <MobileTabBar />
      <Toaster />
    </div>
  );
}
