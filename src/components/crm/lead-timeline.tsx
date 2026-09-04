import { Badge } from "@/components/ui/badge";
import { User, ArrowRight, MessageSquare, Clock, Phone, CheckCircle, XCircle } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  metadataJson: any;
  createdAt: Date;
  userName: string | null;
}

function activityIcon(type: string) {
  switch (type) {
    case "lead_created":
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case "assigned":
      return <User className="h-4 w-4 text-gray-500" />;
    case "status_changed":
      return <ArrowRight className="h-4 w-4 text-purple-500" />;
    case "note_added":
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case "follow_up_set":
      return <Clock className="h-4 w-4 text-amber-500" />;
    case "called":
      return <Phone className="h-4 w-4 text-blue-500" />;
    default:
      return <CheckCircle className="h-4 w-4 text-gray-400" />;
  }
}

function activityLabel(type: string, metadata: any) {
  switch (type) {
    case "lead_created":
      return "Заявка создана";
    case "assigned":
      return "Назначен менеджер";
    case "status_changed":
      return `Статус изменён на «${metadata?.newStatus || "—"}»`;
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

function formatDateTime(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeadTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground">Нет активности</p>;
  }

  return (
    <div className="relative space-y-4">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
      {activities.map((activity) => (
        <div key={activity.id} className="relative flex gap-3">
          <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white border">
            {activityIcon(activity.type)}
          </div>
          <div className="flex-1 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {activityLabel(activity.type, activity.metadataJson)}
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
