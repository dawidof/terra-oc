"use client";

import { useState, useCallback } from "react";
import { CarGallery } from "@/components/car-gallery";
import { CarOptionsList } from "@/components/car-options-list";
import { ConfiguratorSection } from "@/components/configurator-section";
import { PurchaseProcess } from "@/components/purchase-process";

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
  specs?: React.ReactNode;
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
  specs,
  trimComparison,
  similarCars,
}: CarDetailClientProps) {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialMedia);

  const handleColorSelect = useCallback(
    (_groupId: string, _optionId: string, _images: { url: string; alt?: string | null }[], groupType: string) => {
      const filtered = initialMedia.filter((img) => {
        if (groupType === "interior_color") {
          return img.url.toLowerCase().includes("interior");
        }
        return !img.url.toLowerCase().includes("interior");
      });
      setGalleryImages(filtered.length > 0 ? filtered : initialMedia);
    },
    [initialMedia]
  );

  return (
    <div>
      {/* Hero section: two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
        {/* Left column: Gallery */}
        <div>
          <CarGallery
            images={galleryImages}
            brandName={brandName}
            modelName={modelName}
          />
        </div>

        {/* Right column: Hero info */}
        <div>
          {heroInfo}
        </div>
      </div>

      {/* Specs & Options - full width below photos */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {specs}
        <CarOptionsList optionGroups={optionGroups} />
      </div>

      <hr className="my-10 border-border" />

      {/* Configurator + Lead */}
      <div id="configurator" className="mt-12">
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

      <div className="mt-10">
        <PurchaseProcess />
      </div>

      {trimComparison}
      {similarCars}
    </div>
  );
}
