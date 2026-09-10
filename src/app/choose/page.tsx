import Link from "next/link";
import { WizardClient } from "@/components/choose/wizard-client";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { generateCsrfToken } from "@/lib/csrf-actions";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Помочь выбрать — TerraAuto",
  description: "Ответьте на несколько вопросов, и мы подберём лучший автомобиль под ваши потребности",
};

export default function ChoosePage() {
  const csrfToken = generateCsrfToken();

  return (
    <Section padding="tight">
      <Link href="/" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />
        На главную
      </Link>

      <PageHeader
        eyebrow="Подбор"
        title="Помочь выбрать автомобиль"
        description="Ответьте на 6 вопросов, и мы подберём лучший вариант"
        size="xl"
        className="mb-8"
      />

      <WizardClient csrfToken={csrfToken} />
    </Section>
  );
}
