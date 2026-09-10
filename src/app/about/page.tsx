import Link from "next/link";
import { Shield, Truck, Clock, Headphones, MessageSquare, Car } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Eyebrow, Heading, Section } from "@/components/ui/section";

export const metadata = {
  title: "О компании — TerraAuto",
  description: "TerraAuto — ваш надёжный партнёр в покупке автомобилей из-за рубежа",
};

const advantages = [
  {
    icon: Shield,
    title: "Проверка автомобиля",
    description: "Каждый автомобиль проходит тщательную проверку перед покупкой",
  },
  {
    icon: Truck,
    title: "Доставка под ключ",
    description: "Организуем логистику, таможню и доставку в Ташкент",
  },
  {
    icon: Clock,
    title: "Прозрачные сроки",
    description: "Вы всегда знаете, где находится ваш автомобиль",
  },
  {
    icon: Headphones,
    title: "Поддержка 24/7",
    description: "Наши менеджеры всегда на связи и готовы помочь",
  },
];

export default async function AboutPage() {
  return (
    <>
      <Section padding="spacious">
        <PageHeader
          eyebrow="О компании"
          title="TerraAuto — автомобили под заказ в Узбекистане"
          description="Мы помогаем людям в Узбекистане получить доступ к качественным автомобилям из Китая, Кореи, США и Дубая по прозрачным ценам и с полным сервисом."
          size="2xl"
        />
      </Section>

      <Section background="muted">
        <Eyebrow tone="brand">Миссия</Eyebrow>
        <Heading size="xl" className="mt-3">
          Наша миссия
        </Heading>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <p className="leading-relaxed text-muted-foreground">
              TerraAuto создана для того, чтобы сделать покупку автомобиля из-за рубежа
              простой, прозрачной и безопасной. Мы берём на себя весь процесс: от выбора
              автомобиля до его регистрации в Ташкенте.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Мы работаем с проверенными поставщиками и логистическими компаниями,
              чтобы гарантировать качество сервиса и сроки доставки.
            </p>
          </div>
          <div>
            <p className="leading-relaxed text-muted-foreground">
              Наша команда — это профессионалы с многолетним опытом в автомобильном
              импорте. Мы знаем все нюансы таможенного оформления и поможем избежать
              распространённых ошибок.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Мы не просто продаём автомобили — мы создаём долгосрочные отношения
              с нашими клиентами, основанные на доверии и качестве сервиса.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="text-center">
          <Eyebrow>Преимущества</Eyebrow>
          <Heading size="xl" className="mt-3">
            Почему выбирают нас
          </Heading>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map((adv, i) => (
            <div
              key={i}
              className="rounded-xl border-t-4 border-brand bg-card p-6 text-center shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
            >
              <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-brand shadow-sm">
                <adv.icon className="size-5 text-white" aria-hidden />
              </span>
              <h3 className="mt-5 font-bold tracking-tight">{adv.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {adv.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section background="dark" padding="spacious">
        <div className="mx-auto max-w-2xl text-center">
          <Heading size="xl" tone="inverse">
            Готовы купить автомобиль?
          </Heading>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            Начните с просмотра каталога или получите персональный подбор
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 bg-brand px-7 text-brand-foreground shadow-sm hover:bg-brand-deep hover:shadow-md"
              render={<Link href="/cars" />}
              nativeButton={false}
            >
              <Car className="size-4" />
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
