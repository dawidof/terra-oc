import { cn } from "@/lib/utils";

/**
 * TerraAuto wordmark. Server-safe so it can be used in both the public header
 * and the CRM shell without creating a client boundary.
 */
export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 font-semibold tracking-[-0.02em] text-foreground",
        size === "sm" ? "text-base" : "text-lg",
        className
      )}
    >
      <span className="size-2 shrink-0 rounded-full bg-brand" aria-hidden />
      TerraAuto
    </span>
  );
}
