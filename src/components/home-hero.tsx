import Link from "next/link";
import { ArrowRight, FileCheck, Gauge, ShieldCheck, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Eyebrow, Heading } from "@/components/ui/section";

const trustPoints = [
  { icon: Timer, label: "Доставка за 3 недели" },
  { icon: Gauge, label: "Выгода до 35%" },
  { icon: ShieldCheck, label: "По договору, с гарантией" },
  { icon: FileCheck, label: "Полный цикл под ключ" },
];

const heroStats = [
  { value: "3+ года", label: "импорта автомобилей в Узбекистан" },
  { value: "до 35%", label: "дешевле рынка" },
  { value: "20–30 дней", label: "доставка под ключ" },
  { value: "4 страны", label: "Китай, Корея, США, ОАЭ" },
];

export function HomeHero() {
  return (
    <section
      aria-label="Главная — TerraAuto"
      className="relative overflow-hidden bg-surface-dark"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 right-[8%] size-[34rem] rounded-full bg-brand/15 blur-3xl" />
        <div className="absolute -bottom-40 left-[2%] size-[26rem] rounded-full bg-brand/8 blur-3xl" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_75%_80%_at_50%_40%,black_35%,transparent_100%)]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6">
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
                render={<Link href="/choose" />}
                nativeButton={false}
              >
                Подбор за 2 минуты
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroStats />
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

function HeroStats() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-8 sm:px-8">
      <p className="text-xs font-semibold tracking-wide text-white/40 uppercase">
        TerraAuto в цифрах
      </p>
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8">
        {heroStats.map((stat) => (
          <div key={stat.value}>
            <p className="text-3xl leading-none font-bold tracking-tight text-brand sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-2 text-sm leading-snug text-white/60">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
