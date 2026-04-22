import { Link } from "@tanstack/react-router";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const LATEST_VERSION = "v0.4.0";
const LATEST_HEADLINE = "BYOK is live — bring your own BscScan & Claude keys.";
const STORAGE_KEY = "cc:whatsnew:dismissed";

export function WhatsNewBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      setDismissed(v === LATEST_VERSION);
    } catch {
      setDismissed(false);
    }
  }, []);

  const onDismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, LATEST_VERSION);
    } catch {
      // ignore
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="flex items-center gap-3 px-4 md:px-5 py-2.5">
        <span className="hidden sm:inline-flex h-5 items-center px-1.5 border border-primary text-primary text-[9px] font-data uppercase tracking-widest">
          New
        </span>
        <Sparkles size={13} className="text-primary shrink-0 sm:hidden" />
        <div className="flex-1 min-w-0 flex items-baseline gap-2 text-[12.5px]">
          <span className="font-data text-primary uppercase tracking-widest text-[10px] shrink-0 hidden md:inline">
            {LATEST_VERSION}
          </span>
          <span className="truncate text-foreground">{LATEST_HEADLINE}</span>
        </div>
        <Link
          to="/changelog"
          className="shrink-0 flex items-center gap-1 text-[10px] font-data uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
        >
          Read <ArrowRight size={11} />
        </Link>
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 text-[color:var(--text-dim)] hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
