import Link from "next/link";
import { ArrowRight, Car, FileText, Truck, MapPin } from "lucide-react";

const steps = [
  { num: "01", icon: Car, title: "Выбор", desc: "Найдите автомобиль в каталоге" },
  { num: "02", icon: FileText, title: "Оформление", desc: "Заключаем договор, вы оплачиваете" },
  { num: "03", icon: Truck, title: "Доставка", desc: "Логистика из-за рубежа и таможня" },
  { num: "04", icon: MapPin, title: "Получение", desc: "Заберите готовый автомобиль в Ташкенте" },
];

export function PurchaseProcess() {
  return (
    <section className="rounded-2xl bg-surface-dark p-8 text-surface-dark-foreground lg:p-10">
      <div className="mb-10 flex items-end justify-between gap-4 border-b border-surface-dark-foreground/10 pb-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand">
            Как это работает
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Процесс покупки</h2>
        </div>
        <Link
          href="/how-it-works"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-surface-dark-foreground/70 transition-colors hover:text-surface-dark-foreground"
        >
          Подробнее о процессе
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.title}>
            <div className="text-4xl font-bold tracking-tighter text-brand">{step.num}</div>
            <div className="mt-4 flex items-center gap-2">
              <step.icon className="h-4 w-4 text-brand/80" strokeWidth={1.75} />
              <h3 className="text-base font-semibold">{step.title}</h3>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-surface-dark-foreground/60">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
