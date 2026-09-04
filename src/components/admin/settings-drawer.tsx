"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, X } from "lucide-react";
import { useAdmin } from "@/contexts/admin-context";

export function SettingsDrawer() {
  const { isAdmin } = useAdmin();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/admin/settings", { method: "GET" })
        .then((r) => r.json())
        .then((data) => {
          if (data.settings) {
            const map: Record<string, string> = {};
            for (const s of data.settings) {
              map[s.key] = typeof s.valueJson === "string" ? s.valueJson : JSON.stringify(s.valueJson);
            }
            setSettings(map);
          }
        })
        .catch(console.error);
    }
  }, [open]);

  if (!isAdmin) return null;

  async function handleSave() {
    setLoading(true);
    setSaved(false);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value }),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { key: "hero_title", label: "Заголовок hero" },
    { key: "hero_subtitle", label: "Подзаголовок hero" },
    { key: "contact_phone", label: "Телефон" },
    { key: "contact_telegram", label: "Telegram" },
    { key: "contact_address", label: "Адрес" },
  ];

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="gap-1" onClick={() => setOpen(true)}>
        <Settings className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Настройки сайта</h3>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <Input
                value={settings[field.key] || ""}
                onChange={(e) =>
                  setSettings({ ...settings, [field.key]: e.target.value })
                }
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Закрыть
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                "Сохранение..."
              ) : saved ? (
                "Сохранено"
              ) : (
                <>
                  <Save className="mr-1 h-4 w-4" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
