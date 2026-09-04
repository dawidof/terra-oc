"use client";

import { useAdmin } from "@/contexts/admin-context";
import { VehicleEditor } from "@/components/admin/vehicle-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";

interface VehicleAdminBarProps {
  trimId: string;
  data: {
    trimName: string;
    trimSlug: string;
    powertrainType: string | null;
    drivetrain: string | null;
    motorPowerKw: number | null;
    rangeKm: number | null;
    acceleration0100: string | null;
    batteryCapacityKwh: string | null;
    basePrice: string | null;
    estimatedTotalUsd: string | null;
    sourcePrice: string | null;
    deliveryDays: number | null;
    active: boolean;
  };
  onUpdate?: () => void;
}

export function VehicleAdminBar({ trimId, data, onUpdate }: VehicleAdminBarProps) {
  const { isAdmin } = useAdmin();

  if (!isAdmin) return null;

  return (
    <Card className="mb-6 border-emerald-200 bg-emerald-50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700">Режим редактирования</span>
        </div>
        <VehicleEditor trimId={trimId} data={data} onUpdate={onUpdate} />
      </CardContent>
    </Card>
  );
}
