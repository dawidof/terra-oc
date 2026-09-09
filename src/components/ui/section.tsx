import { sectionVariants, headingVariants, badgeVariants } from "@/lib/variants";

interface SectionProps {
  padding?: "default" | "tight" | "spacious";
  background?: "default" | "muted" | "accent";
  children: React.ReactNode;
}

export function Section({ padding = "default", background = "default", children }: SectionProps) {
  return (
    <section className={sectionVariants({ padding, background })}>
      {children}
    </section>
  );
}

interface HeadingProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  className?: string;
}

export function Heading({ size = "md", children, className }: HeadingProps) {
  return (
    <h2 className={headingVariants({ size, className })}>
      {children}
    </h2>
  );
}

export function StatusBadge({ variant = "default", children }: { variant?: "default" | "warning" | "danger" | "info" | "neutral"; children: React.ReactNode }) {
  return <span className={badgeVariants({ variant })}>{children}</span>;
}
