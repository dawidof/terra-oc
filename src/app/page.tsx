import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CarCard } from "@/components/car-card";
import { ReviewList } from "@/components/reviews/review-list";
import { getFeaturedCars } from "@/lib/queries";
import { getPublishedReviews } from "@/lib/content";

export default async function HomePage() {
  const [featuredCars, reviews] = await Promise.all([
    getFeaturedCars(),
    getPublishedReviews(true),
  ]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-5xl">
          Автомобили из Китая, Кореи, США и Дубая под заказ
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Подберём, проверим, доставим и оформим автомобиль в Узбекистане. Вы заранее видите
          комплектацию и ориентировочную стоимость под ключ.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/cars">
            <Button size="lg">Смотреть автомобили</Button>
          </Link>
          <Link href="/calculator">
            <Button variant="outline" size="lg">
              Рассчитать стоимость
            </Button>
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:gap-8">
          <span>✓ Прямые поставки</span>
          <span>✓ Официальный договор</span>
          <span>✓ Индивидуальный подбор</span>
          <span>✓ Доставка 20–30 дней</span>
        </div>
      </section>

      {/* Popular cars */}
      {featuredCars.length > 0 && (
        <section className="border-t bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Популярные автомобили</h2>
              <Link href="/cars" className="text-sm text-emerald-600 hover:underline">
                Смотреть все →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCars.slice(0, 8).map((car) => (
                <CarCard
                  key={car.trimId}
                  brandName={car.brandName}
                  brandSlug={car.brandSlug}
                  modelName={car.modelName}
                  modelSlug={car.modelSlug}
                  trimName={car.trimName}
                  trimSlug={car.trimSlug}
                  powertrainType={car.powertrainType}
                  drivetrain={car.drivetrain}
                  motorPowerKw={car.motorPowerKw}
                  enginePowerHp={null}
                  rangeKm={car.rangeKm}
                  basePrice={car.basePrice}
                  estimatedTotalUsd={car.estimatedTotalUsd}
                  imageUrl={car.imageUrl}
                  modelYear={null}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How we work */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">Как мы работаем</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              { step: "1", title: "Выбор", desc: "Найдите автомобиль или пройдите подбор" },
              { step: "2", title: "Расчёт", desc: "Получите ориентировочную стоимость под ключ" },
              { step: "3", title: "Заказ", desc: "Заключите договор и внесите оплату" },
              { step: "4", title: "Доставка", desc: "Получите автомобиль в Ташкенте" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/how-it-works" className="text-sm text-emerald-600 hover:underline">
              Подробнее о процессе →
            </Link>
          </div>
        </div>
      </section>

      {/* Why TerraAuto */}
      <section className="border-t bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">Почему TerraAuto</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { title: "Официальный договор", desc: "Полная юридическая прозрачность. Оплата по договору на расчётный счёт." },
              { title: "Прямой импорт", desc: "Закупаем автомобили напрямую у производителей без посредников." },
              { title: "Расчёт до заказа", desc: "Вы заранее видите полную стоимость включая логистику и таможню." },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border bg-white p-6 text-center">
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help me choose CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Не знаете, какую машину выбрать?</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Пройдите короткий опрос, и мы подберём подходящий автомобиль под ваш бюджет и потребности.
          </p>
          <Link href="/choose">
            <Button size="lg">Помочь выбрать</Button>
          </Link>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="border-t bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-3xl font-bold">Отзывы клиентов</h2>
              <Link href="/reviews" className="text-sm text-emerald-600 hover:underline">
                Все отзывы →
              </Link>
            </div>
            <ReviewList reviews={reviews.slice(0, 3)} />
          </div>
        </section>
      )}
    </div>
  );
}
