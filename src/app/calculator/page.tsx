import { CalculatorForm } from "@/components/calculator-form";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";

export const metadata = {
  title: "Калькулятор стоимости — TerraAuto",
  description: "Рассчитайте ориентировочную стоимость автомобиля под ключ с доставкой в Узбекистан.",
};

export default function CalculatorPage() {
  return (
    <Section padding="tight">
      <PageHeader
        eyebrow="Калькулятор"
        title="Ориентировочная стоимость автомобиля под ключ"
        description="Рассчитайте предварительную стоимость автомобиля с учётом логистики, таможенных платежей и оформления."
        align="left"
        size="xl"
        className="mb-8"
      />

      <CalculatorForm />
    </Section>
  );
}
