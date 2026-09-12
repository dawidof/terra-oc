import Link from "next/link";
import { WizardClient } from "@/components/choose/wizard-client";
import { Section } from "@/components/ui/section";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Помочь выбрать — TerraAuto",
  description: "Ответьте на несколько вопросов, и мы подберём лучший автомобиль под ваши потребности",
};

export default function ChoosePage() {
  return (
    <Section padding="none" className="py-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className="inline-flex flex-shrink-0 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            На главную
          </Link>
          <h1 className="truncate text-xl font-bold tracking-tight">
            Помочь выбрать автомобиль
          </h1>
        </div>
        <span className="hidden text-xs whitespace-nowrap text-muted-foreground sm:block">
          6 вопросов · ~1 мин
        </span>
      </div>

      <WizardClient />
    </Section>
  );
}
