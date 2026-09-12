import { notFound } from "next/navigation";
import Link from "next/link";
import { getCarBySlug, getCarOffers, getCarMedia, getAllTrims, getSimilarCars, getUsedVehicleDetails } from "@/lib/queries";
import { calculate, type CalculatorInput } from "@/lib/calculator";
import { getComparisonSpecs } from "@/lib/compare";
import { getConfigurationOptions, getCarColorImages } from "@/lib/leads";
import { CarDetailClient } from "@/components/car-detail-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Shield, Gauge, Fuel, Settings, MapPin, Cog, Calendar, ArrowRight, Battery, BatteryCharging, Check, Flame, Timer, Zap } from "lucide-react";
import { formatUsd, powerLabel } from "@/lib/format";
import { CarCard } from "@/components/car-card";
import { TrimComparisonTable } from "@/components/trim-comparison-table";
import { PreserveScrollLink } from "@/components/preserve-scroll-link";
import { VehicleAdminBar } from "@/components/admin/vehicle-admin-bar";
import { ContactButtons } from "@/components/contact-buttons";

interface Props {
  params: Promise<{ slug: string }>;
}

function formatPrice(price: string | null): string {
  if (!price) return "Цена уточняется";
  return `$${Number(price).toLocaleString("en-US")}`;
}

function powertrainLabel(type: string | null): string {
  switch (type) {
    case "bev": return "Электро";
    case "phev": return "Гибрид";
    case "hev": return "Гибрид";
    case "reev": return "REEV";
    case "petrol": return "Бензин";
    case "diesel": return "Дизель";
    default: return type || "";
  }
}

function powertrainIcon(type: string | null) {
  const cls = "size-3";
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

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) return { title: "Автомобиль не найден" };
  return {
    title: `${car.brandName} ${car.modelName} ${car.trimName} — TerraAuto`,
    description: car.shortDescription || `${car.brandName} ${car.modelName} ${car.trimName}. Электромобиль из Китая.`,
  };
}

export default async function CarDetailPage({ params }: Props) {
  const { slug } = await params;
  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const [offers, media, allTrims, optionGroups] = await Promise.all([
    getCarOffers(car.trimId),
    getCarMedia(car.modelVersionId),
    getAllTrims(car.modelVersionId),
    getConfigurationOptions(car.trimId),
  ]);

  const offer = offers[0];
  const trimIds = allTrims.map((t) => t.id);

  const computedBreakdown = await calculate({
    sourceCountry: offer?.sourceCountry || "Китай",
    condition: offer?.condition === "used" ? "used" : "new",
    purchasePrice: Number(car.basePrice),
    currency: "USD",
    powertrain: car.powertrainType as CalculatorInput["powertrain"],
    trimId: car.trimId,
  });

  const totalUsd =
    computedBreakdown?.total ??
    (offer?.estimatedTotalUsd ? Number(offer.estimatedTotalUsd) : null);
  const logisticsCost =
    computedBreakdown?.logistics ??
    (offer?.estimatedLogistics ? Number(offer.estimatedLogistics) : null);
  const customsCost = computedBreakdown
    ? computedBreakdown.customsDuty + computedBreakdown.exciseTax + computedBreakdown.vat
    : offer?.estimatedCustoms
      ? Number(offer.estimatedCustoms)
      : null;
  const serviceCost = computedBreakdown
    ? computedBreakdown.certificationFees + computedBreakdown.serviceFee
    : offer?.estimatedServiceFee
      ? Number(offer.estimatedServiceFee)
      : null;

  const colorOptionIds = optionGroups
    .filter((g) => g.type === "exterior_color" || g.type === "interior_color")
    .flatMap((g) => g.options.map((o) => o.id));

  const [colorImagesMap, usedDetails, comparisonSpecs, similarCars] = await Promise.all([
    (async () => {
      try {
        const entries = await Promise.all(
          colorOptionIds.map(async (id) => {
            const imgs = await getCarColorImages(id);
            return [id, imgs.map((img) => ({ url: img.imageUrl, alt: img.alt }))] as const;
          })
        );
        return Object.fromEntries(entries);
      } catch {
        return {} as Record<string, { url: string; alt: string | null }[]>;
      }
    })(),
    offer ? getUsedVehicleDetails(offer.id) : Promise.resolve([]),
    getComparisonSpecs(trimIds),
    getSimilarCars(
      car.bodyType,
      car.trimId,
      offer ? Number(offer.estimatedTotalUsd) - 10000 : 20000,
      offer ? Number(offer.estimatedTotalUsd) + 10000 : 60000
    ),
  ]);

  const usedDetail = usedDetails[0] || null;

  return (
    <div className="min-h-screen">
      <VehicleAdminBar
        trimId={car.trimId}
        data={{
          trimName: car.trimName,
          trimSlug: car.trimSlug,
          powertrainType: car.powertrainType,
          drivetrain: car.drivetrain,
          motorPowerKw: car.motorPowerKw,
          rangeKm: car.rangeKm,
          acceleration0100: car.acceleration0100,
          batteryCapacityKwh: car.batteryCapacityKwh,
          basePrice: car.basePrice,
          estimatedTotalUsd: offer?.estimatedTotalUsd || null,
          sourcePrice: offer?.sourcePrice || null,
          deliveryDays: offer?.deliveryDays || null,
          active: true,
        }}
      />

      <nav className="container mx-auto flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground sm:px-6">
        <Link href="/" className="hover:text-foreground">Главная</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/cars" className="hover:text-foreground">Автомобили</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/cars?brand=${car.brandSlug}`} className="hover:text-foreground">
          {car.brandName}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{car.modelName}</span>
      </nav>

      <CarDetailClient
          initialMedia={media.map((m) => ({ id: m.id, url: m.url, alt: m.alt }))}
          brandName={car.brandName}
          modelName={car.modelName}
          optionGroups={optionGroups}
          basePrice={Number(car.basePrice)}
          estimatedTotalUsd={totalUsd != null ? String(totalUsd) : null}
          trimId={car.trimId}
          trimName={car.trimName}
          modelVersionId={car.modelVersionId}
          sourceCountry={offer?.sourceCountry || "Китай"}
           condition={offer?.condition || "new"}
           logisticsCost={logisticsCost}
          customsCost={customsCost}
          serviceFee={serviceCost}
          detailedBreakdown={computedBreakdown}
          deliveryDays={offer?.deliveryDays || null}
          colorImages={colorImagesMap}
          heroInfo={
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={car.powertrainType === "bev" ? "default" : "secondary"}
                    className={
                      car.powertrainType === "bev"
                        ? "bg-brand text-brand-foreground"
                        : undefined
                    }
                  >
                    {powertrainLabel(car.powertrainType)}
                  </Badge>
                  {car.drivetrain && <Badge variant="outline">{car.drivetrain}</Badge>}
                  {car.brandCountry && <Badge variant="outline">{car.brandCountry}</Badge>}
                </div>

                <h1 className="text-3xl font-bold tracking-tight mb-1">
                  {car.brandName} {car.modelName}
                </h1>
                <p className="text-xl text-muted-foreground">
                  {car.trimName} • {car.modelVersionName}
                </p>
              </div>

              <div className="rounded-xl bg-brand-muted px-4 py-3.5">
                <div className="text-sm text-brand-muted-foreground">
                  Под ключ в Ташкент
                  {offer?.deliveryDays && <> • ~{offer.deliveryDays} дней доставка</>}
                </div>
                <div className="mt-1 text-3xl font-bold tracking-[-0.02em] tabular-nums text-foreground">
                  {formatPrice(totalUsd != null ? String(totalUsd) : null)}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a href="#configurator">
                  <Button
                    size="lg"
                    className="bg-brand text-brand-foreground shadow-sm hover:bg-brand-deep"
                  >
                    Отправить запрос
                  </Button>
                </a>
                <Button
                  size="lg"
                  variant="outline"
                  render={
                    <Link
                      href={`/calculator?trim=${car.trimId}&country=${encodeURIComponent(
                        offer?.sourceCountry || "Китай"
                      )}${offer?.condition === "used" ? "&condition=used" : ""}`}
                    />
                  }
                  nativeButton={false}
                >
                  Рассчитать стоимость
                </Button>
                <ContactButtons
                  brandName={car.brandName}
                  modelName={car.modelName}
                  trimName={car.trimName}
                  estimatedTotal={totalUsd ?? undefined}
                  variant="inline"
                />
              </div>

              {usedDetail && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    Б/у автомобиль
                  </h3>
                  <div className="space-y-0 divide-y">
                    {usedDetail.vin && (
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-muted-foreground">VIN</span>
                        <span className="font-mono font-medium">{usedDetail.vin}</span>
                      </div>
                    )}
                    {usedDetail.mileageKm != null && (
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-muted-foreground">Пробег</span>
                        <span className="font-medium">{usedDetail.mileageKm.toLocaleString("ru-RU")} км</span>
                      </div>
                    )}
                    {usedDetail.auctionGrade && (
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-muted-foreground">Класс аукциона</span>
                        <span className="font-medium">{usedDetail.auctionGrade}</span>
                      </div>
                    )}
                    {usedDetail.ownersCount != null && (
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-muted-foreground">Владельцев</span>
                        <span className="font-medium">{usedDetail.ownersCount}</span>
                      </div>
                    )}
                    {usedDetail.accidentStatus && (
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-muted-foreground">Аварийность</span>
                        <span className="font-medium">{usedDetail.accidentStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          }
          specs={
            <div key="specs" className="border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Характеристики</h3>
              <div className="flex flex-wrap gap-4">
                {(
                  [
                    (offer?.mileageKm != null || usedDetail?.mileageKm != null)
                      ? { icon: Gauge, label: "Пробег", value: `${(offer?.mileageKm || usedDetail?.mileageKm || 0).toLocaleString("ru-RU")} км` }
                      : null,
                    { icon: Fuel, label: "Двигатель", value: powertrainLabel(car.powertrainType) },
                    car.drivetrain ? { icon: Settings, label: "Привод", value: car.drivetrain } : null,
                    offer?.sourceCountry ? { icon: MapPin, label: "Страна", value: offer.sourceCountry } : null,
                    car.engineDisplacementCc ? { icon: Cog, label: "Объём", value: `${(car.engineDisplacementCc / 1000).toFixed(2)} л.` } : null,
                    car.modelYearFrom ? { icon: Calendar, label: "Год", value: String(car.modelYearFrom) } : null,
                  ] as { icon: typeof Gauge; label: string; value: string }[]
                )
                  .filter(Boolean)
                  .map((spec) => (
                    <div key={spec.label} className="flex flex-col items-center gap-0.5 w-[90px]">
                      <spec.icon className="h-8 w-8 text-brand" strokeWidth={1.5} />
                      <span className="text-sm font-bold leading-tight">{spec.value}</span>
                      <span className="text-[11px] text-muted-foreground leading-tight">{spec.label}</span>
                    </div>
                  ))}
              </div>
            </div>
          }
          trimSelector={
            allTrims.length > 1 ? (
              <section key="trims" className="mt-12">
                <h2 className="mb-6 text-2xl font-bold tracking-tight">Комплектации</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {allTrims.map((trim) => {
                    const isCurrent = trim.slug === slug;
                    const power = powerLabel(trim.motorPowerKw, trim.enginePowerHp);
                    const card = (
                      <Card
                        className={`group h-full transition duration-200 ${
                          isCurrent
                            ? "bg-brand-muted/40 ring-2 ring-brand"
                            : "hover:-translate-y-0.5 hover:shadow-md hover:ring-2 hover:ring-brand/40"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold leading-snug">{trim.name}</h3>
                            {isCurrent && (
                              <Badge className="shrink-0 gap-1 bg-brand text-brand-foreground">
                                <Check className="size-3" />
                                Текущая
                              </Badge>
                            )}
                          </div>

                          {(trim.powertrainType || trim.drivetrain) && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {trim.powertrainType && (
                                <Badge variant="secondary" className="gap-1">
                                  {powertrainIcon(trim.powertrainType)}
                                  {powertrainLabel(trim.powertrainType)}
                                </Badge>
                              )}
                              {trim.drivetrain && (
                                <Badge variant="outline">{trim.drivetrain}</Badge>
                              )}
                            </div>
                          )}

                          {(power || trim.rangeKm || trim.acceleration0100) && (
                            <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                              {power && (
                                <div className="flex items-center gap-2">
                                  <Gauge className="size-3.5 text-brand" />
                                  {power}
                                </div>
                              )}
                              {trim.rangeKm && (
                                <div className="flex items-center gap-2">
                                  <BatteryCharging className="size-3.5 text-brand" />
                                  {trim.rangeKm} км запас хода
                                </div>
                              )}
                              {trim.acceleration0100 && (
                                <div className="flex items-center gap-2">
                                  <Timer className="size-3.5 text-brand" />
                                  0-100: {trim.acceleration0100} сек
                                </div>
                              )}
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-muted px-3 py-2.5">
                            <div>
                              <p className="text-xs text-brand-muted-foreground">от</p>
                              <p className="mt-0.5 text-lg font-bold tracking-[-0.02em] tabular-nums">
                                {formatUsd(trim.basePrice)}
                              </p>
                            </div>
                            {!isCurrent && (
                              <span className="inline-flex items-center gap-1 text-sm font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                                Выбрать
                                <ArrowRight className="size-4" />
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                    return isCurrent ? (
                      <div key={trim.id}>{card}</div>
                    ) : (
                      <PreserveScrollLink
                        key={trim.id}
                        href={`/cars/${trim.slug}`}
                        className="block h-full"
                      >
                        {card}
                      </PreserveScrollLink>
                    );
                  })}
                </div>
              </section>
            ) : undefined
          }
          trimComparison={
            allTrims.length > 1 && comparisonSpecs.length > 0 ? (
              <section key="trim-comparison" className="mt-12">
                <h2 className="mb-6 text-2xl font-bold tracking-tight">Сравнение комплектаций</h2>
                <Card>
                  <CardContent className="p-6">
                    <TrimComparisonTable
                      trims={allTrims}
                      specs={comparisonSpecs}
                      currentSlug={slug}
                    />
                  </CardContent>
                </Card>
              </section>
            ) : undefined
          }
          similarCars={
            similarCars.length > 0 ? (
              <section>
                <h2 className="mb-6 text-2xl font-bold tracking-tight">Похожие автомобили</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {similarCars.map((car) => (
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
              </section>
            ) : undefined
          }
        />
    </div>
  );
}
