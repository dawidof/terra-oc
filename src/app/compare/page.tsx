"use client";

import { Suspense } from "react";
import CompareContent from "./content";

export default function ComparePageWrapper() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Загрузка...</div>}>
      <CompareContent />
    </Suspense>
  );
}
