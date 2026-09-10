import Link from "next/link";
import { ArrowRight, Calculator, FileCheck, Globe2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Eyebrow, Heading, Section } from "@/components/ui/section";
import { HomeCarGrid } from "@/components/home-car-grid";
import { HomeHero } from "@/components/home-hero";
import { ReviewList } from "@/components/reviews/review-list";
import { getPublishedReviews } from "@/lib/content";
import { getFeaturedModels } from "@/lib/queries";

export const revalidate = 60;

const steps = [
  {
    step: "01",
    title: "Выбор",
    desc: "Найдите автомобиль в каталоге или пройдите короткий подбор.",
  },
  {
    step: "02",
    title: "Расчёт",
    desc: "Получите ориентировочную стоимость под ключ до заказа.",
  },
  {
    step: "03",
    title: "Заказ",
    desc: "Заключите договор и внесите оплату на расчётный счёт.",
  },
  {
    step: "04",
    title: "Доставка",
    desc: "Получите автомобиль в Ташкенте с полным оформлением.",
  },
];

const advantages = [
  {
    icon: ShieldCheck,
    title: "Официальный договор",
    desc: "Полная юридическая прозрачность. Оплата по договору на расчётный счёт.",
  },
  {
    icon: Globe2,
    title: "Прямой импорт",
    desc: "Закупаем автомобили напрямую у производителей без посредников.",
  },
  {
    icon: Calculator,
    title: "Расчёт до заказа",
    desc: "Вы заранее видите полную стоимость, включая логистику и таможню.",
  },
];

const sectionLink =
  "group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-brand";

export default async function HomePage() {
  const [featuredModels, reviews] = await Promise.all([
    getFeaturedModels(),
    getPublishedReviews(true),
  ]);

  return (
    <>
      <HomeHero featuredCar={featuredModels[0] ?? null} />

      {featuredModels.length > 0 && (
        <Section id="popular">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Каталог</Eyebrow>
              <Heading size="lg" className="mt-3">
                Популярные автомобили
              </Heading>
            </div>
            <Link href="/cars" className={sectionLink}>
              Смотреть все
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <HomeCarGrid models={featuredModels} className="mt-10" />
        </Section>
      )}

      <Section id="process" divide>
        <div className="max-w-2xl">
          <Eyebrow>Процесс</Eyebrow>
          <Heading size="lg" className="mt-3">
            Как мы работаем
          </Heading>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            От первого запроса до получения автомобиля в Ташкенте — четыре
            понятных шага.
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <li key={item.step} className="border-t border-border pt-5">
              <span className="text-sm font-semibold tabular-nums text-brand">
                {item.step}
              </span>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <Link href="/how-it-works" className={sectionLink}>
            Подробнее о процессе
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Section>

      <Section id="why" divide>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <Eyebrow>Преимущества</Eyebrow>
            <Heading size="lg" className="mt-3">
              Почему TerraAuto
            </Heading>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Более трёх лет импорта автомобилей в Узбекистан. Работаем по
              договору, показываем расчёт до оплаты и сопровождаем сделку до
              передачи автомобиля.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="mt-7 h-10 px-5"
              render={<Link href="/about" />}
            >
              О компании
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-8">
            {advantages.map(({ icon: Icon, title, desc }, index) => (
              <div
                key={title}
                className={
                  index === advantages.length - 1
                    ? "rounded-xl bg-card p-6 ring-1 ring-foreground/10 sm:col-span-2"
                    : "rounded-xl bg-card p-6 ring-1 ring-foreground/10"
                }
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-5 text-brand" aria-hidden />
                </span>
                <h3 className="mt-5 text-base font-semibold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="choose" background="muted" divide>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <Eyebrow tone="brand">Подбор</Eyebrow>
            <Heading size="lg" className="mt-3">
              Не знаете, какую машину выбрать?
            </Heading>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Пройдите короткий опрос — подберём автомобиль под ваш бюджет и
              задачи, покажем варианты и ориентировочную стоимость под ключ.
            </p>
          </div>
          <div className="flex lg:col-span-5 lg:justify-end">
            <Button
              size="lg"
              className="h-11 px-6"
              render={<Link href="/choose" />}
            >
              Помочь выбрать
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
          </div>
        </div>
      </Section>

      {reviews.length > 0 && (
        <Section id="reviews" divide>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>
                <FileCheck className="size-3.5" aria-hidden />
                Отзывы клиентов
              </Eyebrow>
              <Heading size="lg" className="mt-3">
                Что говорят владельцы
              </Heading>
            </div>
            <Link href="/reviews" className={sectionLink}>
              Все отзывы
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-10">
            <ReviewList reviews={reviews.slice(0, 3)} />
          </div>
        </Section>
      )}
    </>
  );
}
