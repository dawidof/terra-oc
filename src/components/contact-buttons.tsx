"use client";

import { MessageCircle, Phone } from "lucide-react";

interface ContactButtonsProps {
  brandName?: string;
  modelName?: string;
  trimName?: string;
  estimatedTotal?: number;
  whatsappNumber?: string;
  telegramUsername?: string;
  phone?: string;
  variant?: "floating" | "inline" | "hero";
  className?: string;
}

function buildWhatsAppUrl(
  number: string,
  brand?: string,
  model?: string,
  trim?: string,
  price?: number,
): string {
  let msg = "Здравствуйте! Интересует автомобиль";
  if (brand && model) {
    msg += ` — ${brand} ${model}`;
  }
  if (trim) {
    msg += ` (${trim})`;
  }
  if (price) {
    msg += `. Ориентировочная стоимость: $${price.toLocaleString("en-US")}`;
  }
  msg += ". Хотел бы(а) узнать подробнее.";
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

function buildTelegramUrl(
  username: string,
  brand?: string,
  model?: string,
  trim?: string,
  price?: number,
): string {
  let msg = "Здравствуйте! Интересует автомобиль";
  if (brand && model) {
    msg += ` — ${brand} ${model}`;
  }
  if (trim) {
    msg += ` (${trim})`;
  }
  if (price) {
    msg += `. Ориентировочная стоимость: $${price.toLocaleString("en-US")}`;
  }
  msg += ". Хотел бы(а) узнать подробнее.";
  return `https://t.me/${username}?text=${encodeURIComponent(msg)}`;
}

export function ContactButtons({
  brandName,
  modelName,
  trimName,
  estimatedTotal,
  whatsappNumber = "998901234567",
  telegramUsername = "terraauto",
  phone = "+998901234567",
  variant = "inline",
  className = "",
}: ContactButtonsProps) {
  const whatsAppUrl = buildWhatsAppUrl(
    whatsappNumber,
    brandName,
    modelName,
    trimName,
    estimatedTotal,
  );
  const telegramUrl = buildTelegramUrl(
    telegramUsername,
    brandName,
    modelName,
    trimName,
    estimatedTotal,
  );

  if (variant === "floating") {
    return (
      <div className={`fixed bottom-6 right-6 z-50 flex flex-col gap-3 ${className}`}>
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110"
          aria-label="Написать в WhatsApp"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-transform hover:scale-110"
          aria-label="Написать в Telegram"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        </a>
        <a
          href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition-transform hover:scale-110"
          aria-label="Позвонить"
        >
          <Phone className="h-7 w-7" />
        </a>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-600"
        >
          <MessageCircle className="h-5 w-5" />
          Написать в WhatsApp
        </a>
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-600"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          Написать в Telegram
        </a>
        <a
          href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 px-6 py-3 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
        >
          <Phone className="h-5 w-5" />
          Позвонить
        </a>
      </div>
    );
  }

  // inline variant
  return (
    <div className={`flex gap-2 ${className}`}>
      <a
        href={whatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
      >
        <MessageCircle className="h-4 w-4" />
        WhatsApp
      </a>
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
        Telegram
      </a>
    </div>
  );
}
