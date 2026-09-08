"use client";

import { Badge } from "@/components/ui/badge";
import { Package, Truck, Clock, UserCheck, CheckCircle } from "lucide-react";

interface AvailabilityBadgeProps {
  status: string;
  location?: string | null;
  expectedDate?: string | null;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Package }> = {
  in_stock: {
    label: "В наличии",
    color: "bg-green-100 text-green-800 hover:bg-green-100",
    icon: Package,
  },
  in_transit: {
    label: "В пути",
    color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    icon: Truck,
  },
  on_order: {
    label: "Под заказ",
    color: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    icon: Clock,
  },
  reserved: {
    label: "Забронирован",
    color: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    icon: UserCheck,
  },
  sold: {
    label: "Продан",
    color: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    icon: CheckCircle,
  },
};

export function AvailabilityBadge({
  status,
  location,
  expectedDate,
  className = "",
}: AvailabilityBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.on_order;
  const Icon = config.icon;

  let tooltip = config.label;
  if (location) tooltip += ` — ${location}`;
  if (expectedDate && (status === "in_transit" || status === "on_order")) {
    const date = new Date(expectedDate);
    tooltip += ` (ожидается ${date.toLocaleDateString("ru-RU")})`;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="secondary" className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
      {location && (
        <span className="text-xs text-muted-foreground">{location}</span>
      )}
      {expectedDate && (status === "in_transit" || status === "on_order") && (
        <span className="text-xs text-muted-foreground">
          ~{new Date(expectedDate).toLocaleDateString("ru-RU")}
        </span>
      )}
    </div>
  );
}
