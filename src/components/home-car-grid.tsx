import { CarCard } from "@/components/car-card";

interface Model {
  modelId: string;
  modelName: string;
  modelSlug: string;
  brandName: string;
  brandSlug: string;
  trimId: string;
  trimName: string;
  trimSlug: string;
  modelVersionId: string;
  powertrainType: string | null;
  drivetrain: string | null;
  motorPowerKw: number | null;
  rangeKm: number | null;
  basePrice: string | null;
  estimatedTotalUsd: string | null;
  imageUrl: string | null;
}

interface HomeCarGridProps {
  models: Model[];
}

export function HomeCarGrid({ models }: HomeCarGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
