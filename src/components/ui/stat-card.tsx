import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const tileTone = {
  default: "bg-muted text-muted-foreground",
  brand: "bg-brand-muted text-brand-muted-foreground",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  success: "bg-brand-muted text-brand-muted-foreground",
  info: "bg-blue-50 text-blue-600",
} as const;

const valueTone = {
  default: "text-foreground",
  brand: "text-foreground",
  warning: "text-amber-700",
  danger: "text-red-700",
  success: "text-foreground",
  info: "text-foreground",
} as const;

export type StatTone = keyof typeof tileTone;

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Single stat-card implementation shared by the CRM dashboard, leads view,
 * analytics and import pages.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
  children,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-3 rounded-xl bg-card p-5 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              tileTone[tone]
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      <div>
        <p
          className={cn(
            "text-3xl font-semibold tracking-[-0.02em] tabular-nums",
            valueTone[tone]
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function StatGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}
