import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Sidebar } from "@/components/cc/layout/Sidebar";
import { MobileTabBar } from "@/components/cc/layout/MobileTabBar";
import { ConnectWallet } from "@/components/cc/layout/ConnectWallet";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Wallet,
  Eye,
  EyeOff,
  Trash2,
  Check,
  ExternalLink,
  ShieldCheck,
  Key,
  Lock,
  Pencil,
  Radar as RadarIcon,
  Brain,
} from "lucide-react";
import { loadUserKeys, saveUserKeys, clearUserKeys, maskKey, type UserKeys } from "@/lib/userKeys";
import { FeatureBadge } from "@/components/cc/layout/PlanBadge";
import type { Feature } from "@/lib/plan";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CultureCast" },
      { name: "description", content: "Bring your own AI and on-chain API keys for unlimited CultureCast usage." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-screen flex bg-background text-foreground cc-page-enter">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
        <div className="flex justify-end px-6 md:px-10 pt-6 border-b border-border pb-5">
          <ConnectWallet />
        </div>

        <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16">
          <div className="text-[10px] uppercase tracking-[0.4em] text-primary font-data mb-4">Settings</div>
          <h1 className="font-display font-bold text-[44px] md:text-[60px] leading-[0.95] tracking-tight mb-4">
            API Keys.
          </h1>
          <p className="text-[15px] text-[color:var(--text-dim)] max-w-xl mb-12">
            CultureCast ships with shared platform keys so you can start instantly on a Free trial. Bring your own keys for unlimited usage. Stored locally in your browser, scoped to your wallet.
          </p>

          {!isConnected ? (
            <NotConnected />
          ) : (
            <KeysSections walletAddress={address!} />
          )}

          <SecurityNote />
        </div>
      </main>
      <MobileTabBar />
      <Toaster />
    </div>
  );
}

function NotConnected() {
  return (
    <div className="border border-border bg-surface p-10 text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 border border-border mb-5">
        <Wallet size={20} className="text-primary" />
      </div>
      <h2 className="font-display font-bold text-[24px] tracking-tight mb-3">Connect a wallet to continue</h2>
      <p className="text-[13px] text-[color:var(--text-dim)] max-w-md mx-auto mb-6">
        Settings are scoped per wallet address. Connect any BNB Chain wallet to add or update your personal API keys.
      </p>
      <div className="inline-block">
        <ConnectWallet />
      </div>
    </div>
  );
}

interface ProviderMeta {
  id: keyof UserKeys;
  name: string;
  tag: string;
  description: string;
  url: string;
  placeholder: string;
  prefix?: string;
  feature: Feature;
}

const RADAR_PROVIDERS: ProviderMeta[] = [
  {
    id: "bscscan",
    name: "BscScan",
    tag: "On-chain data",
    description: "Pulls live holders, transfers, and token metadata for any BNB Chain contract. Used by Drift feed enrichment and Cast.",
    url: "https://bscscan.com/myapikey",
    placeholder: "ABCD1234EFGH5678IJKL...",
    feature: "radar.basic",
  },
  {
    id: "groq",
    name: "Groq",
    tag: "Drift AI summary",
    description: "Generates per-signal AI Analysis on Drift (launch kit, ready-to-post memes, timing). Llama 3.3 70B, sub-second responses, generous free tier.",
    url: "https://console.groq.com/keys",
    placeholder: "gsk_...",
    prefix: "gsk_",
    feature: "radar.basic",
  },
];

const DECIDE_PROVIDERS: ProviderMeta[] = [
  {
    id: "anthropic",
    name: "Anthropic Claude",
    tag: "Cast AI · Default",
    description: "Powers BUY / WAIT / AVOID verdicts on Cast. Claude 3.5 Haiku — strong reasoning, balanced cost.",
    url: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-api03-...",
    prefix: "sk-ant-",
    feature: "decide.basic",
  },
  {
    id: "openai",
    name: "OpenAI GPT",
    tag: "Cast AI · Multi-AI",
    description: "Alternate AI for Cast verdicts. GPT-4o mini — fast, structured JSON output.",
    url: "https://platform.openai.com/api-keys",
    placeholder: "sk-proj-...",
    prefix: "sk-",
    feature: "decide.multiAI",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    tag: "Cast AI · Multi-AI",
    description: "Alternate AI for Cast verdicts. Gemini Flash — Google's fast multimodal model.",
    url: "https://aistudio.google.com/apikey",
    placeholder: "AIza...",
    prefix: "AIza",
    feature: "decide.multiAI",
  },
];

function KeysSections({ walletAddress }: { walletAddress: string }) {
  const [keys, setKeys] = useState<UserKeys>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const k = loadUserKeys(walletAddress);
    setKeys(k);
    setLoaded(true);
  }, [walletAddress]);

  const update = (id: keyof UserKeys, value: string | undefined) => {
    const next: UserKeys = { ...keys };
    if (value === undefined) {
      delete next[id];
    } else {
      next[id] = value;
    }
    saveUserKeys(next, walletAddress);
    setKeys(next);
  };

  const onClearAll = () => {
    clearUserKeys(walletAddress);
    setKeys({});
    toast.success("All keys reset to platform defaults.");
  };

  if (!loaded) return null;

  const hasAny = Object.values(keys).some(Boolean);

  return (
    <div className="flex flex-col gap-10">
      <WalletHeader walletAddress={walletAddress} hasAny={hasAny} onClearAll={onClearAll} />

      <SectionGroup
        icon={<RadarIcon size={14} className="text-primary" />}
        title="Drift"
        subtitle="Powers the trending signal feed and AI launch kit per signal."
        providers={RADAR_PROVIDERS}
        keys={keys}
        update={update}
      />

      <SectionGroup
        icon={<Brain size={14} className="text-primary" />}
        title="Cast"
        subtitle="Powers the BUY / WAIT / AVOID engine. Pick any provider on the Cast page — bring keys for the ones you want to use."
        providers={DECIDE_PROVIDERS}
        keys={keys}
        update={update}
      />
    </div>
  );
}

function WalletHeader({
  walletAddress,
  hasAny,
  onClearAll,
}: {
  walletAddress: string;
  hasAny: boolean;
  onClearAll: () => void;
}) {
  return (
    <div className="border border-border bg-surface px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-[10px] font-data uppercase tracking-widest text-[color:var(--text-dim)]">
        <Key size={11} className="text-primary" />
        Wallet · <span className="text-foreground font-data normal-case">{walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}</span>
      </div>
      {hasAny && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-1.5 text-[10px] font-data uppercase tracking-widest text-[color:var(--text-dim)] hover:text-primary transition-colors"
        >
          <Trash2 size={11} /> Reset all
        </button>
      )}
    </div>
  );
}

function SectionGroup({
  icon,
  title,
  subtitle,
  providers,
  keys,
  update,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  providers: ProviderMeta[];
  keys: UserKeys;
  update: (id: keyof UserKeys, value: string | undefined) => void;
}) {
  return (
    <section>
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1.5">
          {icon}
          <h2 className="font-display font-bold text-[22px] tracking-tight">{title}</h2>
        </div>
        <p className="text-[12.5px] text-[color:var(--text-dim)] leading-relaxed max-w-xl">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-px bg-border border border-border">
        {providers.map((p) => (
          <ProviderRow
            key={p.id}
            provider={p}
            stored={keys[p.id]}
            onSave={(v) => update(p.id, v)}
            onRemove={() => update(p.id, undefined)}
          />
        ))}
      </div>
    </section>
  );
}

function ProviderRow({
  provider,
  stored,
  onSave,
  onRemove,
}: {
  provider: ProviderMeta;
  stored?: string;
  onSave: (v: string) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [reveal, setReveal] = useState(false);
  const [editing, setEditing] = useState(false);

  const save = () => {
    const value = draft.trim();
    if (!value) {
      toast.error("Enter a value first.");
      return;
    }
    if (provider.prefix && !value.startsWith(provider.prefix)) {
      toast.error(`${provider.name} keys start with "${provider.prefix}".`);
      return;
    }
    onSave(value);
    setDraft("");
    setEditing(false);
    toast.success(`${provider.name} key saved.`);
  };

  return (
    <div className="bg-background p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-display font-bold text-[18px] tracking-tight">{provider.name}</h3>
            <span className="font-data text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-primary text-primary">
              {provider.tag}
            </span>
            <FeatureBadge feature={provider.feature} />
          </div>
          <p className="text-[12.5px] text-[color:var(--text-dim)] max-w-md leading-relaxed">
            {provider.description}
          </p>
        </div>
        <a
          href={provider.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 text-[10px] font-data uppercase tracking-widest text-[color:var(--text-dim)] hover:text-primary transition-colors"
        >
          Get key <ExternalLink size={10} />
        </a>
      </div>

      {stored ? (
        <div className="flex items-center justify-between gap-3 mt-4 px-3 py-2.5 border border-border bg-surface">
          <div className="flex items-center gap-2 min-w-0">
            <Check size={13} className="text-primary shrink-0" />
            <span className="font-data text-[12px] truncate">
              {reveal ? stored : maskKey(stored)}
            </span>
            <span className="font-data text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-primary/40 text-primary ml-1">
              Your key
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setReveal((r) => !r)}
              className="p-1.5 text-[color:var(--text-dim)] hover:text-foreground transition-colors"
              aria-label={reveal ? "Hide" : "Reveal"}
            >
              {reveal ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              onClick={() => {
                onRemove();
                toast.success("Reverted to platform default key.");
              }}
              className="p-1.5 text-[color:var(--text-dim)] hover:text-primary transition-colors"
              aria-label="Remove"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ) : editing ? (
        <div className="flex items-center gap-2 mt-4">
          <input
            type={reveal ? "text" : "password"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder={provider.placeholder}
            spellCheck={false}
            autoComplete="off"
            autoFocus
            className="flex-1 bg-surface border border-border focus:border-primary focus:outline-none px-3 py-2.5 font-data text-[12px] tracking-tight placeholder:text-[color:var(--text-faint)] transition-colors"
          />
          <button
            onClick={() => setReveal((r) => !r)}
            className="p-2.5 border border-border hover:border-primary text-[color:var(--text-dim)] hover:text-foreground transition-colors"
            aria-label={reveal ? "Hide" : "Reveal"}
          >
            {reveal ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            onClick={() => {
              setEditing(false);
              setDraft("");
            }}
            className="px-3 py-2.5 border border-border text-[10px] uppercase tracking-widest font-data text-[color:var(--text-dim)] hover:text-foreground hover:border-primary/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="px-4 py-2.5 bg-primary text-primary-foreground text-[11px] uppercase tracking-widest font-data font-semibold hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 mt-4 px-3 py-2.5 border border-border bg-surface/60">
          <div className="flex items-center gap-2 min-w-0">
            <Lock size={13} className="text-[color:var(--text-dim)] shrink-0" />
            <span className="font-data text-[12px] tracking-tight text-[color:var(--text-dim)] truncate">
              •••• •••• •••• ••••
            </span>
            <span className="font-data text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-border text-[color:var(--text-dim)] ml-1">
              Platform default · rate-limited
            </span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border border-border hover:border-primary text-[10px] uppercase tracking-widest font-data font-semibold hover:text-primary transition-colors"
          >
            <Pencil size={11} />
            Use my own key
          </button>
        </div>
      )}
    </div>
  );
}

function SecurityNote() {
  return (
    <div className="mt-10 border border-border bg-surface p-5 flex items-start gap-3">
      <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
      <div className="text-[12.5px] leading-relaxed text-[color:var(--text-dim)]">
        <span className="text-foreground font-semibold">Security:</span> Platform default keys live on our server only and cannot be viewed or copied. Your own keys are stored in your browser&apos;s{" "}
        <code className="font-data text-foreground">localStorage</code>, scoped to your wallet address, and are{" "}
        <span className="text-foreground">never persisted on our servers</span> — only forwarded per-request as headers when calling BscScan, Groq, OpenAI, Gemini, or Anthropic.
        {" "}Don&apos;t use this device if you don&apos;t trust it. See{" "}
        <Link to="/docs/api" className="text-primary hover:underline">
          API docs
        </Link>{" "}
        for details.
      </div>
    </div>
  );
}
