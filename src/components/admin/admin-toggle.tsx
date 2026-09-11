"use client";

import { Button } from "@/components/ui/button";
import { Pencil, EyeOff } from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";

export function AdminToggle() {
  const { isAdmin, toggleAdmin } = useAdmin();

  return (
    <Button
      variant={isAdmin ? "default" : "ghost"}
      size="icon"
      onClick={toggleAdmin}
      title={isAdmin ? "Выйти из режима редактирования" : "Войти в режим редактирования"}
      className={isAdmin ? "bg-emerald-600 text-white" : ""}
    >
      {isAdmin ? <EyeOff className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
    </Button>
  );
}
