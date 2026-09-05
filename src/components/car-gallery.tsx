"use client";

import { useState, useEffect } from "react";
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

export function CarGallery({ images: initialImages, brandName, modelName }: CarGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    function handleColorImages(e: Event) {
      const detail = (e as CustomEvent<GalleryImage[]>).detail;
      if (detail && detail.length > 0) {
        setImages(detail);
      } else {
        setImages(initialImages);
      }
    }
    window.addEventListener("colorimages:update", handleColorImages);
    return () => window.removeEventListener("colorimages:update", handleColorImages);
  }, [initialImages]);

  function openLightbox(index: number) {
    setLightboxIndex(index);
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

  return (
    <div className="space-y-4">
      <div
        className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl bg-gray-100"
        onClick={() => openLightbox(0)}
      >
        <Image
          src={images[0].url}
          alt={images[0].alt || `${brandName} ${modelName}`}
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
              onClick={() => openLightbox(i)}
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
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
        key={lightboxIndex}
        images={images.map((m) => ({ url: m.url, alt: m.alt }))}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
