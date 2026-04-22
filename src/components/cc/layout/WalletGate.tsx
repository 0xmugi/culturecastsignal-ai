import { useAccount } from "wagmi";
import { Lock, Wallet, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { ConnectWallet } from "@/components/cc/layout/ConnectWallet";

interface WalletGateProps {
  feature: string;
  description: string;
  children: ReactNode;
}

/**
 * Gates a feature behind a connected wallet.
 * Used to prevent anonymous abuse of paid API quotas (BscScan, Anthropic).
 */
export function WalletGate({ feature, description, children }: WalletGateProps) {
  const { isConnected } = useAccount();
  if (isConnected) return <>{children}</>;

  return (
    <div className="flex-1 min-h-[70vh] grid place-items-center px-6 py-16">
      <div className="max-w-lg w-full border border-border bg-surface p-8 md:p-10 text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 border border-border mb-5">
          <Lock size={18} className="text-primary" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.4em] text-primary font-data mb-3">
          Wallet required
        </div>
        <h1 className="font-display font-bold text-[28px] md:text-[34px] leading-[1.05] tracking-tight mb-3">
          Connect a wallet to access {feature}.
        </h1>
        <p className="text-[13.5px] text-[color:var(--text-dim)] leading-relaxed mb-7">
          {description}
        </p>

        <div className="inline-block mb-6">
          <ConnectWallet />
        </div>

        <div className="cc-hairline my-6" />

        <div className="flex items-start gap-3 text-left text-[12px] text-[color:var(--text-dim)] leading-relaxed">
          <ShieldCheck size={14} className="text-primary shrink-0 mt-0.5" />
          <p>
            Wallet auth scopes API usage and lets you bring your own keys later. We never request signatures or transactions just to view data.
          </p>
        </div>
        <div className="flex items-start gap-3 text-left text-[12px] text-[color:var(--text-dim)] leading-relaxed mt-3">
          <Wallet size={14} className="text-primary shrink-0 mt-0.5" />
          <p>Any BNB Chain compatible wallet works — MetaMask, Trust, Rabby, WalletConnect.</p>
        </div>
      </div>
    </div>
  );
}
