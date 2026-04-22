import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAccount, useChainId, useSwitchChain, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, type Hex } from "viem";
import { Loader2, Rocket, ExternalLink, X, Info, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  TOKEN_MANAGER_HELPER_ABI,
  TOKEN_MANAGER_HELPER_ADDRESS,
  FOUR_MEME_CHAIN_ID,
  DEFAULT_LAUNCH_FEE_BNB,
} from "@/lib/fourMeme";
import type { Signal } from "@/lib/signals";
import { ConnectWallet } from "@/components/cc/layout/ConnectWallet";

interface Props {
  signal: Signal;
  prefill?: {
    tagline?: string;
    description?: string;
    audience?: string;
  };
  onClose: () => void;
}

export function LaunchOnFourMemeModal({ signal, prefill, onClose }: Props) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { writeContractAsync, isPending: signing, data: txHash, reset } = useWriteContract();
  const { isLoading: waiting, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const defaultSymbol = useMemo(
    () =>
      (signal.ticker?.replace(/[^A-Z0-9]/gi, "") ||
        signal.name.replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase()).slice(0, 10),
    [signal],
  );

  const [name, setName] = useState(signal.name);
  const [symbol, setSymbol] = useState(defaultSymbol);
  // Memey default copy — matches Four.meme tone, not a serious whitepaper.
  // If the AI launch kit prefilled a description, prefer that (Groq is told to be playful).
  const [description, setDescription] = useState(
    prefill?.description ??
      `${signal.name} just hit the timeline harder than your 6am alarm. ${signal.velocity} and climbing — gm to the believers, ngmi to the doubters. wagmi 🫡`,
  );
  const [imageUrl, setImageUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");
  const [preSale, setPreSale] = useState("0");
  // Open Advanced by default when AI prefill is available so users see the rich data.
  const [showAdvanced, setShowAdvanced] = useState(!!prefill?.audience);
  const [confirmStep, setConfirmStep] = useState(false);

  const aiPrefilled = !!(prefill?.description || prefill?.tagline || prefill?.audience);

  const handleLogoFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Logo must be an image (PNG, JPG, WEBP, SVG).");
      return;
    }
    if (file.size > 200 * 1024) {
      toast.error("Logo too large — max 200 KB. Compress it first.");
      return;
    }
    setLogoUploading(true);
    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      setImageUrl(dataUri);
      setLogoPreview(dataUri);
      toast.success("Logo attached.");
    } catch {
      toast.error("Could not read file.");
    } finally {
      setLogoUploading(false);
    }
  };

  const onWrongChain = isConnected && chainId !== FOUR_MEME_CHAIN_ID;

  const launchedToken = isSuccess && receipt
    ? extractTokenAddress(receipt.logs as { address: string; topics: readonly string[] }[])
    : null;

  const totalCost = useMemo(() => {
    const fee = parseFloat(DEFAULT_LAUNCH_FEE_BNB);
    const buy = parseFloat(preSale || "0") || 0;
    return (fee + buy).toFixed(4);
  }, [preSale]);

  const validate = (): string | null => {
    if (!name.trim()) return "Name required.";
    if (name.length > 80) return "Name max 80 chars.";
    if (!symbol.trim()) return "Symbol required.";
    if (symbol.length > 10) return "Symbol max 10 chars.";
    if (!/^[A-Z0-9]+$/.test(symbol)) return "Symbol: A-Z & 0-9 only.";
    if (!description.trim()) return "Description required.";
    if (description.length > 500) return "Description max 500 chars.";
    const buy = parseFloat(preSale || "0");
    if (preSale && (Number.isNaN(buy) || buy < 0 || buy > 10)) return "Pre-sale: 0-10 BNB.";
    return null;
  };

  const handleProceed = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setConfirmStep(true);
  };

  const handleLaunch = async () => {
    if (onWrongChain) {
      try {
        await switchChain({ chainId: FOUR_MEME_CHAIN_ID });
      } catch {
        toast.error("Switch to BNB Chain to continue.");
      }
      return;
    }

    try {
      const fee = parseEther(DEFAULT_LAUNCH_FEE_BNB);
      const buy = parseEther(preSale || "0");
      const value = fee + buy;

      await writeContractAsync({
        address: TOKEN_MANAGER_HELPER_ADDRESS,
        abi: TOKEN_MANAGER_HELPER_ABI,
        functionName: "createToken",
        args: [
          {
            name,
            shortName: symbol,
            desc: description,
            imgUrl: imageUrl,
            launchTime: BigInt(Math.floor(Date.now() / 1000)),
            preSale: buy,
            label: "Meme",
            webUrl: website,
            twitterUrl: twitter,
            telegramUrl: telegram,
          },
        ],
        value,
        chainId: FOUR_MEME_CHAIN_ID,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Launch failed.";
      // user reject vs real error
      if (/reject|denied/i.test(msg)) {
        toast.error("Transaction rejected.");
      } else {
        toast.error(msg.slice(0, 200));
        console.error(e);
      }
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  // Lock body scroll while modal is open so users can't accidentally
  // scroll the page underneath, and the centered modal stays in viewport.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (typeof document === "undefined") return null;

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cc-fade-up"
      onClick={close}
    >
      <div
        className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-background border border-border shadow-[0_0_60px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-border"
          style={{
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--rising) 18%, transparent), transparent)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <Rocket size={16} className="text-primary" />
            <div>
              <div className="text-[9px] uppercase tracking-[0.3em] text-[color:var(--text-dim)] font-data">
                Launch on Four.meme · BNB Chain
              </div>
              <div className="font-display font-bold text-[18px] tracking-tight leading-tight">
                {signal.name}
              </div>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1.5 text-[color:var(--text-dim)] hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {isSuccess ? (
          <SuccessState tokenAddress={launchedToken} txHash={txHash} onClose={close} />
        ) : !isConnected ? (
          <div className="p-8 text-center">
            <p className="text-[13px] text-[color:var(--text-dim)] mb-5">
              Connect your wallet to deploy on Four.meme.
            </p>
            <ConnectWallet />
          </div>
        ) : confirmStep ? (
          <ConfirmStep
            name={name}
            symbol={symbol}
            preSale={preSale}
            totalCost={totalCost}
            onWrongChain={onWrongChain}
            switching={switching}
            signing={signing}
            waiting={waiting}
            onBack={() => setConfirmStep(false)}
            onLaunch={handleLaunch}
          />
        ) : (
          <div className="p-6 space-y-4">
            {aiPrefilled && (
              <div
                className="flex items-start gap-2 px-3 py-2 border text-[11px] leading-relaxed"
                style={{
                  borderColor: "color-mix(in oklab, var(--primary) 50%, transparent)",
                  background: "color-mix(in oklab, var(--primary) 8%, transparent)",
                }}
              >
                <Sparkles size={12} className="text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-foreground font-data uppercase tracking-widest text-[9px] mb-1">
                    AI Meme Kit · auto-prefilled
                  </div>
                  <div className="text-[color:var(--text-dim)]">
                    Description, ticker & vibe seeded from Groq — keep it spicy. Edit anything before launch.
                    {prefill?.audience && (
                      <span className="block mt-1 text-[10px] uppercase tracking-widest font-data">
                        Audience: <span className="text-foreground normal-case tracking-normal">{prefill.audience}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Field label="Token Name *">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="w-full bg-surface border border-border focus:border-primary focus:outline-none px-3 py-2.5 font-data text-[13px]"
              />
            </Field>

            <Field label="Symbol / Ticker * (max 10, A-Z 0-9)">
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                maxLength={10}
                className="w-full bg-surface border border-border focus:border-primary focus:outline-none px-3 py-2.5 font-data text-[13px] uppercase"
              />
            </Field>

            <Field label="Description * — keep it meme, not whitepaper">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="say it loud. say it dumb. say it like a tweet. ☕️🐸 wagmi"
                className="w-full bg-surface border border-border focus:border-primary focus:outline-none px-3 py-2.5 font-data text-[12px] resize-none"
              />
              <div className="text-[9px] text-[color:var(--text-dim)] mt-1 flex items-center justify-between">
                <span className="text-[color:var(--text-faint)]">tip: emojis, lowercase, vibes &gt; lore</span>
                <span>{description.length}/500</span>
              </div>
            </Field>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-[10px] uppercase tracking-widest font-data text-[color:var(--text-dim)] hover:text-primary"
            >
              {showAdvanced ? "− Hide advanced" : "+ Advanced options"}
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-2 border-t border-border">
                <Field label="Logo (upload PNG/JPG/SVG, max 200 KB) — or paste URL">
                  <div className="flex items-stretch gap-2">
                    {logoPreview ? (
                      <div className="relative w-[68px] h-[68px] border border-border bg-surface flex-shrink-0">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => { setLogoPreview(null); setImageUrl(""); }}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-[color:var(--text-dim)] hover:text-primary"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <label className="w-[68px] h-[68px] border border-dashed border-border bg-surface flex-shrink-0 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/60 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleLogoFile(f);
                            e.target.value = "";
                          }}
                        />
                        {logoUploading
                          ? <Loader2 size={14} className="text-primary animate-spin" />
                          : <Upload size={14} className="text-[color:var(--text-dim)]" />}
                        <span className="text-[8px] uppercase tracking-widest text-[color:var(--text-dim)] font-data">
                          {logoUploading ? "Reading" : "Upload"}
                        </span>
                      </label>
                    )}
                    <input
                      value={logoPreview ? "(uploaded image attached)" : imageUrl}
                      onChange={(e) => {
                        if (logoPreview) return;
                        setImageUrl(e.target.value);
                      }}
                      placeholder="https://... or upload a file"
                      maxLength={300}
                      disabled={!!logoPreview}
                      className="flex-1 bg-surface border border-border focus:border-primary focus:outline-none px-3 py-2 font-data text-[12px] disabled:opacity-60"
                    />
                  </div>
                </Field>
                <Field label="Initial buy (BNB, optional, 0-10)">
                  <input
                    value={preSale}
                    onChange={(e) => setPreSale(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                    className="w-full bg-surface border border-border focus:border-primary focus:outline-none px-3 py-2 font-data text-[12px]"
                  />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Twitter">
                    <input
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://x.com/..."
                      maxLength={200}
                      className="w-full bg-surface border border-border focus:border-primary focus:outline-none px-2 py-2 font-data text-[11px]"
                    />
                  </Field>
                  <Field label="Telegram">
                    <input
                      value={telegram}
                      onChange={(e) => setTelegram(e.target.value)}
                      placeholder="https://t.me/..."
                      maxLength={200}
                      className="w-full bg-surface border border-border focus:border-primary focus:outline-none px-2 py-2 font-data text-[11px]"
                    />
                  </Field>
                  <Field label="Website">
                    <input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://..."
                      maxLength={200}
                      className="w-full bg-surface border border-border focus:border-primary focus:outline-none px-2 py-2 font-data text-[11px]"
                    />
                  </Field>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 px-3 py-2.5 border border-border bg-surface/60 text-[11px] text-[color:var(--text-dim)] leading-relaxed">
              <Info size={12} className="text-primary shrink-0 mt-0.5" />
              <span>
                Estimated cost: <span className="font-data text-foreground">{totalCost} BNB</span>{" "}
                ({DEFAULT_LAUNCH_FEE_BNB} fee + {preSale || "0"} initial buy) + gas. You'll review before signing.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={close}
                className="px-4 py-2.5 border border-border text-[11px] uppercase tracking-widest font-data hover:border-primary/50"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-[11px] uppercase tracking-widest font-data font-semibold hover:opacity-90"
              >
                Review & Launch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render outside the (possibly transformed/scrollable) ancestor so the
  // fixed overlay always sits on the actual viewport.
  return createPortal(modal, document.body);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-widest text-[color:var(--text-dim)] font-data mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function ConfirmStep({
  name,
  symbol,
  preSale,
  totalCost,
  onWrongChain,
  switching,
  signing,
  waiting,
  onBack,
  onLaunch,
}: {
  name: string;
  symbol: string;
  preSale: string;
  totalCost: string;
  onWrongChain: boolean;
  switching: boolean;
  signing: boolean;
  waiting: boolean;
  onBack: () => void;
  onLaunch: () => void;
}) {
  const busy = switching || signing || waiting;
  return (
    <div className="p-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-dim)] font-data mb-4">
        Review · Sign in wallet
      </div>
      <div className="grid grid-cols-2 border-t border-l border-border mb-5">
        {[
          ["Token", name],
          ["Symbol", `$${symbol}`],
          ["Launch fee", `${DEFAULT_LAUNCH_FEE_BNB} BNB`],
          ["Initial buy", `${preSale || "0"} BNB`],
          ["Total (excl. gas)", `${totalCost} BNB`],
          ["Network", "BNB Smart Chain"],
        ].map(([l, v]) => (
          <div key={l} className="border-b border-r border-border p-3">
            <div className="text-[9px] uppercase tracking-widest text-[color:var(--text-dim)] mb-1 font-data">
              {l}
            </div>
            <div className="text-[13px] font-data truncate">{v}</div>
          </div>
        ))}
      </div>

      {onWrongChain && (
        <div className="px-3 py-2 mb-3 border border-warn text-[11px] text-warn font-data">
          Wrong network — switch to BNB Smart Chain.
        </div>
      )}

      <div className="text-[11px] text-[color:var(--text-dim)] mb-4 leading-relaxed">
        Once you sign, the token deploys on-chain via Four.meme's TokenManagerHelper3. This action is
        irreversible. Excess BNB is refunded automatically.
      </div>

      <div className="flex justify-between gap-2">
        <button
          onClick={onBack}
          disabled={busy}
          className="px-4 py-2.5 border border-border text-[11px] uppercase tracking-widest font-data hover:border-primary/50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={onLaunch}
          disabled={busy}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-[11px] uppercase tracking-widest font-data font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {busy && <Loader2 size={12} className="animate-spin" />}
          {switching
            ? "Switching network…"
            : signing
            ? "Sign in wallet…"
            : waiting
            ? "Confirming…"
            : onWrongChain
            ? "Switch to BNB Chain"
            : "Sign & Launch"}
        </button>
      </div>
    </div>
  );
}

function SuccessState({
  tokenAddress,
  txHash,
  onClose,
}: {
  tokenAddress: string | null;
  txHash?: Hex;
  onClose: () => void;
}) {
  const fmUrl = tokenAddress ? `https://four.meme/token/${tokenAddress}` : "https://four.meme";
  const txUrl = txHash ? `https://bscscan.com/tx/${txHash}` : null;
  return (
    <div className="p-8 text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-4"
        style={{ background: "color-mix(in oklab, var(--rising) 25%, transparent)" }}
      >
        <Rocket size={20} style={{ color: "var(--rising)" }} />
      </div>
      <h3 className="font-display font-bold text-[22px] tracking-tight mb-2">Token launched 🎉</h3>
      <p className="text-[12px] text-[color:var(--text-dim)] mb-5">
        Your token is now live on Four.meme. Share early — the first 30 minutes matter most.
      </p>
      {tokenAddress && (
        <div className="font-data text-[11px] mb-5 break-all px-3 py-2 border border-border bg-surface">
          {tokenAddress}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <a
          href={fmUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-[11px] uppercase tracking-widest font-data font-semibold hover:opacity-90"
        >
          View on Four.meme <ExternalLink size={12} />
        </a>
        {txUrl && (
          <a
            href={txUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-[11px] uppercase tracking-widest font-data hover:border-primary/50"
          >
            View transaction <ExternalLink size={12} />
          </a>
        )}
        <button
          onClick={onClose}
          className="text-[10px] uppercase tracking-widest text-[color:var(--text-dim)] hover:text-primary mt-2"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Best-effort: extract created token address from event logs.
// Four.meme emits a TokenCreate event whose topics[1] holds the address.
function extractTokenAddress(
  logs: { address: string; topics: readonly string[] }[] | undefined,
): string | null {
  if (!logs || logs.length === 0) return null;
  // Look for a log with an address-shaped topic[1] (32-byte padded address).
  for (const log of logs) {
    const t1 = log.topics?.[1];
    if (t1 && t1.length === 66) {
      return ("0x" + t1.slice(26)).toLowerCase();
    }
  }
  return null;
}
