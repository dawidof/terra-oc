import { CarCard } from "@/components/car-card";
import { cn } from "@/lib/utils";
import type { FeaturedModel } from "@/lib/queries";

interface HomeCarGridProps {
  models: FeaturedModel[];
  className?: string;
}

export function HomeCarGrid({ models, className }: HomeCarGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {models.map((model) => (
        <CarCard
          key={model.modelId}
          brandName={model.brandName}
          brandSlug={model.brandSlug}
          modelName={model.modelName}
          modelSlug={model.modelSlug}
          trimName={model.trimName}
          trimSlug={model.trimSlug}
          powertrainType={model.powertrainType}
          drivetrain={model.drivetrain}
          motorPowerKw={model.motorPowerKw}
          enginePowerHp={null}
          rangeKm={model.rangeKm}
          basePrice={model.basePrice}
          estimatedTotalUsd={model.estimatedTotalUsd}
          imageUrl={model.imageUrl}
          modelYear={null}
        />
      ))}
    </div>
  );
}
