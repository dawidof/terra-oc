import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  FileCheck,
  Gauge,
  ShieldCheck,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Eyebrow, Heading, Tag } from "@/components/ui/section";
import { formatUsd, powerLabel, powertrainLabel } from "@/lib/format";
import type { FeaturedModel } from "@/lib/queries";

const trustPoints = [
  { icon: ShieldCheck, label: "Официальный договор" },
  { icon: FileCheck, label: "Прямой импорт" },
  { icon: Gauge, label: "Индивидуальная комплектация" },
  { icon: Timer, label: "Доставка 20–30 дней" },
];

interface HomeHeroProps {
  featuredCar?: FeaturedModel | null;
}

export function HomeHero({ featuredCar }: HomeHeroProps) {
  return (
    <section className="border-b border-border">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
          <div className="flex flex-col justify-center lg:col-span-6">
            <Eyebrow tone="brand">Прямой импорт · Ташкент</Eyebrow>

            <Heading as="h1" size="2xl" className="mt-5">
              Автомобили из Китая, Кореи, США и Дубая под заказ
            </Heading>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Подберём, проверим, доставим и оформим автомобиль в Узбекистане.
              Вы заранее видите комплектацию и ориентировочную стоимость под
              ключ.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 px-6"
                render={<Link href="/cars" />}
              >
                Смотреть автомобили
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-6"
                render={<Link href="/calculator" />}
              >
                Рассчитать стоимость
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 lg:col-start-8">
            {featuredCar ? (
              <HeroCarCard car={featuredCar} />
            ) : (
              <HeroFallbackCard />
            )}
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-border py-8 sm:grid-cols-4">
          {trustPoints.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <Icon className="size-4 shrink-0 text-brand" aria-hidden />
              <span className="text-sm text-muted-foreground">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HeroCarCard({ car }: { car: FeaturedModel }) {
  const power = powerLabel(car.motorPowerKw);
  const range = car.rangeKm ? `${car.rangeKm} км` : null;

  return (
    <Link
      href={`/cars/${car.trimSlug}`}
      className="group block overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-foreground/20"
    >
      <div className="relative aspect-[16/10] bg-muted">
        {car.imageUrl ? (
          <Image
            src={car.imageUrl}
            alt={`${car.brandName} ${car.modelName}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Фото скоро
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {car.powertrainType && (
            <Tag variant="solid">{powertrainLabel(car.powertrainType)}</Tag>
          )}
          {car.drivetrain && (
            <Tag className="bg-white/85 text-foreground backdrop-blur-sm">
              {car.drivetrain}
            </Tag>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {car.brandName}
        </p>
        <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-balance">
          {car.modelName}{" "}
          <span className="font-normal text-muted-foreground">
            {car.trimName}
          </span>
        </h2>

        {(power || range) && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {power && <span>{power}</span>}
            {range && <span>Запас хода {range}</span>}
          </div>
        )}

        <div className="mt-5 flex items-end justify-between border-t border-border pt-5">
          <div>
            <p className="text-xs text-muted-foreground">Цена авто от</p>
            <p className="mt-0.5 text-2xl font-semibold tracking-[-0.02em] tabular-nums">
              {formatUsd(car.basePrice)}
            </p>
          </div>
          {car.estimatedTotalUsd && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Под ключ</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums text-brand">
                {formatUsd(car.estimatedTotalUsd)}
              </p>
            </div>
          )}
        </div>

        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
          Смотреть комплектацию
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function HeroFallbackCard() {
  return (
    <div className="flex h-full flex-col justify-center rounded-xl bg-muted p-8 ring-1 ring-foreground/10">
      <Heading size="sm">Не знаете, с чего начать?</Heading>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Ответьте на пять вопросов — подберём автомобиль под ваш бюджет и задачи
        и покажем ориентировочную стоимость под ключ.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="h-10 px-5" render={<Link href="/choose" />}>
          Помочь выбрать
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-10 px-5"
          render={<Link href="/compare" />}
        >
          Сравнить
        </Button>
      </div>
    </div>
  );
}
