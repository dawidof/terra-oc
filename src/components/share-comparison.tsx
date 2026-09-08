"use client";

import { useState } from "react";
import { Share2, Copy, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareComparisonProps {
  slugs: string[];
  className?: string;
}

export function ShareComparison({ slugs, className = "" }: ShareComparisonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/compare?cars=${slugs.join(",")}`
    : "";

  const shareText = "Сравнение автомобилей — TerraAuto";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleTelegram() {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (slugs.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Поделиться
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Поделиться сравнением
          </p>

          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
            {copied ? "Скопировано!" : "Копировать ссылку"}
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
          >
            <MessageCircle className="h-4 w-4 text-green-600" />
            WhatsApp
          </button>

          <button
            onClick={handleTelegram}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-blue-500">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
            Telegram
          </button>
        </div>
      )}
    </div>
  );
}
