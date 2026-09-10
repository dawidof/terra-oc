import Link from "next/link";
import { Phone, MessageSquare, MapPin, Clock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";

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
    <>
      <Section padding="spacious">
        <PageHeader
          eyebrow="Контакты"
          title="Свяжитесь с нами"
          description="Свяжитесь с нами удобным способом — мы всегда на связи"
          size="2xl"
        />
      </Section>

      <Section background="muted">
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {contacts.map((contact, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl bg-card p-6 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand shadow-sm">
                <contact.icon className="size-5 text-white" aria-hidden />
              </span>
              <div className="flex-1">
                <h3 className="font-bold tracking-tight">{contact.title}</h3>
                <a
                  href={contact.link}
                  target={contact.link.startsWith("http") ? "_blank" : undefined}
                  rel={contact.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="font-semibold text-brand hover:underline"
                >
                  {contact.value}
                </a>
                <p className="mt-1 text-sm text-muted-foreground">
                  {contact.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-5 max-w-4xl">
          <div className="flex items-start gap-4 rounded-xl bg-card p-6 shadow-soft">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand shadow-sm">
              <MapPin className="size-5 text-white" aria-hidden />
            </span>
            <div>
              <h3 className="font-bold tracking-tight">Наш офис</h3>
              <p className="text-muted-foreground">
                г. Ташкент, ул. Амира Темура, 108
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5" aria-hidden />
                Пн–Пт: 9:00–18:00, Сб: 10:00–15:00
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section background="dark" padding="spacious">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Нужна консультация?
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-white/70">
            Расскажем о процессе, поможем с выбором и рассчитаем стоимость
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
