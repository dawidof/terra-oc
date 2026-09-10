import Link from "next/link";
import { Car, Calculator, Truck, MapPin, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Heading, Section } from "@/components/ui/section";

export const metadata = {
  title: "Как купить автомобиль — TerraAuto",
  description: "Пошаговая инструкция по покупке автомобиля из Китая через TerraAuto",
};

const steps = [
  {
    icon: Car,
    number: "01",
    title: "Выбор автомобиля",
    description:
      "Просмотрите каталог или воспользуйтесь подборщиком. Мы предлагаем автомобили из Китая, Кореи, США и Дубая с полной информацией о комплектации и характеристиках.",
    details: [
      "Каталог с фильтрами и поиском",
      "Сравнение моделей",
      "Подбор автомобиля под ваши потребности",
    ],
  },
  {
    icon: Calculator,
    number: "02",
    title: "Расчёт стоимости",
    description:
      "Калькулятор покажет полную стоимость автомобиля с доставкой: цена автомобиля, логистика, таможенные пошлины и сервисный сбор.",
    details: [
      "Прозрачный расчёт",
      "Актуальные ставки",
      "Без скрытых платежей",
    ],
  },
  {
    icon: Truck,
    number: "03",
    title: "Оформление и доставка",
    description:
      "После согласования мы организуем покупку, проверку, таможенное оформление и доставку автомобиля в Узбекистан.",
    details: [
      "Проверка автомобиля перед покупкой",
      "Таможенное оформление",
      "Доставка в Ташкент",
    ],
  },
  {
    icon: MapPin,
    number: "04",
    title: "Получение в Ташкенте",
    description:
      "Получите готовый автомобиль в нашем офисе в Ташкенте. Мы поможем с регистрацией и предоставим все документы.",
    details: [
      "Все документы готовы",
      "Помощь с регистрацией",
      "Гарантия на автомобиль",
    ],
  },
];

export default async function HowItWorksPage() {
  return (
    <>
      <Section padding="spacious">
        <PageHeader
          eyebrow="Процесс"
          title="Как купить автомобиль"
          description="Простой и прозрачный процесс покупки автомобиля из-за рубежа"
          size="2xl"
        />
      </Section>

      <Section background="muted">
        <ol className="space-y-10">
          {steps.map((step, i) => (
            <li
              key={i}
              className="grid gap-5 border-t border-border pt-8 md:grid-cols-12 md:items-start"
            >
              <div className="flex items-center gap-4 md:col-span-4">
                <span className="text-6xl font-bold tracking-tighter tabular-nums text-brand">
                  {step.number}
                </span>
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand shadow-sm">
                  <step.icon className="size-5 text-white" aria-hidden />
                </span>
              </div>
              <div className="md:col-span-8">
                <h2 className="text-xl font-bold tracking-tight">{step.title}</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  {step.details.map((detail, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="size-1.5 rounded-full bg-brand" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section background="dark" padding="spacious">
        <div className="mx-auto max-w-2xl text-center">
          <Heading size="xl" tone="inverse">
            Готовы начать?
          </Heading>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            Выберите автомобиль или получите индивидуальный подбор
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 bg-brand px-7 text-brand-foreground shadow-sm hover:bg-brand-deep hover:shadow-md"
              render={<Link href="/cars" />}
              nativeButton={false}
            >
              Смотреть автомобили
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/25 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/choose" />}
              nativeButton={false}
            >
              <MessageSquare className="size-4" />
              Помочь выбрать
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
