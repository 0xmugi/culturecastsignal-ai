import { type Plan, PLAN_META, type Feature, FEATURES, isFeatureAvailable } from "@/lib/plan";
import { Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface PlanBadgeProps {
  plan: Plan;
  size?: "sm" | "md";
  showSoon?: boolean;
}

export function PlanBadge({ plan, size = "sm", showSoon }: PlanBadgeProps) {
  const meta = PLAN_META[plan];
  const px = size === "sm" ? "px-1.5 py-0.5" : "px-2.5 py-1";
  const fs = size === "sm" ? "text-[9px]" : "text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1 ${px} ${fs} font-data font-bold uppercase tracking-widest text-background`}
      style={{ background: meta.gradient }}
    >
      {plan !== "free" && <Sparkles size={size === "sm" ? 9 : 11} />}
      {meta.label}
      {showSoon && <span className="opacity-90">· Soon</span>}
    </span>
  );
}

interface FeatureBadgeProps {
  feature: Feature;
  size?: "sm" | "md";
}

export function FeatureBadge({ feature, size = "sm" }: FeatureBadgeProps) {
  const meta = FEATURES[feature];
  return <PlanBadge plan={meta.minPlan} size={size} showSoon={meta.comingSoon} />;
}

interface PlanGateProps {
  feature: Feature;
  children: ReactNode;
  /** Show locked overlay instead of replacing children. Children render disabled below. */
  overlay?: boolean;
  /** Custom title for the locked card. */
  title?: string;
  /** Custom description. */
  description?: string;
}

/**
 * Wraps children with a "coming soon / requires Pro" overlay.
 * On Free plan with a Pro/Elite feature, shows the gate.
 */
export function PlanGate({ feature, children, overlay, title, description }: PlanGateProps) {
  const available = isFeatureAvailable(feature);
  const meta = FEATURES[feature];

  if (available) return <>{children}</>;

  if (overlay) {
    return (
      <div className="relative">
        <div className="pointer-events-none opacity-30 select-none">{children}</div>
        <LockedOverlay feature={feature} title={title} description={description} />
      </div>
    );
  }

  return (
    <div className="border border-border bg-surface/40 p-5 flex items-start gap-3">
      <Lock size={16} className="text-[color:var(--text-dim)] shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[13px] font-display font-bold tracking-tight">
            {title ?? meta.label}
          </span>
          <FeatureBadge feature={feature} />
        </div>
        <p className="text-[12px] text-[color:var(--text-dim)] leading-relaxed">
          {description ?? `${meta.label} unlocks with the ${PLAN_META[meta.minPlan].label} plan — coming soon.`}
        </p>
      </div>
    </div>
  );
}

function LockedOverlay({
  feature,
  title,
  description,
}: {
  feature: Feature;
  title?: string;
  description?: string;
}) {
  const meta = FEATURES[feature];
  return (
    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px] bg-background/60">
      <div className="border border-border bg-background p-5 max-w-sm text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Lock size={14} className="text-[color:var(--text-dim)]" />
          <FeatureBadge feature={feature} />
        </div>
        <div className="text-[14px] font-display font-bold tracking-tight mb-1.5">
          {title ?? meta.label}
        </div>
        <p className="text-[11.5px] text-[color:var(--text-dim)] leading-relaxed">
          {description ?? `Unlocks with ${PLAN_META[meta.minPlan].label}. Coming soon.`}
        </p>
      </div>
    </div>
  );
}
