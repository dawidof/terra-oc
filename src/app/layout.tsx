import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TerraAuto — Автомобили из Китая, Кореи, США и Дубая",
  description:
    "Прямой импорт автомобилей в Узбекистан. Индивидуальная комплектация, расчёт стоимости до заказа.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
