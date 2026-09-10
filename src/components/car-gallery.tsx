"use client";

import { useState } from "react";
import Image from "next/image";
import { Lightbox } from "@/components/lightbox";
import { Expand } from "lucide-react";

interface GalleryImage {
  id: string;
  url: string;
  alt?: string | null;
}

interface CarGalleryProps {
  images: GalleryImage[];
  brandName: string;
  modelName: string;
}

export function CarGallery({ images, brandName, modelName }: CarGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  function openLightbox() {
    setLightboxOpen(true);
  }

  if (images.length === 0) {
    return (
      <div className="space-y-4">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
          <div className="flex h-full items-center justify-center text-gray-400">
            Фото скоро
          </div>
        </div>
      </div>
    );
  }

  const selected = images[selectedIndex];

  return (
    <div className="space-y-4">
      <div
        className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl bg-gray-100"
        onClick={openLightbox}
      >
        <Image
          src={selected.url}
          alt={selected.alt || `${brandName} ${modelName}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        <div className="absolute right-3 top-3 rounded-full bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Expand className="h-4 w-4 text-white" />
        </div>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.slice(0, 4).map((m, i) => (
            <button
              key={m.id}
              onClick={() => setSelectedIndex(i)}
              className={`group relative aspect-square overflow-hidden rounded-lg bg-gray-100 ring-2 transition-all ${
                i === selectedIndex
                  ? "ring-emerald-500 ring-offset-2"
                  : "ring-transparent hover:ring-gray-300"
              }`}
            >
              <Image
                src={m.url}
                alt={m.alt || ""}
                fill
                className="object-cover transition-transform duration-200 group-hover:scale-110"
                sizes="150px"
              />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        key={lightboxOpen ? "open" : "closed"}
        images={images.map((m) => ({ url: m.url, alt: m.alt }))}
        initialIndex={selectedIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
