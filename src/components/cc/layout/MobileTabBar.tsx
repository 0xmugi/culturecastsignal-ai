import { Link, useLocation } from "@tanstack/react-router";
import { Radar, Brain, BookOpen, Home, Bookmark } from "lucide-react";
import { useAccount } from "wagmi";

export function MobileTabBar() {
  const { pathname } = useLocation();
  const { isConnected } = useAccount();
  const items = isConnected
    ? ([
        { to: "/drift", label: "Drift", icon: Radar },
        { to: "/cast", label: "Cast", icon: Brain },
        { to: "/tracked", label: "Tracked", icon: Bookmark },
        { to: "/docs", label: "Docs", icon: BookOpen },
      ] as const)
    : ([
        { to: "/", label: "Home", icon: Home },
        { to: "/drift", label: "Drift", icon: Radar },
        { to: "/cast", label: "Cast", icon: Brain },
        { to: "/docs", label: "Docs", icon: BookOpen },
      ] as const);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 grid grid-cols-4 border-t border-border bg-sidebar">
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-widest"
            style={{ color: active ? "var(--primary)" : "var(--text-dim)" }}
          >
            <Icon size={16} strokeWidth={1.5} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
