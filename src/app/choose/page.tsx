import Link from "next/link";
import { WizardClient } from "@/components/choose/wizard-client";
import { generateCsrfToken } from "@/lib/csrf-actions";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Помочь выбрать — TerraAuto",
  description: "Ответьте на несколько вопросов, и мы подберём лучший автомобиль под ваши потребности",
};

export default function ChoosePage() {
  const csrfToken = generateCsrfToken();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" />
          На главную
        </Link>

        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Помочь выбрать автомобиль</h1>
          <p className="text-lg text-muted-foreground">
            Ответьте на 6 вопросов, и мы подберём лучший вариант
          </p>
        </div>

        <WizardClient csrfToken={csrfToken} />
      </div>
    </div>
  );
}
