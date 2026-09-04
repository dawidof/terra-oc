"use client";

import { Button } from "@/components/ui/button";
import { Pencil, EyeOff } from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";

export function AdminToggle() {
  const { isAdmin, toggleAdmin } = useAdmin();

  return (
    <Button
      variant={isAdmin ? "default" : "ghost"}
      size="sm"
      onClick={toggleAdmin}
      className={`gap-1 ${isAdmin ? "bg-emerald-600 text-white" : ""}`}
    >
      {isAdmin ? (
        <>
          <EyeOff className="h-3 w-3" />
          Режим редактирования
        </>
      ) : (
        <>
          <Pencil className="h-3 w-3" />
          Редактирование
        </>
      )}
    </Button>
  );
}
