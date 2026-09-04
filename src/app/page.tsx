import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-emerald-600">
            TerraAuto
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/cars"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Автомобили
            </Link>
            <Link
              href="/select"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Помочь выбрать
            </Link>
            <Link
              href="/calculator"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Калькулятор
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Как купить
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Вход в CRM
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            Автомобили из Китая, Кореи, США и Дубая под заказ
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Прямой импорт от производителя. Индивидуальная комплектация.
            Ориентировочная стоимость под ключ до заказа.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/cars">
              <Button size="lg">Смотреть каталог</Button>
            </Link>
            <Link href="/select">
              <Button variant="outline" size="lg">
                Помочь выбрать
              </Button>
            </Link>
          </div>
        </section>

        <section className="border-t bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-center text-3xl font-bold">
              Как мы работаем
            </h2>
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
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-8 text-center text-3xl font-bold">Почему TerraAuto</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { title: "Официальный договор", desc: "Полная юридическая прозрачность" },
                { title: "Прямой импорт", desc: "Без посредников — от производителя" },
                { title: "Расчёт до заказа", desc: "Знайте стоимость до принятия решения" },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border p-6 text-center">
                  <h3 className="mb-2 font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TerraAuto. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}
