import type { VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  badgeVariants,
  eyebrowVariants,
  headingVariants,
  sectionVariants,
} from "@/lib/variants";

const backgroundClass = {
  default: "",
  muted: "bg-muted",
  accent: "bg-brand-muted",
  card: "bg-card",
} as const;

interface SectionProps extends VariantProps<typeof sectionVariants> {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}

/**
 * Full-bleed section wrapper. Background and top divider live on the outer
 * element so bands span the viewport; padding lives on the inner container.
 */
export function Section({
  padding,
  background = "default",
  divide = false,
  id,
  className,
  containerClassName,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        backgroundClass[background ?? "default"],
        divide && "border-t border-border",
        className
      )}
    >
      <div className={cn(sectionVariants({ padding }), containerClassName)}>
        {children}
      </div>
    </section>
  );
}

interface HeadingProps extends VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  children: React.ReactNode;
}

export function Heading({
  as: Tag = "h2",
  size = "md",
  tone,
  className,
  children,
}: HeadingProps) {
  return (
    <Tag className={cn(headingVariants({ size, tone }), className)}>
      {children}
    </Tag>
  );
}

interface EyebrowProps extends VariantProps<typeof eyebrowVariants> {
  className?: string;
  children: React.ReactNode;
}

export function Eyebrow({ tone, className, children }: EyebrowProps) {
  return (
    <p className={cn(eyebrowVariants({ tone }), className)}>{children}</p>
  );
}

interface TagProps extends VariantProps<typeof badgeVariants> {
  className?: string;
  children: React.ReactNode;
}

export function Tag({ variant, className, children }: TagProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>{children}</span>
  );
}
