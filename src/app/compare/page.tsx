"use client";

import { Suspense } from "react";
import type { Metadata } from "next";
import CompareContent from "./content";

export const metadata: Metadata = {
  title: "Сравнение автомобилей | TerraAuto",
  description: "Сравните характеристики автомобилей side-by-side. Выберите до 4 автомобилей для сравнения.",
  openGraph: {
    title: "Сравнение автомобилей — TerraAuto",
    description: "Сравните характеристики автомобилей side-by-side",
    type: "website",
  },
};

export default function ComparePageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Загрузка...</div>}>
      <CompareContent />
    </Suspense>
  );
}
