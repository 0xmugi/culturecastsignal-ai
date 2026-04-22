import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { LogoMark } from "@/components/cc/layout/Logo";

/**
 * Marketing-page topbar. Used on landing/about/docs/pricing where there is no Sidebar.
 */
export function Topbar() {
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/docs", label: "Docs" },
    { to: "/about", label: "About" },
    { to: "/pricing", label: "Pricing" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="CultureCast home">
          <LogoMark size={26} />
          <span className="font-display font-bold text-[14px] tracking-tight">CultureCast</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-[12px] uppercase tracking-widest font-data text-[color:var(--text-dim)] hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/drift"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[11px] uppercase tracking-widest font-data font-semibold hover:opacity-90 transition-opacity"
          >
            Launch App <ArrowRight size={12} />
          </Link>
        </nav>

        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-6 py-5 flex flex-col gap-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-[13px] uppercase tracking-widest font-data text-[color:var(--text-dim)]"
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/drift"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-[12px] uppercase tracking-widest font-data font-semibold"
            >
              Launch App <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
