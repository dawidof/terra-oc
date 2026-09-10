import { Car, BadgeRussianRuble } from "lucide-react";

import { Heading, Section } from "@/components/ui/section";

const plates = [
  {
    icon: Car,
    title: "Покупка авто по реальным ценам",
    desc: "Мы подбираем для вас автомобили напрямую у продавцов — без перекупов, дилеров и скрытых наценок.",
  },
  {
    icon: BadgeRussianRuble,
    title: "Экономия на таможенных пошлинах",
    desc: "Мы выбираем автомобили с самыми минимальными тарифами для импорта, чтобы вы платили меньше.",
  },
];

export function HomeSavings() {
  return (
    <Section id="savings" divide>
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <p className="text-5xl font-bold tracking-tight tabular-nums text-foreground sm:text-6xl">
            500 000 ₽
          </p>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            в среднем, наши клиенты экономят на покупке авто
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7">
          {plates.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl bg-card p-6 shadow-soft"
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
  );
}
