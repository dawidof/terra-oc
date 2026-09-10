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
              "group flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3",
              "transition-all duration-200 hover:border-brand/40 hover:shadow-md"
            )}
          >
            {brand.logoUrl ? (
              <div className="flex h-10 w-24 items-center justify-center">
                <Image
                  src={brand.logoUrl}
                  alt={brand.name}
                  width={96}
                  height={40}
                  sizes="96px"
                  className="max-h-10 w-auto object-contain opacity-70 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0"
                />
              </div>
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
