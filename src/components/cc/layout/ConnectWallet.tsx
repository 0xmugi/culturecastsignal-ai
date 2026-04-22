import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

export function ConnectWallet({ compact = false }: { compact?: boolean }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        const base =
          "flex items-center gap-2 font-data text-[11px] uppercase tracking-widest font-semibold transition-colors";
        const primary =
          "px-3 py-2 bg-primary text-primary-foreground hover:opacity-90";
        const ghost =
          "px-3 py-2 border border-border hover:border-primary text-foreground";

        if (!ready) {
          return <div className={`${base} ${ghost} opacity-0 pointer-events-none`}>···</div>;
        }

        if (!connected) {
          return (
            <button onClick={openConnectModal} className={`${base} ${primary}`}>
              <Wallet size={13} />
              {compact ? "Connect" : "Connect Wallet"}
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button onClick={openChainModal} className={`${base} ${primary}`}>
              Wrong Network
            </button>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button onClick={openChainModal} className={`${base} ${ghost} hidden sm:flex`}>
              <span className="h-1.5 w-1.5 rounded-full bg-primary cc-pulse-dot" />
              {chain.name}
            </button>
            <button onClick={openAccountModal} className={`${base} ${ghost}`}>
              <Wallet size={13} />
              {account.displayName}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
