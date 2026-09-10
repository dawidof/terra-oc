import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

export const sectionVariants = cva("container mx-auto px-4 sm:px-6", {
  variants: {
    padding: {
      default: "py-14 sm:py-20",
      tight: "py-8 sm:py-10",
      spacious: "py-20 sm:py-28",
      none: "",
    },
    background: {
      default: "",
      muted: "bg-muted",
      accent: "bg-brand-muted",
      card: "bg-card",
    },
    divide: {
      true: "border-t border-border",
      false: "",
    },
  },
  defaultVariants: {
    padding: "default",
    background: "default",
    divide: false,
  },
});

export const headingVariants = cva(
  "font-semibold tracking-[-0.03em] leading-[1.05] text-balance text-foreground",
  {
  variants: {
    size: {
      xs: "text-lg",
      sm: "text-xl",
      md: "text-2xl sm:text-3xl",
      lg: "text-3xl sm:text-4xl",
      xl: "text-4xl sm:text-5xl",
      "2xl": "text-[2.75rem] sm:text-6xl",
      "3xl": "text-[3.25rem] sm:text-7xl",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      inverse: "text-white",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "default",
  },
});

export const eyebrowVariants = cva(
  "inline-flex items-center gap-2 text-xs font-medium tracking-[0.14em] uppercase",
  {
    variants: {
      tone: {
        default: "text-muted-foreground",
        brand: "text-brand-muted-foreground",
      },
    },
    defaultVariants: {
      tone: "default",
    },
  }
);

/**
 * Canonical card surface. Editorial-minimal: hairline ring instead of a drop
 * shadow, so stacked cards read as crisp planes.
 */
export const surfaceVariants = cva("rounded-xl bg-card ring-1 ring-foreground/10", {
  variants: {
    interactive: {
      true: "transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-foreground/15",
      false: "",
    },
    padding: {
      none: "",
      sm: "p-4",
      default: "p-5 sm:p-6",
    },
  },
  defaultVariants: {
    interactive: false,
    padding: "none",
  },
});

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-brand-muted text-brand-muted-foreground",
        neutral: "bg-muted text-muted-foreground",
        outline: "border border-border text-foreground",
        solid: "bg-foreground text-background",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
        danger: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
        info: "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const cardHoverVariants = cva("transition-all duration-200", {
  variants: {
    hover: {
      true: "hover:-translate-y-0.5 hover:shadow-md",
      false: "",
    },
  },
  defaultVariants: {
    hover: true,
  },
});

export const paginationVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors",
  {
    variants: {
      state: {
        default: "hover:bg-muted",
        active: "bg-foreground text-background hover:bg-foreground",
        disabled: "cursor-not-allowed opacity-50",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

export type SectionVariants = VariantProps<typeof sectionVariants>;
export type HeadingVariants = VariantProps<typeof headingVariants>;
export type EyebrowVariants = VariantProps<typeof eyebrowVariants>;
export type SurfaceVariants = VariantProps<typeof surfaceVariants>;
export type BadgeVariants = VariantProps<typeof badgeVariants>;

export function cx(...inputs: (string | undefined | null)[]) {
  return cn(...inputs.filter(Boolean));
}
