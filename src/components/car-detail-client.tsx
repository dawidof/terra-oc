"use client";

import { useState, useCallback } from "react";
import { CarGallery } from "@/components/car-gallery";
import { ConfiguratorSection } from "@/components/configurator-section";

interface GalleryImage {
  id: string;
  url: string;
  alt?: string | null;
}

interface OptionGroup {
  id: string;
  type: string;
  name: string;
  required: boolean;
  options: {
    id: string;
    name: string;
    code: string | null;
    imageUrl: string | null;
    priceDelta: string | null;
    priceCurrency: string | null;
    priceKnown: boolean;
    available: boolean;
  }[];
}

interface CarDetailClientProps {
  initialMedia: GalleryImage[];
  brandName: string;
  modelName: string;
  heroInfo: React.ReactNode;
  optionGroups: OptionGroup[];
  basePrice: number;
  estimatedTotalUsd: string | null;
  trimId: string;
  trimName: string;
  sourceCountry: string | null;
  condition: string;
  csrfToken: string;
  logisticsCost: number | null;
  customsCost: number | null;
  serviceFee: number | null;
  deliveryDays: number | null;
  colorImages?: Record<string, { url: string; alt?: string | null }[]>;
  trimComparison?: React.ReactNode;
  similarCars?: React.ReactNode;
}

export function CarDetailClient({
  initialMedia,
  brandName,
  modelName,
  heroInfo,
  optionGroups,
  basePrice,
  estimatedTotalUsd,
  trimId,
  trimName,
  sourceCountry,
  condition,
  csrfToken,
  logisticsCost,
  customsCost,
  serviceFee,
  deliveryDays,
  colorImages = {},
  trimComparison,
  similarCars,
}: CarDetailClientProps) {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialMedia);

  const handleColorSelect = useCallback(
    (_groupId: string, optionId: string, images: { url: string; alt?: string | null }[], groupType: string) => {
      const filterByType = (imgs: GalleryImage[]) => {
        if (groupType === "interior_color") {
          return imgs.filter((img) => img.url.toLowerCase().includes("interior"));
        }
        return imgs.filter((img) => !img.url.toLowerCase().includes("interior"));
      };

      const mapped = images.map((img, i) => ({
        id: `${optionId}-${i}`,
        url: img.url,
        alt: img.alt,
      }));

      const filtered = filterByType(mapped);
      if (filtered.length > 0) {
        setGalleryImages(filtered);
      } else {
        const fallback = filterByType(initialMedia);
        setGalleryImages(fallback.length > 0 ? fallback : initialMedia);
      }
    },
    [initialMedia]
  );

  return (
    <>
      {/* Hero section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <CarGallery
          images={galleryImages}
          brandName={brandName}
          modelName={modelName}
        />
        {heroInfo}
      </div>

      {/* Configurator + Lead */}
      <div id="configurator" className="mt-8">
        {optionGroups.length > 0 ? (
          <ConfiguratorSection
            optionGroups={optionGroups}
            basePrice={basePrice}
            estimatedTotalUsd={estimatedTotalUsd}
            trimId={trimId}
            brandName={brandName}
            modelName={modelName}
            trimName={trimName}
            sourceCountry={sourceCountry}
            condition={condition}
            csrfToken={csrfToken}
            logisticsCost={logisticsCost}
            customsCost={customsCost}
            serviceFee={serviceFee}
            deliveryDays={deliveryDays}
            colorImages={colorImages}
            defaultMedia={initialMedia}
            onColorSelect={handleColorSelect}
          />
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Конфигуратор недоступен для этой комплектации
          </div>
        )}
      </div>

      {trimComparison}
      {similarCars}
    </>
  );
}
