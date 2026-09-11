import { redirect } from "next/navigation";
import { asc, desc } from "drizzle-orm";

import { SettingsManager } from "@/components/crm/settings-manager";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { exchangeRates, siteSettings } from "@/db/schema";

export const metadata = {
  title: "CRM — Настройки",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") redirect("/crm");

  const [settings, rates] = await Promise.all([
    db.select().from(siteSettings).orderBy(asc(siteSettings.key)),
    db
      .select()
      .from(exchangeRates)
      .orderBy(desc(exchangeRates.recordedAt))
      .limit(20),
  ]);

  return <SettingsManager settings={settings} rates={rates} />;
}
