import { Badge } from "@/components/ui/badge";
import { ArrowRight, Car, CheckCircle, CheckCheck, Clock, MessageSquare, Phone, User, Truck } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getStatusLabel } from "@/components/crm/status-badge";
import { sourceLabel } from "@/components/crm/lead-source";
import { getJourneyStage } from "@/lib/journey";

interface Activity {
  id: string;
  type: string;
  metadataJson: unknown;
  createdAt: Date;
  userName: string | null;
}

const activityIcons: Record<string, { icon: typeof User; className: string }> = {
  lead_created: { icon: CheckCircle, className: "text-blue-500" },
  assigned: { icon: User, className: "text-muted-foreground" },
  status_changed: { icon: ArrowRight, className: "text-purple-500" },
  source_changed: { icon: ArrowRight, className: "text-sky-500" },
  note_added: { icon: MessageSquare, className: "text-brand" },
  follow_up_set: { icon: Clock, className: "text-amber-500" },
  follow_up_completed: { icon: CheckCheck, className: "text-brand" },
  called: { icon: Phone, className: "text-blue-500" },
  proposed_car_added: { icon: Car, className: "text-brand" },
  proposed_car_removed: { icon: Car, className: "text-red-500" },
  proposed_car_status_changed: { icon: Car, className: "text-amber-500" },
  journey_stage_changed: { icon: Truck, className: "text-cyan-500" },
  client_message: { icon: MessageSquare, className: "text-emerald-500" },
  vehicle_reserved: { icon: Truck, className: "text-violet-500" },
  vehicle_unreserved: { icon: Truck, className: "text-muted-foreground" },
};

function activityIcon(type: string) {
  const { icon: Icon, className } = activityIcons[type] ?? {
    icon: CheckCircle,
    className: "text-muted-foreground",
  };
  return <Icon className={cn("size-4", className)} aria-hidden />;
}

function activityLabel(type: string, metadata: Record<string, unknown> | null) {
  switch (type) {
    case "lead_created":
      return "Заявка создана";
    case "assigned":
      return "Назначен менеджер";
    case "status_changed":
      return `Статус изменён на «${getStatusLabel((metadata?.newStatus as string) || "")}»`;
    case "note_added":
      return "Добавлена заметка";
    case "follow_up_set":
      return "Установлен звонок";
    case "follow_up_completed":
      return "Звонок выполнен";
    case "called":
      return "Совершён звонок";
    case "notification_sent":
      return "Отправлено уведомление";
    case "estimate_updated":
      return "Обновлена смета";
    case "source_changed":
      return `Источник изменён на «${sourceLabel(metadata?.newSource as string)}»`;
    case "proposed_car_added":
      return "Добавлен предложенный автомобиль";
    case "proposed_car_removed":
      return "Удалён предложенный автомобиль";
    case "proposed_car_status_changed":
      return `Статус предложения изменён`;
    case "journey_stage_changed": {
      const stage = getJourneyStage(Number(metadata?.stage) || 1);
      return `Этап для клиента: «${stage.label}»`;
    }
    case "client_message": {
      const message = (metadata?.message as string) || "";
      return message ? `Сообщение от клиента: «${message}»` : "Сообщение от клиента";
    }
    case "vehicle_reserved":
      return "Автомобиль закреплён за заявкой";
    case "vehicle_unreserved":
      return "Автомобиль откреплён от заявки";
    default:
      return type;
  }
}

export function LeadTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет активности</p>;
  }

  return (
    <div className="relative flex flex-col gap-4">
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
      {activities.map((activity) => (
        <div key={activity.id} className="relative flex gap-3">
          <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
            {activityIcon(activity.type)}
          </div>
          <div className="flex-1 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {activityLabel(activity.type, activity.metadataJson as Record<string, unknown>)}
              </span>
              {activity.userName && (
                <Badge variant="outline" className="text-xs">
                  {activity.userName}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
