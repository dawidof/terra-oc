import Image from "next/image";
import Link from "next/link";

import { Section, Heading, Eyebrow } from "@/components/ui/section";
import { cn } from "@/lib/utils";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export function BrandLogos({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;

  return (
    <Section>
      <Eyebrow>Наши бренды</Eyebrow>
      <Heading size="sm" className="mt-3">
        Автомобили от ведущих производителей
      </Heading>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/cars?brand=${brand.slug}`}
            className={cn(
              "group flex items-center gap-3 rounded-xl border border-border px-5 py-3",
              "transition-all duration-200 hover:border-foreground/15 hover:shadow-sm"
            )}
          >
            {brand.logoUrl ? (
              <Image
                src={brand.logoUrl}
                alt={brand.name}
                width={80}
                height={32}
                sizes="80px"
                className="h-8 w-auto object-contain opacity-70 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0"
              />
            ) : (
              <span className="text-sm font-medium tracking-wide text-muted-foreground transition-colors group-hover:text-foreground">
                {brand.name}
              </span>
            )}
          </Link>
        ))}
      </div>
    </Section>
  );
}
