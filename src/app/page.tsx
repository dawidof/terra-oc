import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  ChevronRight,
  FileCheck,
  Globe2,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Eyebrow, Heading, Section } from "@/components/ui/section";
import { HomeCarGrid } from "@/components/home-car-grid";
import { HomeHero } from "@/components/home-hero";
import { BrandLogos } from "@/components/home-brand-logos";
import { ReviewList } from "@/components/reviews/review-list";
import { getPublishedReviews } from "@/lib/content";
import { getAllBrands, getFeaturedModels } from "@/lib/queries";

export const revalidate = 300;

const steps = [
  {
    step: "01",
    title: "Выбор",
    desc: "Найдите автомобиль в каталоге или пройдите короткий подбор за 2 минуты.",
  },
  {
    step: "02",
    title: "Расчёт",
    desc: "Получите полную стоимость под ключ — авто, логистика, таможня, оформление.",
  },
  {
    step: "03",
    title: "Заказ",
    desc: "Заключите договор и оплатите по безналичному расчёту. Цена фиксируется.",
  },
  {
    step: "04",
    title: "Доставка",
    desc: "Получите автомобиль в Ташкенте с таможней, сертификацией и постановкой на учёт.",
  },
];

const advantages = [
  {
    icon: ShieldCheck,
    title: "Официальный договор",
    desc: "Полная юридическая прозрачность. Оплата по договору на расчётный счёт — никаких наличных.",
  },
  {
    icon: Globe2,
    title: "Прямой импорт",
    desc: "Закупаем напрямую у производителей без посредников — ниже цена, выше контроль качества.",
  },
  {
    icon: Calculator,
    title: "Расчёт до оплаты",
    desc: "Полная стоимость с таможней и логистикой — до того, как вы внесёте первый рубль.",
  },
];

const faq = [
  {
    q: "Сколько занимает доставка?",
    a: "От 20 до 30 рабочих дней в зависимости от страны и модели. Точные сроки фиксируем в договоре.",
  },
  {
    q: "Что входит в стоимость «под ключ»?",
    a: "Автомобиль, международная логистика, таможенные пошлины, сертификация и постановка на учёт в Узбекистане.",
  },
  {
    q: "Как я оплачиваете?",
    a: "Безналичный перевод по договору. Возможна рассрочка — уточняйте у менеджера.",
  },
  {
    q: "Могу ли я выбрать комплектацию сам?",
    a: "Да. Вы определяете цвет, опции и комплектацию — мы подтвердим наличие и итоговую цену.",
  },
  {
    q: "Что если автомобиль придёт повреждённым?",
    a: "Мы проводим фотоконтроль до и после погрузки. В случае повреждений — решаем вопрос за счёт страхования.",
  },
];

const sectionLink =
  "group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-brand";

export default async function HomePage() {
  const [featuredModels, reviews, allBrands] = await Promise.all([
    getFeaturedModels(),
    getPublishedReviews(true),
    getAllBrands(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "TerraAuto",
            description:
              "Автомобили из Китая, Кореи, США и Дубая с доставкой и оформлением в Узбекистане",
            url: "https://terraauto.uz",
            telephone: "+998901234567",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Ташкент",
              addressCountry: "UZ",
            },
            sameAs: [
              "https://instagram.com/terraauto_",
              "https://youtube.com/@TerraAutoUz",
              "https://wa.me/998901234567",
              "https://t.me/terraauto_",
            ],
          }),
        }}
      />

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
              Каталог
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
              <span
                className="text-sm font-semibold tabular-nums text-brand"
                aria-hidden
              >
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
              3+ года импорта автомобилей в Узбекистан. Фиксированная цена в
              договоре, полная прозрачность до оплаты и сопровождение до передачи
              ключей.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="mt-7 h-10 px-5"
              render={<Link href="/about" />}
              nativeButton={false}
            >
              О компании
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-3 lg:col-span-8">
            {advantages.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl bg-card p-6 ring-1 ring-foreground/10"
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

      <BrandLogos brands={allBrands} />

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
              nativeButton={false}
            >
              Подобрать за 2 минуты
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
          </div>
        </div>
      </Section>

      <Section id="faq" divide>
        <div className="max-w-2xl">
          <Eyebrow>Вопросы</Eyebrow>
          <Heading size="lg" className="mt-3">
            Часто спрашивают
          </Heading>
        </div>
        <div className="mt-10 max-w-2xl divide-y divide-border">
          {faq.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-medium text-foreground marker:hidden">
                {item.q}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
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

      {reviews.length === 0 && (
        <Section id="reviews" divide>
          <Eyebrow>
            <FileCheck className="size-3.5" aria-hidden />
            Отзывы клиентов
          </Eyebrow>
          <Heading size="lg" className="mt-3">
            Что говорят владельцы
          </Heading>
          <p className="mt-4 text-muted-foreground">
            Отзывы скоро появятся — пока что вы можете изучить каталог и
            рассчитать стоимость.
          </p>
        </Section>
      )}

      <Section id="cta" background="muted" divide>
        <div className="max-w-2xl text-center">
          <Heading size="lg">
            Готовы найти свой автомобиль?
          </Heading>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Начните с каталога или рассчитайте стоимость — мы ответим в течение
            рабочего дня.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-11 px-6"
              render={<Link href="/cars" />}
              nativeButton={false}
            >
              Смотреть каталог
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-6"
              render={<Link href="https://wa.me/998901234567" />}
              nativeButton={false}
            >
              <MessageCircle className="size-4" />
              Написать в WhatsApp
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Phone className="size-3.5" aria-hidden />
            +998 90 123 45 67
          </p>
        </div>
      </Section>
    </>
  );
}
