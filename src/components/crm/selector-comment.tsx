import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  parseSelectorComment,
  translateAnswer,
  SELECTOR_ANSWER_TITLES,
  contactMethodLabel,
  type ParsedRecommendation,
  type SelectorContact,
} from "@/lib/selector-comment-parser";
import { lookupSelectorTrims, type SelectorTrimResult } from "@/lib/crm";
import { formatUsd } from "@/lib/format";
import {
  ArrowRight,
  Zap,
  Battery,
  Flame,
  Fuel,
  Route,
  Gauge,
  Phone,
  MessageSquare,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";

function scoreTone(score: number): string {
  if (score >= 80) return "bg-brand text-brand-foreground";
  if (score >= 60) return "bg-brand-muted text-brand-muted-foreground";
  return "bg-muted text-muted-foreground";
}

function powertrainLabel(type: string | null): string {
  switch (type) {
    case "bev": return "Электро";
    case "phev": return "Гибрид";
    case "hev": return "Гибрид";
    case "petrol": return "Бензин";
    case "diesel": return "Дизель";
    case "reev": return "REEV";
    default: return type || "";
  }
}

function powertrainIcon(type: string | null) {
  const cls = "h-3.5 w-3.5";
  switch (type) {
    case "bev": return <Zap className={cls} />;
    case "phev":
    case "hev": return <Battery className={cls} />;
    case "petrol": return <Flame className={cls} />;
    case "diesel": return <Fuel className={cls} />;
    case "reev": return <Zap className={cls} />;
    default: return null;
  }
}

function contactIcon(method: string) {
  switch (method) {
    case "phone": return <Phone className="h-3.5 w-3.5" />;
    case "telegram": return <MessageSquare className="h-3.5 w-3.5" />;
    case "whatsapp": return <MessageCircle className="h-3.5 w-3.5" />;
    default: return <Phone className="h-3.5 w-3.5" />;
  }
}

function PreferenceBadges({
  answers,
  fallbacks,
}: {
  answers: Record<string, string>;
  fallbacks: Record<string, string>;
}) {
  const keys = Object.keys(answers);
  if (keys.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((key) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs"
        >
          <span className="text-muted-foreground">
            {SELECTOR_ANSWER_TITLES[key] || key}:
          </span>
          <span className="font-medium">{translateAnswer(key, answers[key])}</span>
          {fallbacks[key] && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-muted-foreground">
                {translateAnswer(key, fallbacks[key])}
              </span>
            </>
          )}
        </span>
      ))}
    </div>
  );
}

function ContactInfo({ contact }: { contact: SelectorContact }) {
  const hasData =
    contact.preferredContactMethod ||
    contact.telegram ||
    contact.comment;

  if (!hasData) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-medium text-muted-foreground">Связь</p>
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {contact.preferredContactMethod && (
          <span className="inline-flex items-center gap-1.5">
            {contactIcon(contact.preferredContactMethod)}
            {contactMethodLabel(contact.preferredContactMethod)}
          </span>
        )}
        {contact.telegram && (
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            {contact.telegram}
          </span>
        )}
      </div>
      {contact.comment && (
        <p className="text-xs text-muted-foreground italic">
          &ldquo;{contact.comment}&rdquo;
        </p>
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  reasons,
}: {
  rec: SelectorTrimResult;
  reasons?: string[];
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border bg-card transition hover:shadow-soft">
      {rec.imageUrl && (
        <div className="relative h-28 w-32 flex-shrink-0 overflow-hidden bg-muted sm:h-36 sm:w-44">
          <img
            src={rec.imageUrl}
            alt={`${rec.brandName} ${rec.modelName}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
          <span
            className={`absolute left-2 top-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${scoreTone(rec.score)}`}
          >
            {rec.score}%
          </span>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
        <div>
          <div className="flex items-center gap-2">
            {!rec.imageUrl && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${scoreTone(rec.score)}`}
              >
                {rec.score}%
              </span>
            )}
            <h4 className="truncate text-sm font-bold">
              {rec.brandName} {rec.modelName}
            </h4>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {rec.trimName}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {rec.powertrainType && (
              <span className="inline-flex items-center gap-1">
                {powertrainIcon(rec.powertrainType)}
                {powertrainLabel(rec.powertrainType)}
              </span>
            )}
            {rec.rangeKm && (
              <span className="inline-flex items-center gap-1">
                <Route className="h-3 w-3" />
                {rec.rangeKm} км
              </span>
            )}
            {rec.acceleration0100 && (
              <span className="inline-flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                {rec.acceleration0100} сек
              </span>
            )}
          </div>
          {reasons && reasons.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {reasons.map((reason, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-brand" />
                  {reason}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between border-t pt-2">
          <p className="text-sm font-bold text-brand">
            {formatUsd(rec.estimatedTotalUsd)}
          </p>
          {rec.trimSlug && (
            <Link href={`/cars/${rec.trimSlug}`}>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                Подробнее
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function FallbackRec({ rec }: { rec: ParsedRecommendation }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      {rec.score > 0 && (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${scoreTone(rec.score)}`}
        >
          {rec.score}%
        </span>
      )}
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium">{rec.text}</span>
        {rec.reasons && rec.reasons.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {rec.reasons.map((reason, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 flex-shrink-0 text-brand" />
                {reason}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export async function SelectorComment({
  comment,
  source,
}: {
  comment: string;
  source?: string | null;
}) {
  const parsed = parseSelectorComment(comment);
  if (!parsed || (!Object.keys(parsed.answers).length && !parsed.recommendations.length)) {
    return (
      <div className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Комментарий клиента
        </p>
        <p className="whitespace-pre-wrap text-sm">{comment}</p>
      </div>
    );
  }

  const recTexts = parsed.recommendations.map((r) => ({
    text: r.text,
    score: r.score,
    trimId: r.trimId,
    reasons: r.reasons,
  }));

  const trims = recTexts.length > 0 ? await lookupSelectorTrims(recTexts) : [];

  const matchedTrimIds = new Set(trims.map((t) => t.trimId));
  const matchedTexts = new Set(trims.map((t) => `${t.brandName} ${t.modelName} ${t.trimName}`));

  const unmatched = parsed.recommendations.filter(
    (r) => !matchedTexts.has(r.text) && !r.trimId || (r.trimId && !matchedTrimIds.has(r.trimId))
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Подбор автомобиля
      </p>

      <PreferenceBadges answers={parsed.answers} fallbacks={parsed.fallbacks} />

      <ContactInfo contact={parsed.contact} />

      {parsed.recommendations.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            Рекомендованные автомобили ({parsed.recommendations.length})
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {trims.map((trim) => {
              const rec = parsed.recommendations.find(
                (r) => r.trimId === trim.trimId || r.text === `${trim.brandName} ${trim.modelName} ${trim.trimName}`
              );
              return (
                <RecommendationCard
                  key={trim.trimId}
                  rec={trim}
                  reasons={rec?.reasons}
                />
              );
            })}
            {unmatched.map((rec) => (
              <FallbackRec key={rec.text} rec={rec} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
