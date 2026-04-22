import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

export interface DocSubSection {
  id: string;
  label: string;
}

export interface DocNavItem {
  to: string;
  label: string;
  sections: DocSubSection[];
}

export interface DocNavGroup {
  heading: string;
  items: DocNavItem[];
}

export const DOCS_NAV: DocNavGroup[] = [
  {
    heading: "Get Started",
    items: [
      {
        to: "/docs/getting-started",
        label: "Getting Started",
        sections: [
          { id: "overview", label: "Overview" },
          { id: "quickstart", label: "Quickstart" },
          { id: "local", label: "Run locally" },
          { id: "next", label: "Next steps" },
        ],
      },
    ],
  },
  {
    heading: "Product",
    items: [
      {
        to: "/docs/drift",
        label: "Drift — Pre-launch Radar",
        sections: [
          { id: "overview", label: "Overview" },
          { id: "feed", label: "The feed" },
          { id: "status", label: "Status pills" },
          { id: "launch-kit", label: "AI Launch Kit" },
          { id: "workflow", label: "Workflow" },
        ],
      },
      {
        to: "/docs/cast",
        label: "Cast — Token Verdict",
        sections: [
          { id: "overview", label: "Overview" },
          { id: "input", label: "Input" },
          { id: "data", label: "On-chain data" },
          { id: "verdict", label: "Verdict model" },
          { id: "workflow", label: "Workflow" },
        ],
      },
      {
        to: "/docs/tracked",
        label: "Tracked & AI Agent",
        sections: [
          { id: "overview", label: "Overview" },
          { id: "buckets", label: "Risk buckets" },
          { id: "data", label: "Live data sources" },
          { id: "agent", label: "AI Agent commands" },
          { id: "examples", label: "Example prompts" },
        ],
      },
      {
        to: "/docs/scoring",
        label: "Scoring System",
        sections: [
          { id: "overview", label: "Overview" },
          { id: "inputs", label: "Inputs" },
          { id: "bands", label: "Score bands" },
          { id: "decay", label: "Decay & freshness" },
        ],
      },
    ],
  },
  {
    heading: "Reference",
    items: [
      {
        to: "/docs/api",
        label: "API Reference",
        sections: [
          { id: "byok", label: "Bring Your Own Keys" },
          { id: "storage", label: "Key storage" },
          { id: "sources", label: "Data sources" },
          { id: "limits", label: "Rate limits" },
        ],
      },
      {
        to: "/docs/faq",
        label: "FAQ",
        sections: [
          { id: "general", label: "General" },
          { id: "ai", label: "AI providers" },
          { id: "wallet", label: "Wallet & keys" },
          { id: "payment", label: "Plans & payment" },
          { id: "data", label: "Data & exports" },
        ],
      },
      {
        to: "/docs/pricing",
        label: "Plans & Payment",
        sections: [
          { id: "overview", label: "Overview" },
          { id: "tiers", label: "Plan tiers" },
          { id: "byok", label: "Free + BYOK" },
          { id: "payment", label: "How to pay" },
          { id: "activation", label: "Activation" },
        ],
      },
    ],
  },
];

export function DocsSidebar({ activeAnchor }: { activeAnchor?: string }) {
  const location = useLocation();
  const pathname = location.pathname;
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOCS_NAV;
    return DOCS_NAV.map((g) => ({
      ...g,
      items: g.items.filter(
        (it) =>
          it.label.toLowerCase().includes(q) ||
          it.sections.some((s) => s.label.toLowerCase().includes(q)),
      ),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  return (
    <aside className="hidden lg:flex flex-col sticky top-0 h-screen w-[260px] shrink-0 border-r border-border bg-surface/30">
      <div className="px-5 pt-6 pb-4 border-b border-border">
        <Link
          to="/docs"
          className="font-display font-bold text-[15px] tracking-tight text-foreground hover:text-primary transition-colors block"
        >
          CultureCast / Docs
        </Link>
      </div>

      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--text-faint)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search docs..."
            className="w-full bg-background border border-border focus:border-primary focus:outline-none pl-7 pr-2 py-1.5 font-data text-[11px] tracking-tight placeholder:text-[color:var(--text-faint)] transition-colors"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {filtered.map((group) => (
          <div key={group.heading} className="mb-5">
            <div className="px-3 mb-2 font-data text-[10px] uppercase tracking-[0.3em] text-[color:var(--text-faint)]">
              {group.heading}
            </div>
            <ul className="flex flex-col">
              {group.items.map((item) => {
                const isActivePage = pathname === item.to;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="flex items-center justify-between px-3 py-1.5 text-[13px] transition-colors"
                      style={{
                        color: isActivePage
                          ? "var(--foreground)"
                          : "var(--text-dim)",
                        background: isActivePage
                          ? "color-mix(in oklab, var(--primary) 8%, transparent)"
                          : "transparent",
                        borderLeft: isActivePage
                          ? "2px solid var(--primary)"
                          : "2px solid transparent",
                        fontWeight: isActivePage ? 600 : 400,
                      }}
                    >
                      <span>{item.label}</span>
                      {isActivePage && (
                        <ChevronRight size={11} className="text-primary" />
                      )}
                    </Link>

                    {isActivePage && item.sections.length > 0 && (
                      <ul className="mt-1 mb-2 ml-5 border-l border-border flex flex-col">
                        {item.sections.map((s) => {
                          const isActiveAnchor = activeAnchor === s.id;
                          return (
                            <li key={s.id}>
                              <a
                                href={`#${s.id}`}
                                className="block pl-3 -ml-px py-1 text-[12px] transition-colors"
                                style={{
                                  color: isActiveAnchor
                                    ? "var(--primary)"
                                    : "var(--text-dim)",
                                  borderLeft: isActiveAnchor
                                    ? "1px solid var(--primary)"
                                    : "1px solid transparent",
                                  marginLeft: "-1px",
                                }}
                              >
                                {s.label}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border flex items-center justify-between text-[10px] font-data uppercase tracking-widest text-[color:var(--text-faint)]">
        <Link to="/changelog" className="hover:text-primary transition-colors">
          Changelog
        </Link>
        <Link to="/pricing" className="hover:text-primary transition-colors">
          Pricing
        </Link>
        <Link to="/about" className="hover:text-primary transition-colors">
          About
        </Link>
      </div>
    </aside>
  );
}
