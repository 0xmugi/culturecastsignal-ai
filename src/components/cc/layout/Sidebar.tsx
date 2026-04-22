import { Link, useLocation } from "@tanstack/react-router";
import { Radar, Brain, BookOpen, Info, Settings as SettingsIcon, Tag, Sparkles, Bookmark } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectWallet } from "@/components/cc/layout/ConnectWallet";
import { LogoMark } from "@/components/cc/layout/Logo";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  locked?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function Sidebar() {
  const { pathname } = useLocation();
  const { isConnected } = useAccount();

  const groups: NavGroup[] = [
    {
      label: "Overview",
      items: [
        { to: "/drift", label: "Drift", icon: Radar, locked: !isConnected },
        { to: "/cast", label: "Cast", icon: Brain, locked: !isConnected },
        { to: "/tracked", label: "Tracked", icon: Bookmark, locked: !isConnected },
      ],
    },
    {
      label: "Account",
      items: [
        { to: "/settings", label: "Settings", icon: SettingsIcon, locked: !isConnected },
      ],
    },
    {
      label: "Resources",
      items: [
        { to: "/docs", label: "Documentation", icon: BookOpen },
        { to: "/changelog", label: "Changelog", icon: Sparkles },
        { to: "/pricing", label: "Pricing", icon: Tag },
        { to: "/about", label: "About", icon: Info },
      ],
    },
  ];

  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-border bg-sidebar sticky top-0 h-screen overflow-y-auto">
      <div className="px-5 pt-6 pb-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 grid place-items-center bg-primary text-primary-foreground font-display font-bold text-sm tracking-tight">
            CC
          </div>
          <span className="font-display font-bold text-[15px] tracking-tight">
            CultureCast
          </span>
        </Link>
      </div>

      <nav className="px-3 flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <div className="px-3 pb-1.5 text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-faint)] font-data">
              {group.label}
            </div>
            {group.items.map(({ to, label, icon: Icon, locked }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative flex items-center gap-3 px-3 py-2 text-[13px] tracking-tight transition-colors hover:text-foreground group/item"
                  style={{ color: active ? "var(--foreground)" : "var(--text-dim)" }}
                  title={locked ? "Connect wallet to unlock" : undefined}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary cc-pulse-dot" />
                  )}
                  <Icon size={14} strokeWidth={1.5} className="ml-3 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {locked && (
                    <span className="text-[8px] uppercase tracking-widest font-data text-[color:var(--text-faint)] group-hover/item:text-primary">
                      ●
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="cc-hairline mx-5 my-5" />

      <div className="px-5 flex flex-col gap-3 text-[11px]">
        <Stat label="Signals" value="8" />
        <Stat label="Last scan" value="14s ago" />
        <div className="flex items-center justify-between">
          <span className="uppercase tracking-wider text-[color:var(--text-dim)]">BNB Chain</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary cc-pulse-dot" />
            <span className="font-data text-foreground">LIVE</span>
          </span>
        </div>
      </div>

      <div className="px-5 mt-5">
        <ConnectWallet compact />
      </div>

      <div className="mt-auto px-5 py-5 border-t border-border">
        <p className="text-[10px] uppercase tracking-widest text-[color:var(--text-faint)] leading-relaxed">
          Built for Four.meme<br />AI Sprint
        </p>
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="uppercase tracking-wider text-[color:var(--text-dim)]">{label}</span>
      <span className="font-data text-foreground">{value}</span>
    </div>
  );
}
