import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  ChevronRight,
  Globe2,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Eyebrow, Heading, Section } from "@/components/ui/section";
import { HomeCarGrid } from "@/components/home-car-grid";
import { HomeHero } from "@/components/home-hero";
import { HomeSavings } from "@/components/home-savings";
import { HomeReviews } from "@/components/home-reviews";
import { HomeClientPhotos } from "@/components/home-client-photos";
import { BrandLogos } from "@/components/home-brand-logos";
import { getPublishedReviews } from "@/lib/content";
import { getAllBrands, getFeaturedModels } from "@/lib/queries";
import { client } from "@/db";

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

const avatarMap: Record<string, string> = {
  "Артём Ким": "/avatars/avatar1.jpg",
  "Дилшод Рустамов": "/avatars/avatar2.jpg",
  "Алексей Петров": "/avatars/avatar3.jpg",
  "Нодирбек Турсунов": "/avatars/avatar4.jpg",
  "Мария Сидорова": "/avatars/avatar5.jpg",
};

async function getReviewsWithImages() {
  const reviews = await getPublishedReviews(true);

  const enriched = await Promise.all(
    reviews.map(async (review, index) => {
      const avatarUrl = avatarMap[review.name] || `/avatars/avatar${(index % 5) + 1}.jpg`;

      if (!review.vehicleLabel) {
        return { ...review, imageUrls: review.imageUrl ? [review.imageUrl] : [], avatarUrl };
      }

      const vehicleName = review.vehicleLabel.split(" ")[0].toLowerCase();

      const mediaRows = await client`
        SELECT vm.url
        FROM vehicle_media vm
        JOIN model_versions mv ON vm.model_version_id = mv.id
        JOIN car_models cm ON mv.car_model_id = cm.id
        JOIN brands b ON cm.brand_id = b.id
        WHERE vm.trim_id IS NULL
        AND (
          LOWER(cm.name) LIKE ${`%${vehicleName}%`}
          OR LOWER(b.name) LIKE ${`%${vehicleName}%`}
        )
        ORDER BY vm.sort_order
        LIMIT 4
      `;

      const imageUrls = mediaRows.map((r) => r.url as string);
      if (review.imageUrl && !imageUrls.includes(review.imageUrl)) {
        imageUrls.unshift(review.imageUrl);
      }

      return { ...review, imageUrls: imageUrls.slice(0, 4), avatarUrl };
    })
  );

  return enriched;
}

export default async function HomePage() {
  const [featuredModels, reviews, allBrands] = await Promise.all([
    getFeaturedModels(),
    getReviewsWithImages(),
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

      <HomeHero cars={featuredModels.slice(0, 2)} />

      {featuredModels.length > 0 && (
        <Section id="popular">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Каталог</Eyebrow>
              <Heading size="xl" className="mt-3">
                Популярные автомобили
              </Heading>
            </div>
            <Link
              href="/cars"
              className="group inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-4 py-2 text-sm font-semibold text-brand-muted-foreground transition-colors hover:bg-brand hover:text-brand-foreground"
            >
              Каталог
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <HomeCarGrid models={featuredModels} className="mt-10" />
        </Section>
      )}

      <Section id="process" background="muted">
        <div className="max-w-2xl">
          <Eyebrow tone="brand">Процесс</Eyebrow>
          <Heading size="xl" className="mt-3">
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
              <span className="text-5xl font-bold tracking-tighter tabular-nums text-brand">
                {item.step}
              </span>
              <h3 className="mt-3 text-lg font-bold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <Link
            href="/how-it-works"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-brand"
          >
            Подробнее о процессе
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Section>

      <Section id="why">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <Eyebrow>Преимущества</Eyebrow>
            <Heading size="xl" className="mt-3">
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
                className="group rounded-xl border-t-4 border-brand bg-card p-6 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-brand shadow-sm">
                  <Icon className="size-5 text-white" aria-hidden />
                </span>
                <h3 className="mt-5 text-base font-bold tracking-tight">
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

      <HomeSavings />

      <BrandLogos brands={allBrands} />

      <Section id="choose" background="dark">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <Eyebrow tone="light">Подбор</Eyebrow>
            <Heading size="xl" tone="inverse" className="mt-3">
              Не знаете, какую машину выбрать?
            </Heading>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/70">
              Пройдите короткий опрос — подберём автомобиль под ваш бюджет и
              задачи, покажем варианты и ориентировочную стоимость под ключ.
            </p>
          </div>
          <div className="flex lg:col-span-5 lg:justify-end">
            <Button
              size="lg"
              className="h-12 bg-brand px-7 text-brand-foreground shadow-sm hover:bg-brand-deep hover:shadow-md"
              render={<Link href="/choose" />}
              nativeButton={false}
            >
              Подобрать за 2 минуты
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
          </div>
        </div>
      </Section>

      <Section id="faq">
        <div className="max-w-2xl">
          <Eyebrow>Вопросы</Eyebrow>
          <Heading size="xl" className="mt-3">
            Часто спрашивают
          </Heading>
        </div>
        <div className="mt-10 max-w-2xl divide-y divide-border">
          {faq.map((item) => (
            <details
              key={item.q}
              className="group border-l-2 border-transparent py-5 pl-4 transition-colors group-open:border-brand"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-semibold text-foreground marker:hidden">
                {item.q}
                <ChevronRight className="size-5 shrink-0 text-brand transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      <HomeReviews reviews={reviews.slice(0, 6)} />

      <HomeClientPhotos />

      <Section id="cta" background="dark" padding="spacious">
        <div className="max-w-2xl text-center">
          <Heading size="2xl" tone="inverse">
            Готовы найти свой автомобиль?
          </Heading>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            Начните с каталога или рассчитайте стоимость — мы ответим в течение
            рабочего дня.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 bg-brand px-7 text-brand-foreground shadow-sm hover:bg-brand-deep hover:shadow-md"
              render={<Link href="/cars" />}
              nativeButton={false}
            >
              Смотреть каталог
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/25 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
              render={<Link href="https://wa.me/998901234567" />}
              nativeButton={false}
            >
              <MessageCircle className="size-4" />
              Написать в WhatsApp
            </Button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/70">
            <Phone className="size-3.5" aria-hidden />
            +998 90 123 45 67
          </p>
        </div>
      </Section>
    </>
  );
}
