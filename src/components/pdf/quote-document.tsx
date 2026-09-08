"use client";

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

interface QuoteData {
  quoteId: string;
  createdAt: string;
  validUntil: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  vehicle: {
    brandName: string;
    modelName: string;
    trimName: string;
    sourceCountry?: string;
    condition?: string;
  };
  configuration?: {
    exterior_color?: string;
    interior_color?: string;
    wheels?: string;
    options?: string[];
  };
  breakdown: {
    vehiclePrice: number;
    logistics: number;
    customsDuty: number;
    exciseTax: number;
    vat: number;
    certificationFees: number;
    serviceFee: number;
    total: number;
    exchangeRate?: number;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#10b981",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#10b981",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  label: {
    fontSize: 11,
    color: "#6b7280",
  },
  value: {
    fontSize: 11,
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    marginTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#10b981",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10b981",
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
  },
  badge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
  },
});

function formatPrice(price: number): string {
  return `$${price.toLocaleString("en-US")}`;
}

function QuoteDocument({ data }: { data: QuoteData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>TerraAuto</Text>
            <Text style={styles.subtitle}>Автомобили из Китая, Кореи, США и Дубая</Text>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={styles.title}>Расчёт стоимости</Text>
            <Text style={styles.subtitle}>№ {data.quoteId.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.subtitle}>
              от {new Date(data.createdAt).toLocaleDateString("ru-RU")}
            </Text>
          </View>
        </View>

        {/* Customer info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Клиент</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Имя</Text>
            <Text style={styles.value}>{data.customer.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Телефон</Text>
            <Text style={styles.value}>{data.customer.phone}</Text>
          </View>
          {data.customer.email && (
            <View style={styles.row}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{data.customer.email}</Text>
            </View>
          )}
        </View>

        {/* Vehicle info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Автомобиль</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Марка и модель</Text>
            <Text style={styles.value}>
              {data.vehicle.brandName} {data.vehicle.modelName}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Комплектация</Text>
            <Text style={styles.value}>{data.vehicle.trimName}</Text>
          </View>
          {data.vehicle.sourceCountry && (
            <View style={styles.row}>
              <Text style={styles.label}>Страна</Text>
              <Text style={styles.value}>{data.vehicle.sourceCountry}</Text>
            </View>
          )}
          {data.vehicle.condition && (
            <View style={styles.row}>
              <Text style={styles.label}>Состояние</Text>
              <Text style={styles.value}>
                {data.vehicle.condition === "new" ? "Новый" : "Б/у"}
              </Text>
            </View>
          )}
        </View>

        {/* Configuration */}
        {data.configuration && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Конфигурация</Text>
            {data.configuration.exterior_color && (
              <View style={styles.row}>
                <Text style={styles.label}>Цвет кузова</Text>
                <Text style={styles.value}>{data.configuration.exterior_color}</Text>
              </View>
            )}
            {data.configuration.interior_color && (
              <View style={styles.row}>
                <Text style={styles.label}>Цвет салона</Text>
                <Text style={styles.value}>{data.configuration.interior_color}</Text>
              </View>
            )}
            {data.configuration.wheels && (
              <View style={styles.row}>
                <Text style={styles.label}>Диски</Text>
                <Text style={styles.value}>{data.configuration.wheels}</Text>
              </View>
            )}
            {data.configuration.options && data.configuration.options.length > 0 && (
              <View style={styles.row}>
                <Text style={styles.label}>Опции</Text>
                <Text style={styles.value}>{data.configuration.options.join(", ")}</Text>
              </View>
            )}
          </View>
        )}

        {/* Price breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Расчёт стоимости</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Стоимость авто</Text>
            <Text style={styles.value}>{formatPrice(data.breakdown.vehiclePrice)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Логистика</Text>
            <Text style={styles.value}>{formatPrice(data.breakdown.logistics)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Таможенная пошлина</Text>
            <Text style={styles.value}>{formatPrice(data.breakdown.customsDuty)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Акциз</Text>
            <Text style={styles.value}>{formatPrice(data.breakdown.exciseTax)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>НДС</Text>
            <Text style={styles.value}>{formatPrice(data.breakdown.vat)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Сертификация</Text>
            <Text style={styles.value}>{formatPrice(data.breakdown.certificationFees)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Услуги компании</Text>
            <Text style={styles.value}>{formatPrice(data.breakdown.serviceFee)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>ИТОГО</Text>
            <Text style={styles.totalValue}>{formatPrice(data.breakdown.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Данный расчёт является предварительным.</Text>
          <Text>Точная стоимость будет рассчитана после выбора комплектации.</Text>
          <Text style={{ marginTop: 10 }}>
            Расчёт действителен до {new Date(data.validUntil).toLocaleDateString("ru-RU")}
          </Text>
          <Text style={{ marginTop: 10 }}>TerraAuto — terraauto.uz — +998 90 123 45 67</Text>
        </View>
      </Page>
    </Document>
  );
}

interface QuoteDownloadProps {
  data: QuoteData;
  className?: string;
}

export function QuoteDownload({ data, className = "" }: QuoteDownloadProps) {
  return (
    <PDFDownloadLink
      document={<QuoteDocument data={data} />}
      fileName={`terraauto-quote-${data.quoteId.slice(0, 8)}.pdf`}
    >
      {({ loading }) => (
        <Button variant="outline" size="sm" disabled={loading} className={className}>
          <FileDown className="mr-2 h-4 w-4" />
          {loading ? "Генерация..." : "Скачать PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
