import { CalculatorForm } from "@/components/calculator-form";

export const metadata = {
  title: "Калькулятор стоимости — TerraAuto",
  description: "Рассчитайте ориентировочную стоимость автомобиля под ключ с доставкой в Узбекистан.",
};

export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">
            Ориентировочная стоимость автомобиля под ключ
          </h1>
          <p className="text-muted-foreground">
            Рассчитайте предварительную стоимость автомобиля с учётом логистики, таможенных платежей и оформления.
          </p>
        </div>

        <CalculatorForm />
      </div>
    </div>
  );
}
