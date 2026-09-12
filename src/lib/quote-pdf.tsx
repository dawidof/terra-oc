import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, customers, leadConfigurations, quotes } from "@/db/schema";
import { getMediaStorage } from "@/lib/media-storage";
import { QuoteDocument, type QuoteData } from "@/components/pdf/quote-document";

interface Breakdown {
  vehiclePrice: number;
  logistics: number;
  customsDuty: number;
  exciseTax: number;
  vat: number;
  certificationFees: number;
  serviceFee: number;
  total: number;
  exchangeRate?: number;
}

export function quotePdfKey(quoteId: string): string {
  return `quotes/${quoteId}.pdf`;
}

export function quotePdfUrl(quoteId: string): string {
  return `/api/quotes/pdf/${quoteId}`;
}

async function buildQuoteData(quoteId: string): Promise<QuoteData | null> {
  const [row] = await db
    .select({
      quote: quotes,
      lead: leads,
      customer: customers,
      config: leadConfigurations,
    })
    .from(quotes)
    .innerJoin(leads, eq(quotes.leadId, leads.id))
    .innerJoin(customers, eq(leads.customerId, customers.id))
    .leftJoin(leadConfigurations, eq(leadConfigurations.leadId, leads.id))
    .where(eq(quotes.id, quoteId))
    .limit(1);

  if (!row) return null;

  const { quote, lead, customer, config } = row;
  const configJson = (config?.configurationJson ?? {}) as Record<string, unknown>;

  let breakdown: Breakdown | null = null;

  const stored = configJson.calculatorBreakdown as Partial<Breakdown> | undefined;
  if (
    stored &&
    typeof stored.vehiclePrice === "number" &&
    typeof stored.total === "number"
  ) {
    breakdown = {
      vehiclePrice: stored.vehiclePrice,
      logistics: stored.logistics ?? 0,
      customsDuty: stored.customsDuty ?? 0,
      exciseTax: stored.exciseTax ?? 0,
      vat: stored.vat ?? 0,
      certificationFees: stored.certificationFees ?? 0,
      serviceFee: stored.serviceFee ?? 0,
      total: stored.total,
      exchangeRate:
        typeof stored.exchangeRate === "number" ? stored.exchangeRate : undefined,
    };
  } else if (config?.estimatedTotal) {
    breakdown = {
      vehiclePrice: Number(config.sourcePrice) || 0,
      logistics: Number(config.logisticsCost) || 0,
      customsDuty: Number(config.customsCost) || 0,
      exciseTax: 0,
      vat: 0,
      certificationFees: 0,
      serviceFee: Number(config.serviceFee) || 0,
      total: Number(config.estimatedTotal),
      exchangeRate: config.exchangeRate ? Number(config.exchangeRate) : undefined,
    };
  } else if (lead.estimatedTotalUsd) {
    breakdown = {
      vehiclePrice: Number(lead.estimatedTotalUsd),
      logistics: 0,
      customsDuty: 0,
      exciseTax: 0,
      vat: 0,
      certificationFees: 0,
      serviceFee: 0,
      total: Number(lead.estimatedTotalUsd),
    };
  }

  if (!breakdown) return null;

  return {
    quoteId: quote.id,
    createdAt: quote.createdAt.toISOString(),
    validUntil: (quote.validUntil ?? quote.createdAt).toISOString(),
    customer: {
      name: customer.name,
      phone: customer.phone || "—",
      email: customer.email || undefined,
    },
    vehicle: {
      brandName: config?.brandName || "",
      modelName: config?.modelName || "",
      trimName: config?.trimName || "",
      sourceCountry: config?.sourceCountry || undefined,
      condition: config?.condition || undefined,
    },
    configuration: {
      exterior_color: configJson.exterior_color as string | undefined,
      interior_color: configJson.interior_color as string | undefined,
      wheels: configJson.wheels as string | undefined,
      options: (configJson.options as string[] | undefined) ?? [],
    },
    breakdown,
  };
}

export async function generateQuotePdf(quoteId: string): Promise<string | null> {
  const data = await buildQuoteData(quoteId);
  if (!data) return null;

  const { renderToBuffer } = await import("@react-pdf/renderer");
  const buffer = await renderToBuffer(<QuoteDocument data={data} />);

  await getMediaStorage().put(
    quotePdfKey(quoteId),
    Buffer.from(buffer),
    "application/pdf"
  );

  const pdfUrl = quotePdfUrl(quoteId);
  await db.update(quotes).set({ pdfUrl }).where(eq(quotes.id, quoteId));

  return pdfUrl;
}
