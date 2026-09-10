import { Eyebrow, Heading } from "@/components/ui/section";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  size?: "lg" | "xl" | "2xl";
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  align = "center",
  size = "xl",
  className,
  children,
}: PageHeaderProps) {
  const centered = align === "center";

  return (
    <div className={cn(centered && "text-center", className)}>
      {eyebrow && (
        <Eyebrow tone="brand" className={cn(!centered && "text-left")}>
          {eyebrow}
        </Eyebrow>
      )}
      <Heading
        as="h1"
        size={size}
        className={cn("mt-4", centered && "mx-auto max-w-3xl")}
      >
        {title}
      </Heading>
      {description && (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed text-muted-foreground",
            centered && "mx-auto max-w-2xl"
          )}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
