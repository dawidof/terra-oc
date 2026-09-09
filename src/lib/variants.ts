import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

export const sectionVariants = cva(
  "container mx-auto px-4",
  {
    variants: {
      padding: {
        default: "py-16",
        tight: "py-8",
        spacious: "py-24",
      },
      background: {
        default: "bg-white",
        muted: "bg-gray-50",
        accent: "bg-emerald-50",
      },
    },
    defaultVariants: {
      padding: "default",
      background: "default",
    },
  }
);

export const headingVariants = cva(
  "font-bold tracking-tight text-foreground",
  {
    variants: {
      size: {
        xs: "text-xl",
        sm: "text-2xl",
        md: "text-3xl",
        lg: "text-4xl",
        xl: "text-5xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-emerald-100 text-emerald-800",
        warning: "bg-amber-100 text-amber-800",
        danger: "bg-red-100 text-red-800",
        info: "bg-blue-100 text-blue-800",
        neutral: "bg-gray-100 text-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const cardHoverVariants = cva(
  "transition-shadow duration-200 hover:shadow-lg",
  {
    variants: {
      hover: {
        true: "hover:shadow-lg hover:-translate-y-0.5",
        false: "",
      },
    },
    defaultVariants: {
      hover: true,
    },
  }
);

export const paginationVariants = cva(
  "inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors",
  {
    variants: {
      state: {
        default: "hover:bg-muted",
        active: "bg-emerald-600 text-white hover:bg-emerald-600",
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
export type BadgeVariants = VariantProps<typeof badgeVariants>;

export function cx(...inputs: (string | undefined | null)[]) {
  return cn(...inputs.filter(Boolean));
}
