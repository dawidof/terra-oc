import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Clock, MessageSquare, Phone, User } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  note_added: { icon: MessageSquare, className: "text-brand" },
  follow_up_set: { icon: Clock, className: "text-amber-500" },
  called: { icon: Phone, className: "text-blue-500" },
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
      return `Статус изменён на «${(metadata?.newStatus as string) || "—"}»`;
    case "note_added":
      return "Добавлена заметка";
    case "follow_up_set":
      return "Установлен звонок";
    case "called":
      return "Совершён звонок";
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
