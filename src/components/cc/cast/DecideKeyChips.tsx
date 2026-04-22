import { Link } from "@tanstack/react-router";
import { Key, Sparkles } from "lucide-react";
import type { BscTokenInfo } from "@/lib/bscscan.functions";
import type { AIDecideResult } from "@/lib/aiDecide.functions";

export function DecideKeyChips({
  tokenInfo,
  aiResult,
  isConnected,
}: {
  tokenInfo: BscTokenInfo;
  aiResult: AIDecideResult;
  isConnected: boolean;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 text-[10px] font-data uppercase tracking-widest">
      <span
        className="px-2 py-1 border flex items-center gap-1.5"
        style={{
          borderColor: tokenInfo.keySource === "user" ? "var(--primary)" : "var(--border)",
          color: tokenInfo.keySource === "user" ? "var(--primary)" : "var(--text-dim)",
        }}
      >
        <Key size={10} />
        {tokenInfo.keySource === "user" ? "Your BscScan" : "Shared BscScan"}
      </span>
      <span
        className="px-2 py-1 border flex items-center gap-1.5"
        style={{
          borderColor: aiResult.keySource === "user" ? "var(--primary)" : "var(--border)",
          color: aiResult.keySource === "user" ? "var(--primary)" : "var(--text-dim)",
        }}
      >
        <Sparkles size={10} />
        {aiResult.keySource === "user" ? `Your ${aiResult.provider}` : `Shared ${aiResult.provider}`}
      </span>
      {(tokenInfo.keySource !== "user" || aiResult.keySource !== "user") &&
        (isConnected ? (
          <Link to="/settings" className="text-[color:var(--text-dim)] hover:text-primary transition-colors">
            Add your keys →
          </Link>
        ) : (
          <span className="text-[color:var(--text-faint)] normal-case tracking-normal">
            Connect wallet to add your own keys
          </span>
        ))}
      {aiResult.error && (
        <span className="text-warn normal-case tracking-normal">⚠ {aiResult.error}</span>
      )}
    </div>
  );
}
