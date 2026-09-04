import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReviewList } from "@/components/reviews/review-list";
import { getPublishedReviews } from "@/lib/content";
import { Star, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Отзывы — TerraAuto",
  description: "Отзывы клиентов TerraAuto о покупке автомобилей из Китая",
};

export default async function ReviewsPage() {
  const reviews = await getPublishedReviews();

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Отзывы клиентов</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Узнайте, что говорят о нас клиенты, которые уже получили свои автомобили
          </p>
        </div>

        <ReviewList reviews={reviews} />

        {reviews.length === 0 && (
          <div className="mt-12 rounded-lg border bg-gray-50 py-12 text-center">
            <Star className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h2 className="mb-2 text-xl font-semibold">Отзывы скоро появятся</h2>
            <p className="mb-6 text-muted-foreground">
              Мы только начинаем работу и скоро добавим отзывы первых клиентов
            </p>
            <Link href="/cars">
              <Button>Смотреть автомобили</Button>
            </Link>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 rounded-lg bg-emerald-50 py-12 text-center">
          <h2 className="mb-4 text-2xl font-bold">Станьте нашим клиентом</h2>
          <p className="mb-6 text-muted-foreground">
            Получите индивидуальный подбор автомобиля и полный расчёт стоимости
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/choose">
              <Button size="lg">
                <MessageSquare className="mr-2 h-4 w-4" />
                Помочь выбрать
              </Button>
            </Link>
            <Link href="/calculator">
              <Button variant="outline" size="lg">
                Рассчитать стоимость
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
