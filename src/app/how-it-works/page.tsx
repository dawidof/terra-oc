import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Calculator, Truck, MapPin, ArrowRight, MessageSquare } from "lucide-react";

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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">Как купить автомобиль</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Простой и прозрачный процесс покупки автомобиля из-за рубежа
          </p>
        </div>

        <div className="space-y-12">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col gap-8 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-5xl font-bold text-emerald-100">{step.number}</span>
                  <step.icon className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="mb-3 text-2xl font-bold">{step.title}</h2>
                <p className="mb-4 text-muted-foreground">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((detail, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block">
                  <ArrowRight className="h-8 w-8 text-gray-300" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-lg bg-emerald-50 py-12 text-center">
          <h2 className="mb-4 text-2xl font-bold">Готовы начать?</h2>
          <p className="mb-6 text-muted-foreground">
            Выберите автомобиль или получите индивидуальный подбор
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/cars">
              <Button size="lg">
                Смотреть автомобили
              </Button>
            </Link>
            <Link href="/choose">
              <Button variant="outline" size="lg">
                <MessageSquare className="mr-2 h-4 w-4" />
                Помочь выбрать
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
