import Link from "next/link";
import { Star, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ReviewList } from "@/components/reviews/review-list";
import { Heading, Section } from "@/components/ui/section";
import { getPublishedReviews } from "@/lib/content";

export const metadata = {
  title: "Отзывы — TerraAuto",
  description: "Отзывы клиентов TerraAuto о покупке автомобилей из Китая",
};

export default async function ReviewsPage() {
  const reviews = await getPublishedReviews();

  return (
    <>
      <Section padding="spacious">
        <PageHeader
          eyebrow="Отзывы"
          title="Отзывы клиентов"
          description="Узнайте, что говорят о нас клиенты, которые уже получили свои автомобили"
          size="2xl"
        />
      </Section>

      <Section background="muted">
        <ReviewList reviews={reviews} />

        {reviews.length === 0 && (
          <div className="mt-2 rounded-xl bg-card px-6 py-12 text-center shadow-soft">
            <Star className="mx-auto mb-4 size-12 text-border" aria-hidden />
            <h2 className="mb-2 text-xl font-bold tracking-tight">
              Отзывы скоро появятся
            </h2>
            <p className="mb-6 text-muted-foreground">
              Мы только начинаем работу и скоро добавим отзывы первых клиентов
            </p>
            <Button
              className="bg-brand text-brand-foreground hover:bg-brand-deep"
              render={<Link href="/cars" />}
              nativeButton={false}
            >
              Смотреть автомобили
            </Button>
          </div>
        )}
      </Section>

      <Section background="dark" padding="spacious">
        <div className="mx-auto max-w-2xl text-center">
          <Heading size="xl" tone="inverse">
            Станьте нашим клиентом
          </Heading>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            Получите индивидуальный подбор автомобиля и полный расчёт стоимости
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 bg-brand px-7 text-brand-foreground shadow-sm hover:bg-brand-deep hover:shadow-md"
              render={<Link href="/choose" />}
              nativeButton={false}
            >
              <MessageSquare className="size-4" />
              Помочь выбрать
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/25 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/calculator" />}
              nativeButton={false}
            >
              Рассчитать стоимость
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
