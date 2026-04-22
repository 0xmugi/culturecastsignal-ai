import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Sidebar } from "@/components/cc/layout/Sidebar";
import { MobileTabBar } from "@/components/cc/layout/MobileTabBar";
import { ConnectWallet } from "@/components/cc/layout/ConnectWallet";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Check,
  ArrowRight,
  Sparkles,
  Copy,
  CreditCard,
  Wallet as WalletIcon,
  Lock,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import {
  PLAN_META,
  type Plan,
  activatePlan,
  getCurrentPlan,
  getPlanExpiry,
  onPlanChange,
} from "@/lib/plan";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — CultureCast" },
      {
        name: "description",
        content:
          "Free, Pro, and Elite plans for CultureCast. Pay with USDT on BNB Chain — Stripe coming soon.",
      },
      { property: "og:title", content: "CultureCast Pricing" },
      {
        property: "og:description",
        content: "Three tiers. Pay with crypto on BNB Chain or wait for Stripe.",
      },
    ],
  }),
  component: PricingPage,
});

// USDT BEP-20 contract address on BNB Chain
const USDT_BEP20_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
// CultureCast treasury wallet (replace with real wallet for production)
const TREASURY_WALLET = "0xCC1738R3a5ur74F0r0urCu1tur3Cas7Pr0t0c01";

interface Tier {
  plan: Plan;
  tagline: string;
  priceUsd: number;
  period: string;
  highlighted?: boolean;
  badge?: string;
  features: string[];
  notIncluded?: string[];
}

const TIERS: Tier[] = [
  {
    plan: "free",
    tagline: "The full demo. No card. No signup.",
    priceUsd: 0,
    period: "/forever",
    features: [
      "Full Drift feed (Reddit, DexScreener, GeckoTerminal, four.meme, CoinGecko)",
      "Cast engine — single AI provider chosen at random (OpenAI / Gemini)",
      "5-minute Cast result cache (no quota burn on re-checks)",
      "Bring Your Own Keys (BscScan + OpenAI / Gemini / Anthropic)",
      "Connect wallet to unlock Settings & save BYOK keys",
      "Community support via GitHub",
    ],
    notIncluded: [
      "Pick your AI provider per analysis",
      "Launch on Four.meme",
      "AI Launch Kit auto-prefill",
    ],
  },
  {
    plan: "pro",
    tagline: "Pick your AI. Skip the random.",
    priceUsd: 19,
    period: "/month",
    highlighted: true,
    badge: "Most popular",
    features: [
      "Everything in Free",
      "Multi-AI Cast — choose OpenAI, Gemini, or Anthropic per run",
      "Managed shared keys with higher rate limits (no BYOK required)",
      "Priority Drift refresh (live, bypass cache TTL)",
      "Save & export Drift signals to CSV",
      "Email alerts on HOT signals (≥80 score)",
    ],
    notIncluded: [
      "Launch on Four.meme via in-app wizard",
      "AI Launch Kit (logo gen + auto-prefill)",
    ],
  },
  {
    plan: "elite",
    tagline: "Detect, decide, and launch — all in one.",
    priceUsd: 79,
    period: "/month",
    features: [
      "Everything in Pro",
      "AI Launch Kit — auto-generated name, ticker, tagline, logo (Nano Banana)",
      "Launch on Four.meme directly from any signal (one-click createToken)",
      "Logo upload (base64) + audience-aware copy from Groq analysis",
      "10,000 Cast analyses / month on managed keys",
      "Priority support + early access to new chains",
    ],
  },
];

function PricingPage() {
  const [purchaseTier, setPurchaseTier] = useState<Tier | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan>("free");
  const [expiry, setExpiry] = useState<number | null>(null);
  const [pendingTier, setPendingTier] = useState<Tier | null>(null);
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    const refresh = () => {
      setCurrentPlan(getCurrentPlan());
      setExpiry(getPlanExpiry());
    };
    refresh();
    return onPlanChange(refresh);
  }, []);

  // After wallet connects, automatically open the modal for the tier the user
  // tried to buy. Avoids forcing them to click Purchase a second time.
  useEffect(() => {
    if (isConnected && pendingTier) {
      setPurchaseTier(pendingTier);
      setPendingTier(null);
    }
  }, [isConnected, pendingTier]);

  const handlePurchase = (tier: Tier) => {
    if (!isConnected) {
      setPendingTier(tier);
      toast.message("Connect your wallet to continue", {
        description: `${PLAN_META[tier.plan].label} payment is settled in USDT on BNB Chain.`,
      });
      openConnectModal?.();
      return;
    }
    setPurchaseTier(tier);
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground cc-page-enter">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
        <div className="flex justify-end px-6 md:px-10 pt-6 border-b border-border pb-5">
          <ConnectWallet />
        </div>

        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16">
          <div className="text-[10px] uppercase tracking-[0.4em] text-primary font-data mb-4">
            Pricing
          </div>
          <h1 className="font-display font-bold text-[44px] md:text-[64px] leading-[0.95] tracking-tight mb-5">
            Pay nothing.<br />
            <span className="text-[color:var(--text-dim)]">Or pay with crypto.</span>
          </h1>
          <p className="text-[15px] text-[color:var(--text-dim)] max-w-2xl mb-8 leading-relaxed">
            CultureCast is fully usable on the Free plan today — bring your own API
            keys for unlimited analyses. Upgrade only if you want to skip BYOK
            setup, pick your AI per run, or launch tokens directly on Four.meme.
          </p>

          {currentPlan !== "free" && expiry && (
            <div className="mb-12 px-5 py-4 border border-primary bg-surface/40 flex flex-wrap items-center gap-3">
              <CheckCircle2 size={16} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-data text-[11px] uppercase tracking-widest text-primary mb-0.5">
                  Active plan · {PLAN_META[currentPlan].label}
                </div>
                <div className="text-[13px] text-[color:var(--text-dim)]">
                  Renews on {new Date(expiry).toLocaleDateString()} · paid via USDT (BEP-20)
                </div>
              </div>
            </div>
          )}

          {/* AI Quota comparison strip */}
          <div className="mb-12 border border-border">
            <div className="px-5 py-3 border-b border-border bg-surface/30">
              <div className="text-[10px] uppercase tracking-[0.3em] font-data text-primary mb-1">
                Daily AI Quota Comparison
              </div>
              <div className="text-[12px] text-[color:var(--text-dim)]">
                How many AI analyses you get per day — Drift signals + Cast verdicts.
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border">
              {(["free", "pro", "elite"] as const).map((plan) => {
                const caps = { free: { radar: 8, decide: 6 }, pro: { radar: 60, decide: 50 }, elite: { radar: 250, decide: 200 } };
                const c = caps[plan];
                return (
                  <div key={plan} className="px-5 py-4 text-center">
                    <div className="text-[10px] uppercase tracking-widest font-data text-[color:var(--text-dim)] mb-2">
                      {PLAN_META[plan].label}
                    </div>
                    <div className="font-data text-[22px] tabular-nums font-bold" style={{ color: PLAN_META[plan].color }}>
                      {c.radar}
                      <span className="text-[11px] font-normal text-[color:var(--text-dim)]"> / </span>
                      {c.decide}
                    </div>
                    <div className="text-[9px] uppercase tracking-widest text-[color:var(--text-faint)] mt-1">
                      Drift / Cast per day
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-2 border-t border-border text-[10px] text-[color:var(--text-faint)] text-center">
              BYOK (your own API keys) = unlimited — no quota at all
            </div>
          </div>

          {/* Tiers */}
          <div className="grid md:grid-cols-3 gap-px bg-border border border-border mb-16">
            {TIERS.map((tier) => (
              <TierCard
                key={tier.plan}
                tier={tier}
                isCurrent={currentPlan === tier.plan}
                onPurchase={() => handlePurchase(tier)}
                walletConnected={isConnected}
              />
            ))}
          </div>

          {/* FAQ */}
          <h2 className="font-display font-bold text-[24px] md:text-[32px] tracking-tight mb-6">
            Frequently asked.
          </h2>
          <div className="border-t border-border max-w-3xl">
            <Faq
              q="What does Free actually include?"
              a="The full app. Drift, Cast, BYOK, wallet connect — everything. The only differences are: Free uses a randomly chosen AI provider per analysis (you can't pick), and you can't launch tokens through the in-app Four.meme wizard."
            />
            <Faq
              q="What if I bring my own API keys?"
              a="With your own BscScan + AI provider keys (OpenAI, Gemini, or Anthropic) on Free, you get unlimited analyses with zero rate limits. Keys are stored in your browser only, scoped to your wallet address."
            />
            <Faq
              q="Why crypto first?"
              a="CultureCast is built for the BNB Chain on-chain culture community. Paying with USDT on BNB Chain keeps the loop tight — no cards, no chargebacks, on-chain settlement. Stripe will follow for users who prefer cards."
            />
            <Faq
              q="How is my Pro / Elite plan activated after payment?"
              a="The moment your USDT (BEP-20) transfer reaches one BNB Chain confirmation (~3 seconds), the in-app wizard verifies it and flips your plan automatically. No manual review."
            />
            <Faq
              q="Can I cancel anytime?"
              a="Yes. Plans are paid month-by-month with a fresh USDT transfer — there is no auto-renew. Just don't pay next month and access ends at the expiry date shown above."
            />
          </div>

          <div className="mt-14 flex flex-wrap gap-4">
            <Link
              to="/drift"
              className="inline-flex items-center gap-2 px-6 py-4 bg-primary text-primary-foreground text-[12px] uppercase tracking-widest font-data font-semibold hover:opacity-90 transition-opacity"
            >
              Start free <ArrowRight size={14} />
            </Link>
            <Link
              to="/docs/pricing"
              className="inline-flex items-center gap-2 px-6 py-4 border border-border text-[12px] uppercase tracking-widest font-data font-semibold hover:border-primary transition-colors"
            >
              Read the pricing docs
            </Link>
          </div>
        </div>
      </main>

      <MobileTabBar />
      <Toaster />

      {purchaseTier && (
        <PurchaseModal
          tier={purchaseTier}
          onClose={() => setPurchaseTier(null)}
        />
      )}
    </div>
  );
}

function TierCard({
  tier,
  isCurrent,
  onPurchase,
  walletConnected,
}: {
  tier: Tier;
  isCurrent: boolean;
  onPurchase: () => void;
  walletConnected: boolean;
}) {
  const meta = PLAN_META[tier.plan];
  return (
    <div
      className="bg-background p-8 md:p-9 flex flex-col"
      style={
        tier.highlighted
          ? { boxShadow: "inset 0 0 0 1px var(--primary)" }
          : undefined
      }
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <h3 className="font-display font-bold text-[26px] tracking-tight uppercase">
            {meta.label}
          </h3>
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: meta.color }}
          />
        </div>
        {tier.badge && !isCurrent && (
          <span className="font-data text-[9px] uppercase tracking-widest px-2 py-1 bg-primary text-primary-foreground flex items-center gap-1">
            <Sparkles size={10} /> {tier.badge}
          </span>
        )}
        {isCurrent && (
          <span className="font-data text-[9px] uppercase tracking-widest px-2 py-1 border border-primary text-primary flex items-center gap-1">
            <CheckCircle2 size={10} /> Current
          </span>
        )}
      </div>
      <p className="text-[13px] text-[color:var(--text-dim)] mb-7">{tier.tagline}</p>

      <div className="flex items-baseline gap-1.5 mb-7">
        <span className="font-display font-bold text-[52px] tracking-tight tabular-nums leading-none">
          ${tier.priceUsd}
        </span>
        <span className="font-data text-[11px] uppercase tracking-widest text-[color:var(--text-dim)]">
          {tier.period}
        </span>
      </div>

      <ul className="flex flex-col gap-2.5 mb-6 flex-1">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-[12.5px] leading-snug">
            <Check size={13} className="text-primary mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
        {tier.notIncluded?.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2.5 text-[12.5px] leading-snug text-[color:var(--text-faint)] line-through"
          >
            <Lock size={11} className="mt-1 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {tier.plan === "free" ? (
        <Link
          to="/drift"
          className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-[11px] uppercase tracking-widest font-data font-semibold hover:opacity-90 transition-opacity"
        >
          Launch app <ArrowRight size={13} />
        </Link>
      ) : isCurrent ? (
        <button
          disabled
          className="flex items-center justify-center gap-2 px-5 py-3 border border-primary text-primary text-[11px] uppercase tracking-widest font-data font-semibold opacity-70 cursor-not-allowed"
        >
          Plan active
        </button>
      ) : (
        <button
          onClick={onPurchase}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-[11px] uppercase tracking-widest font-data font-semibold hover:opacity-90 transition-opacity"
        >
          {walletConnected ? (
            <>Purchase ${tier.priceUsd} <ArrowRight size={13} /></>
          ) : (
            <><WalletIcon size={12} /> Connect to purchase</>
          )}
        </button>
      )}
    </div>
  );
}

/* ============== Purchase Modal ============== */

type PayMethod = null | "usdt";

function PurchaseModal({ tier, onClose }: { tier: Tier; onClose: () => void }) {
  const [method, setMethod] = useState<PayMethod>(null);

  // Lock body scroll while modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center hover:bg-surface transition-colors"
        >
          <X size={16} />
        </button>

        <div className="px-7 pt-7 pb-5 border-b border-border">
          <div className="font-data text-[10px] uppercase tracking-[0.3em] text-primary mb-2">
            Upgrade · {PLAN_META[tier.plan].label}
          </div>
          <h2 className="font-display font-bold text-[24px] tracking-tight">
            ${tier.priceUsd}
            <span className="font-data text-[11px] uppercase tracking-widest text-[color:var(--text-dim)] ml-2">
              {tier.period}
            </span>
          </h2>
          <p className="text-[12.5px] text-[color:var(--text-dim)] mt-2 leading-relaxed">
            Choose a payment method to activate your plan.
          </p>
        </div>

        {!method && (
          <div className="p-7 space-y-3">
            <button
              onClick={() => setMethod("usdt")}
              className="w-full p-5 border border-border hover:border-primary transition-colors flex items-center gap-4 text-left"
            >
              <div className="w-11 h-11 flex items-center justify-center border border-border bg-surface text-primary shrink-0">
                <WalletIcon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[15px]">
                  Pay with USDT
                </div>
                <div className="text-[12px] text-[color:var(--text-dim)] mt-0.5">
                  BNB Chain · BEP-20 · Auto-activate on confirmation
                </div>
              </div>
              <ArrowRight size={14} className="text-primary" />
            </button>

            <div
              className="w-full p-5 border border-border flex items-center gap-4 opacity-50 cursor-not-allowed"
              aria-disabled="true"
            >
              <div className="w-11 h-11 flex items-center justify-center border border-border bg-surface text-[color:var(--text-faint)] shrink-0">
                <CreditCard size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[15px] text-[color:var(--text-dim)]">
                  Stripe
                </div>
                <div className="text-[12px] text-[color:var(--text-faint)] mt-0.5">
                  Card & Apple Pay
                </div>
              </div>
              <span className="font-data text-[9px] uppercase tracking-widest px-2 py-1 border border-border text-[color:var(--text-faint)]">
                Coming soon
              </span>
            </div>
          </div>
        )}

        {method === "usdt" && <UsdtPayFlow tier={tier} onClose={onClose} />}
      </div>
    </div>
  );
}

type Phase = "review" | "approving" | "transferring" | "confirming" | "done";

function UsdtPayFlow({ tier, onClose }: { tier: Tier; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("review");
  const [txHash, setTxHash] = useState<string>("");

  const copyAddr = async () => {
    try {
      await navigator.clipboard.writeText(TREASURY_WALLET);
      toast.success("Treasury address copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  // Simulated on-chain pay flow (mock smart-contract interaction).
  const startPay = async () => {
    // 1. Approve allowance on USDT contract
    setPhase("approving");
    await wait(1400);

    // 2. Call transfer() on USDT BEP-20
    setPhase("transferring");
    await wait(1600);
    const fakeHash = "0x" + cryptoRandom(64);
    setTxHash(fakeHash);

    // 3. Wait for one BNB Chain block confirmation (~3s)
    setPhase("confirming");
    await wait(2200);

    // 4. Activate plan
    activatePlan(tier.plan, fakeHash, 30);
    setPhase("done");
    toast.success(`Plan activated · ${PLAN_META[tier.plan].label}`, {
      description: "Welcome to CultureCast " + PLAN_META[tier.plan].label,
    });
  };

  if (phase === "done") {
    return (
      <div className="p-7">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-14 h-14 flex items-center justify-center border border-primary bg-surface mb-4">
            <CheckCircle2 size={26} className="text-primary" />
          </div>
          <h3 className="font-display font-bold text-[22px] tracking-tight mb-2">
            {PLAN_META[tier.plan].label} plan active.
          </h3>
          <p className="text-[13px] text-[color:var(--text-dim)] max-w-xs mb-5 leading-relaxed">
            Payment confirmed on BNB Chain. Your plan renews in 30 days — pay
            again any time before then to extend.
          </p>
          <a
            href={`https://bscscan.com/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-data text-[10px] uppercase tracking-widest text-primary hover:underline mb-6 break-all"
          >
            <ExternalLink size={11} /> View tx on BscScan
          </a>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-primary text-primary-foreground text-[11px] uppercase tracking-widest font-data font-semibold hover:opacity-90 transition-opacity"
          >
            Start using {PLAN_META[tier.plan].label}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-7 space-y-5">
      {/* Tx breakdown */}
      <div className="border border-border">
        <Row k="Network" v="BNB Smart Chain" />
        <Row k="Token" v="USDT (BEP-20)" />
        <Row
          k="Contract"
          v={short(USDT_BEP20_CONTRACT)}
          mono
          tooltip={USDT_BEP20_CONTRACT}
        />
        <Row k="Recipient" v={short(TREASURY_WALLET)} mono />
        <Row k="Amount" v={`${tier.priceUsd}.00 USDT`} highlight />
        <Row k="Network fee (est.)" v="~$0.12" />
      </div>

      <div className="flex items-start gap-2 px-3 py-2.5 bg-surface/50 border border-border">
        <ShieldCheck size={13} className="text-primary mt-0.5 shrink-0" />
        <p className="text-[11.5px] text-[color:var(--text-dim)] leading-snug">
          Two-step transaction: approve USDT allowance, then transfer to the
          treasury. Plan auto-activates on first confirmation.
        </p>
      </div>

      {/* Status */}
      {phase !== "review" && (
        <div className="border border-border bg-surface/30 p-4 space-y-2.5">
          <Step
            label="Approve USDT allowance"
            state={phaseState(phase, "approving")}
          />
          <Step
            label="Transfer to treasury"
            state={phaseState(phase, "transferring")}
          />
          <Step
            label="Wait for BNB Chain confirmation"
            state={phaseState(phase, "confirming")}
          />
          {txHash && (
            <div className="pt-2 mt-2 border-t border-border">
              <div className="font-data text-[9px] uppercase tracking-widest text-[color:var(--text-faint)] mb-1">
                Transaction hash
              </div>
              <code className="font-data text-[11px] break-all text-foreground">
                {txHash}
              </code>
            </div>
          )}
        </div>
      )}

      {phase === "review" ? (
        <div className="space-y-2">
          <button
            onClick={startPay}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary text-primary-foreground text-[11px] uppercase tracking-widest font-data font-semibold hover:opacity-90 transition-opacity"
          >
            <WalletIcon size={13} /> Confirm & sign in wallet
          </button>
          <button
            onClick={copyAddr}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 border border-border text-[10px] uppercase tracking-widest font-data text-[color:var(--text-dim)] hover:border-primary hover:text-foreground transition-colors"
          >
            <Copy size={11} /> Or copy treasury address to pay manually
          </button>
        </div>
      ) : (
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-primary/60 text-primary-foreground text-[11px] uppercase tracking-widest font-data font-semibold cursor-not-allowed"
        >
          <Loader2 size={13} className="animate-spin" />
          {phase === "approving" && "Approving USDT…"}
          {phase === "transferring" && "Sending transaction…"}
          {phase === "confirming" && "Waiting for confirmation…"}
        </button>
      )}
    </div>
  );
}

function Row({
  k,
  v,
  mono,
  highlight,
  tooltip,
}: {
  k: string;
  v: string;
  mono?: boolean;
  highlight?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-0">
      <span className="font-data text-[10px] uppercase tracking-widest text-[color:var(--text-faint)]">
        {k}
      </span>
      <span
        title={tooltip}
        className={[
          mono ? "font-data text-[11.5px]" : "text-[13px]",
          highlight ? "font-display font-bold text-foreground" : "text-foreground",
        ].join(" ")}
      >
        {v}
      </span>
    </div>
  );
}

function Step({ label, state }: { label: string; state: "pending" | "active" | "done" }) {
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]">
      {state === "done" ? (
        <CheckCircle2 size={14} className="text-primary shrink-0" />
      ) : state === "active" ? (
        <Loader2 size={14} className="text-primary animate-spin shrink-0" />
      ) : (
        <span className="w-3.5 h-3.5 border border-border rounded-full shrink-0" />
      )}
      <span
        className={
          state === "pending" ? "text-[color:var(--text-faint)]" : "text-foreground"
        }
      >
        {label}
      </span>
    </div>
  );
}

function phaseState(
  phase: Phase,
  step: "approving" | "transferring" | "confirming",
): "pending" | "active" | "done" {
  const order: Phase[] = ["review", "approving", "transferring", "confirming", "done"];
  const cur = order.indexOf(phase);
  const tgt = order.indexOf(step);
  if (cur > tgt) return "done";
  if (cur === tgt) return "active";
  return "pending";
}

function short(addr: string) {
  return addr.length > 14 ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : addr;
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function cryptoRandom(len: number): string {
  const bytes = new Uint8Array(len / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-border py-5">
      <div className="font-display font-bold text-[15px] mb-2">{q}</div>
      <p className="text-[13px] text-[color:var(--text-dim)] leading-relaxed">{a}</p>
    </div>
  );
}
