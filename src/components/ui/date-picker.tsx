"use client";

import ReactDatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ru } from "date-fns/locale/ru";
import { cn } from "@/lib/utils";

registerLocale("ru", ru);

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  className,
  placeholder = "Выберите дату и время",
}: DatePickerProps) {
  const date = value ? new Date(value) : null;

  return (
    <ReactDatePicker
      selected={date}
      onChange={(d: Date | null) =>
        onChange(d ? d.toISOString().slice(0, 16) : "")
      }
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat="dd.MM.yyyy HH:mm"
      locale="ru"
      placeholderText={placeholder}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm",
        className
      )}
      calendarClassName="terra-calendar"
    />
  );
}
