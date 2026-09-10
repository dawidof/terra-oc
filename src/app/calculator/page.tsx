import { CalculatorForm } from "@/components/calculator-form";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { getTrimForCalculator } from "@/lib/queries";

export const metadata = {
  title: "Калькулятор стоимости — TerraAuto",
  description: "Рассчитайте ориентировочную стоимость автомобиля под ключ с доставкой в Узбекистан.",
};

const VALID_COUNTRIES = ["Китай", "Корея", "США", "ОАЭ"];
const VALID_POWERTRAINS = ["bev", "phev", "hev", "petrol", "diesel", "reev"];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : undefined;
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CalculatorPage({ searchParams }: Props) {
  const sp = await searchParams;

  const trimParam = firstParam(sp.trim);
  const initialTrim = trimParam ? await getTrimForCalculator(trimParam) : null;

  const country = firstParam(sp.country);
  const powertrain = firstParam(sp.powertrain);
  const condition = firstParam(sp.condition);
  const currency = firstParam(sp.currency);

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

      <CalculatorForm
        initialCountry={country && VALID_COUNTRIES.includes(country) ? country : undefined}
        initialCondition={condition === "used" ? "used" : "new"}
        initialPrice={positiveInt(firstParam(sp.price))}
        initialCurrency={currency ? currency.toUpperCase() : undefined}
        initialPowertrain={powertrain && VALID_POWERTRAINS.includes(powertrain) ? powertrain : undefined}
        initialDisplacement={positiveInt(firstParam(sp.displacement))}
        initialPower={positiveInt(firstParam(sp.power))}
        initialYear={positiveInt(firstParam(sp.year))}
        initialTrim={initialTrim}
      />
    </Section>
  );
}
