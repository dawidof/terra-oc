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
import { Eyebrow, Heading } from "@/components/ui/section";
import { formatUsd } from "@/lib/format";
import type { FeaturedModel } from "@/lib/queries";

const trustPoints = [
  { icon: Timer, label: "Доставка за 3 недели" },
  { icon: Gauge, label: "Выгода до 35%" },
  { icon: ShieldCheck, label: "По договору, с гарантией" },
  { icon: FileCheck, label: "Полный цикл под ключ" },
];

interface HomeHeroProps {
  cars?: FeaturedModel[];
}

export function HomeHero({ cars = [] }: HomeHeroProps) {
  return (
    <section aria-label="Главная — TerraAuto" className="bg-surface-dark">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:items-center lg:gap-10 lg:py-24">
          <div className="lg:col-span-7">
            <Eyebrow tone="light">Прямой импорт · Ташкент</Eyebrow>

            <Heading as="h1" size="3xl" tone="inverse" className="mt-5">
              Автомобили под заказ из Кореи, Китая и Японии —{" "}
              <span className="text-brand">до 35% дешевле</span> рынка
            </Heading>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Подберём, выкупим и доставим авто в ваш город за 3 недели. По
              договору, с гарантией и под ключ.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 bg-brand px-7 text-brand-foreground shadow-sm hover:bg-brand-deep hover:shadow-md"
                render={<Link href="/cars" />}
                nativeButton={false}
              >
                Подобрать автомобиль
                <ArrowRight data-icon="inline-end" className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/20 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
                render={<Link href="/calculator" />}
                nativeButton={false}
              >
                Рассчитать стоимость
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            {cars.length > 0 ? <HeroCarStack cars={cars} /> : <HeroFallback />}
          </div>
        </div>

        <ul className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-white/10 py-8 sm:grid-cols-4">
          {trustPoints.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon className="size-4 text-brand" aria-hidden />
              </span>
              <span className="text-sm text-white/75">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HeroCarStack({ cars }: { cars: FeaturedModel[] }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-3 rounded-3xl bg-white/5 sm:-inset-4"
      />
      <div className="relative flex flex-col gap-4">
        {cars.map((car) => (
          <Link
            key={car.modelId}
            href={`/cars/${car.trimSlug}`}
            className="group flex items-center gap-4 rounded-xl bg-card p-3 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg"
          >
            <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-muted">
              {car.imageUrl && (
                <Image
                  src={car.imageUrl}
                  alt={`${car.brandName} ${car.modelName}`}
                  fill
                  priority
                  sizes="144px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {car.brandName}
              </p>
              <p className="mt-0.5 truncate text-sm font-bold tracking-tight text-foreground">
                {car.modelName}{" "}
                <span className="font-normal text-muted-foreground">
                  {car.trimName}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
                <span className="text-base font-bold tracking-[-0.02em] tabular-nums text-foreground">
                  {formatUsd(car.basePrice)}
                </span>
                {car.estimatedTotalUsd && (
                  <span className="text-xs font-semibold tabular-nums text-brand">
                    {formatUsd(car.estimatedTotalUsd)} под ключ
                  </span>
                )}
              </div>
            </div>
            <ArrowRight className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function HeroFallback() {
  return (
    <div className="flex h-full flex-col justify-center rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-10">
      <Heading size="sm" tone="inverse">
        Не знаете, с чего начать?
      </Heading>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
        Ответьте на пять вопросов — подберём автомобиль под ваш бюджет и задачи
        и покажем ориентировочную стоимость под ключ.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="h-11 bg-brand px-6 text-brand-foreground hover:bg-brand-deep"
          render={<Link href="/choose" />}
          nativeButton={false}
        >
          Подобрать за 2 минуты
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-11 border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
          render={<Link href="/compare" />}
          nativeButton={false}
        >
          Сравнить модели
        </Button>
      </div>
    </div>
  );
}
