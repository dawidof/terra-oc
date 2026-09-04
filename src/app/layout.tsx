import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Analytics } from "@/components/analytics";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "TerraAuto — Автомобили из Китая, Кореи, США и Дубая",
    template: "%s | TerraAuto",
  },
  description:
    "Прямой импорт автомобилей в Узбекистан. Индивидуальная комплектация, расчёт стоимости до заказа.",
  metadataBase: new URL("https://terraauto.uz"),
  openGraph: {
    type: "website",
    locale: "ru_UZ",
    siteName: "TerraAuto",
    title: "TerraAuto — Автомобили из Китая, Кореи, США и Дубая",
    description:
      "Прямой импорт автомобилей в Узбекистан. Индивидуальная комплектация, расчёт стоимости до заказа.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TerraAuto — Автомобили из Китая, Кореи, США и Дубая",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TerraAuto — Автомобили из Китая, Кореи, США и Дубая",
    description:
      "Прямой импорт автомобилей в Узбекистан. Индивидуальная комплектация, расчёт стоимости до заказа.",
    images: ["/og-image.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userRole = (session?.user as any)?.role;

  return (
    <html lang="ru">
      <body className={inter.className}>
        <Analytics />
        <Providers userRole={userRole}>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
