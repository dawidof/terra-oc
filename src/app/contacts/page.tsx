import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, MessageSquare, MapPin, Clock, Mail } from "lucide-react";

export const metadata = {
  title: "Контакты — TerraAuto",
  description: "Свяжитесь с нами для консультации по покупке автомобиля",
};

const contacts = [
  {
    icon: Phone,
    title: "Телефон",
    value: "+998 90 123 45 67",
    link: "tel:+998901234567",
    description: "Ежедневно с 9:00 до 21:00",
  },
  {
    icon: MessageSquare,
    title: "Telegram",
    value: "@terraauto",
    link: "https://t.me/terraauto",
    description: "Быстрый ответ в мессенджере",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp",
    value: "+998 90 123 45 67",
    link: "https://wa.me/998901234567",
    description: "Для удобного общения",
  },
  {
    icon: Mail,
    title: "Email",
    value: "info@terraauto.uz",
    link: "mailto:info@terraauto.uz",
    description: "Для официальных запросов",
  },
];

export default async function ContactsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">Контакты</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Свяжитесь с нами удобным способом — мы всегда на связи
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
          {contacts.map((contact, i) => (
            <Card key={i}>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="rounded-full bg-emerald-100 p-3">
                  <contact.icon className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{contact.title}</h3>
                  <a
                    href={contact.link}
                    target={contact.link.startsWith("http") ? "_blank" : undefined}
                    rel={contact.link.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-emerald-600 hover:underline"
                  >
                    {contact.value}
                  </a>
                  <p className="mt-1 text-sm text-muted-foreground">{contact.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Address */}
        <div className="mx-auto mt-12 max-w-4xl">
          <Card>
            <CardContent className="flex items-start gap-4 p-6">
              <div className="rounded-full bg-emerald-100 p-3">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Наш офис</h3>
                <p className="text-muted-foreground">
                  г. Ташкент, ул. Амира Темура, 108
                </p>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Пн–Пт: 9:00–18:00, Сб: 10:00–15:00
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mx-auto mt-12 max-w-4xl rounded-lg bg-emerald-50 py-12 text-center">
          <h2 className="mb-4 text-2xl font-bold">Нужна консультация?</h2>
          <p className="mb-6 text-muted-foreground">
            Расскажем о процессе, поможем с выбором и рассчитаем стоимость
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
