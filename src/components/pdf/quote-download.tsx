"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

import { QuoteDocument, type QuoteData } from "@/components/pdf/quote-document";

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
