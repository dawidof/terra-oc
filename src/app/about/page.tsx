import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Truck, Clock, Headphones, MessageSquare, Car } from "lucide-react";

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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">О компании TerraAuto</h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Мы помогаем людям в Узбекистане получить доступ к качественным автомобилям
            из Китая, Кореи, США и Дубая по прозрачным ценам и с полным сервисом.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-16 rounded-lg bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <h2 className="mb-6 text-2xl font-bold">Наша миссия</h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <p className="mb-4 text-muted-foreground">
                  TerraAuto создана для того, чтобы сделать покупку автомобиля из-за рубежа
                  простой, прозрачной и безопасной. Мы берём на себя весь процесс: от выбора
                  автомобиля до его регистрации в Ташкенте.
                </p>
                <p className="text-muted-foreground">
                  Мы работаем с проверенными поставщиками и логистическими компаниями,
                  чтобы гарантировать качество сервиса и сроки доставки.
                </p>
              </div>
              <div>
                <p className="mb-4 text-muted-foreground">
                  Наша команда — это профессионалы с многолетним опытом в автомобильном
                  импорте. Мы знаем все нюансы таможенного оформления и поможем избежать
                  распространённых ошибок.
                </p>
                <p className="text-muted-foreground">
                  Мы не просто продаём автомобили — мы создаём долгосрочные отношения
                  с нашими клиентами, основанные на доверии и качестве сервиса.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Advantages */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold">Почему выбирают нас</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((adv, i) => (
              <Card key={i}>
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 rounded-full bg-emerald-100 p-3">
                    <adv.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="mb-2 font-semibold">{adv.title}</h3>
                  <p className="text-sm text-muted-foreground">{adv.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-lg bg-emerald-50 py-12 text-center">
          <h2 className="mb-4 text-2xl font-bold">Готовы купить автомобиль?</h2>
          <p className="mb-6 text-muted-foreground">
            Начните с просмотра каталога или получите персональный подбор
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/cars">
              <Button size="lg">
                <Car className="mr-2 h-4 w-4" />
                Смотреть автомобили
              </Button>
            </Link>
            <Link href="/choose">
              <Button variant="outline" size="lg">
                <MessageSquare className="mr-2 h-4 w-4" />
                Помочь выбрать
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
