"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-muted-foreground">500</h1>
      <h2 className="mb-2 text-2xl font-semibold">Ошибка сервера</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Произошла непредвиденная ошибка. Пожалуйста, попробуйте ещё раз.
      </p>
      <Button onClick={reset} variant="outline">
        Попробовать ещё раз
      </Button>
    </div>
  );
}
