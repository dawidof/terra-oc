"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Camera,
  Eye,
  EyeOff,
  Loader2,
  Play,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface LeadMediaItem {
  id: string;
  kind: string;
  url: string;
  caption: string | null;
  published: boolean;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

interface LeadMediaProps {
  leadId: string;
  initialMedia: LeadMediaItem[];
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function LeadMedia({ leadId, initialMedia }: LeadMediaProps) {
  const router = useRouter();
  const [media, setMedia] = useState<LeadMediaItem[]>(initialMedia);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publishedCount = media.filter((m) => m.published).length;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(Array.from(e.target.files || []));
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) {
      toast.error("Выберите файлы");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append("files", file);
      }
      if (caption.trim()) {
        formData.append("caption", caption.trim());
      }
      formData.append("published", "false");

      const res = await fetch(`/api/leads/${leadId}/media`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setMedia([...media, ...data.media]);
        setSelectedFiles([]);
        setCaption("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success(
          `Загружено: ${data.media.length}. Опубликуйте материалы, чтобы клиент их увидел.`
        );
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Не удалось загрузить файлы");
      }
    } catch {
      toast.error("Ошибка сети при загрузке");
    } finally {
      setUploading(false);
    }
  }

  async function handleTogglePublished(item: LeadMediaItem) {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/leads/${leadId}/media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: item.id, published: !item.published }),
      });

      if (res.ok) {
        const data = await res.json();
        setMedia(media.map((m) => (m.id === item.id ? data.media : m)));
        router.refresh();
      } else {
        toast.error("Не удалось обновить материал");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: LeadMediaItem) {
    setBusyId(item.id);
    try {
      const res = await fetch(
        `/api/leads/${leadId}/media?mediaId=${item.id}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setMedia(media.filter((m) => m.id !== item.id));
        router.refresh();
      } else {
        toast.error("Не удалось удалить материал");
      }
    } catch {
      toast.error("Ошибка сети");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          <Camera className="size-3.5" aria-hidden />
          Материалы проверки
        </p>
        {media.length > 0 && (
          <span className="text-xs text-muted-foreground">
            Видно клиенту: {publishedCount} из {media.length}
          </span>
        )}
      </div>

      {/* Upload */}
      <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/webm,video/quicktime"
            onChange={handleFileSelect}
            className="hidden"
            id={`media-file-input-${leadId}`}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            Выбрать файлы
          </Button>
          {selectedFiles.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedFiles.length} файл(ов) выбрано
            </span>
          )}
        </div>
        {selectedFiles.length > 0 && (
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Подпись (необязательно), например: Проверка кузова"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={255}
            />
            <Button size="sm" onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />
              ) : (
                <Upload data-icon="inline-start" className="size-3.5" />
              )}
              Загрузить
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Фото (JPEG/PNG/WebP, до 10 МБ) и видео (MP4/WebM/MOV, до 100 МБ).
          Загруженные материалы видны клиенту только после публикации.
        </p>
      </div>

      {/* Media grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {media.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border p-2",
                item.published
                  ? "border-border"
                  : "border-amber-300 bg-amber-50/50"
              )}
            >
              <div className="relative overflow-hidden rounded-md bg-muted">
                {item.kind === "photo" ? (
                  <img
                    src={item.url}
                    alt={item.caption || "Материал проверки"}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <video
                    src={item.url}
                    preload="metadata"
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                {item.kind === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white">
                      <Play className="size-4" />
                    </span>
                  </span>
                )}
                {!item.published && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Черновик
                  </span>
                )}
              </div>

              {item.caption && (
                <p className="truncate text-xs font-medium">{item.caption}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {formatDate(item.createdAt)}
                {item.fileSize ? ` · ${formatSize(item.fileSize)}` : ""}
              </p>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 flex-1 gap-1 px-1.5 text-[11px]"
                  onClick={() => handleTogglePublished(item)}
                  disabled={busyId === item.id}
                >
                  {busyId === item.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : item.published ? (
                    <Eye className="size-3" />
                  ) : (
                    <EyeOff className="size-3" />
                  )}
                  {item.published ? "Показано" : "Показать клиенту"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(item)}
                  disabled={busyId === item.id}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {media.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Материалов пока нет. Загрузите фото и видео проверки — клиент увидит
          их на этапе «Проверка автомобиля».
        </p>
      )}
    </div>
  );
}
