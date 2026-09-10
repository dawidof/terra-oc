import { notFound } from "next/navigation";
import Link from "next/link";
import { getCarBySlug, getCarOffers, getCarMedia, getAllTrims, getSimilarCars, getUsedVehicleDetails } from "@/lib/queries";
import { getComparisonSpecs } from "@/lib/compare";
import { getConfigurationOptions, getCarColorImages } from "@/lib/leads";
import { generateCsrfToken } from "@/lib/csrf-actions";
import { CarDetailClient } from "@/components/car-detail-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Zap, Gauge, Calendar, MapPin, Shield } from "lucide-react";
import { CarCard } from "@/components/car-card";
import { TrimComparisonTable } from "@/components/trim-comparison-table";
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

  const colorOptionIds = optionGroups
    .filter((g) => g.type === "exterior_color" || g.type === "interior_color")
    .flatMap((g) => g.options.map((o) => o.id));

  let colorImagesMap: Record<string, { url: string; alt: string | null }[]> = {};
  try {
    const colorImagesEntries = await Promise.all(
      colorOptionIds.map(async (id) => {
        const imgs = await getCarColorImages(id);
        return [id, imgs.map((img) => ({ url: img.imageUrl, alt: img.alt }))] as const;
      })
    );
    colorImagesMap = Object.fromEntries(colorImagesEntries);
  } catch {
    // car_color_images table may not exist yet
  }

  const csrfToken = generateCsrfToken();

  const offer = offers[0];
  const usedDetails = offer ? await getUsedVehicleDetails(offer.id) : [];
  const usedDetail = usedDetails[0] || null;

  // Get comparison specs for trim comparison table
  const trimIds = allTrims.map((t) => t.id);
  const comparisonSpecs = await getComparisonSpecs(trimIds);

  const similarCars = await getSimilarCars(
    car.bodyType,
    car.trimId,
    offer ? Number(offer.estimatedTotalUsd) - 10000 : 20000,
    offer ? Number(offer.estimatedTotalUsd) + 10000 : 60000
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Admin bar */}
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

        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
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

        {/* Hero + Configurator + Extras — wrapped in client component for gallery state */}
        <CarDetailClient
          initialMedia={media.map((m) => ({ id: m.id, url: m.url, alt: m.alt }))}
          brandName={car.brandName}
          modelName={car.modelName}
          optionGroups={optionGroups}
          basePrice={Number(car.basePrice)}
          estimatedTotalUsd={offer?.estimatedTotalUsd || null}
          trimId={car.trimId}
          trimName={car.trimName}
          sourceCountry={offer?.sourceCountry || "Китай"}
          condition={offer?.condition || "new"}
          csrfToken={csrfToken}
          logisticsCost={offer?.estimatedLogistics ? Number(offer.estimatedLogistics) : null}
          customsCost={offer?.estimatedCustoms ? Number(offer.estimatedCustoms) : null}
          serviceFee={offer?.estimatedServiceFee ? Number(offer.estimatedServiceFee) : null}
          deliveryDays={offer?.deliveryDays || null}
          colorImages={colorImagesMap}
          heroInfo={
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={car.powertrainType === "bev" ? "default" : "secondary"}>
                  {powertrainLabel(car.powertrainType)}
                </Badge>
                {car.drivetrain && <Badge variant="outline">{car.drivetrain}</Badge>}
                {car.brandCountry && <Badge variant="outline">{car.brandCountry}</Badge>}
              </div>

              <h1 className="text-3xl font-bold mb-1">
                {car.brandName} {car.modelName}
              </h1>
              <p className="text-xl text-muted-foreground mb-4">
                {car.trimName} • {car.modelVersionName}
              </p>

              {car.shortDescription && (
                <p className="text-muted-foreground mb-6">{car.shortDescription}</p>
              )}

              {/* Pricing */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Цена авто</div>
                      <div className="text-2xl font-bold">{formatPrice(offer?.sourcePrice || car.basePrice)}</div>
                      {offer?.priceBasis && (
                        <div className="text-xs text-muted-foreground">{offer.priceBasis}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Ориентировочно под ключ</div>
                      <div className="text-2xl font-bold text-emerald-600">
                        {formatPrice(offer?.estimatedTotalUsd)}
                      </div>
                      {offer?.deliveryDays && (
                        <div className="text-xs text-muted-foreground">~{offer.deliveryDays} дней доставка</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Used vehicle details */}
              {usedDetail && (
                <Card className="mb-6 border-amber-200 bg-amber-50">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-600" />
                      Информация о б/у автомобиле
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {usedDetail.vin && (
                        <div>
                          <div className="text-muted-foreground">VIN</div>
                          <div className="font-mono font-medium">{usedDetail.vin}</div>
                        </div>
                      )}
                      {usedDetail.mileageKm != null && (
                        <div>
                          <div className="text-muted-foreground">Пробег</div>
                          <div className="font-medium">{usedDetail.mileageKm.toLocaleString("ru-RU")} км</div>
                        </div>
                      )}
                      {usedDetail.auctionGrade && (
                        <div>
                          <div className="text-muted-foreground">Класс аукциона</div>
                          <div className="font-medium">{usedDetail.auctionGrade}</div>
                        </div>
                      )}
                      {usedDetail.ownersCount != null && (
                        <div>
                          <div className="text-muted-foreground">Владельцев</div>
                          <div className="font-medium">{usedDetail.ownersCount}</div>
                        </div>
                      )}
                      {usedDetail.accidentStatus && (
                        <div>
                          <div className="text-muted-foreground">Аварийность</div>
                          <div className="font-medium">{usedDetail.accidentStatus}</div>
                        </div>
                      )}
                      {usedDetail.manufactureDate && (
                        <div>
                          <div className="text-muted-foreground">Дата выпуска</div>
                          <div className="font-medium">
                            {new Date(usedDetail.manufactureDate).toLocaleDateString("ru-RU")}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick specs */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {car.motorPowerKw && (
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Мощность</div>
                      <div className="font-medium">{car.motorPowerKw} кВт</div>
                    </div>
                  </div>
                )}
                {car.enginePowerHp && (
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Gauge className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Мощность</div>
                      <div className="font-medium">{car.enginePowerHp} л.с.</div>
                    </div>
                  </div>
                )}
                {car.rangeKm && (
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Zap className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Запас хода</div>
                      <div className="font-medium">{car.rangeKm} км</div>
                    </div>
                  </div>
                )}
                {car.acceleration0100 && (
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Gauge className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">0-100 км/ч</div>
                      <div className="font-medium">{car.acceleration0100} сек</div>
                    </div>
                  </div>
                )}
                {car.modelYearFrom && (
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Год</div>
                      <div className="font-medium">{car.modelYearFrom}</div>
                    </div>
                  </div>
                )}
                {offer?.sourceCountry && (
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="text-xs text-muted-foreground">Страна</div>
                      <div className="font-medium">{offer.sourceCountry}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <a href="#configurator">
                  <Button size="lg" className="w-full">
                    Выбрать комплектацию
                  </Button>
                </a>
              </div>

              {/* Contact buttons */}
              <div className="mt-4">
                <ContactButtons
                  brandName={car.brandName}
                  modelName={car.modelName}
                  trimName={car.trimName}
                  estimatedTotal={offer?.estimatedTotalUsd ? Number(offer.estimatedTotalUsd) : undefined}
                  variant="inline"
                />
              </div>
            </div>
          }
          trimComparison={
            allTrims.length > 1 && comparisonSpecs.length > 0 ? (
              <section className="mt-12">
                <h2 className="mb-6 text-2xl font-bold">Сравнение комплектаций</h2>
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
              <section className="mt-12">
                <h2 className="mb-6 text-2xl font-bold">Похожие автомобили</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
}
