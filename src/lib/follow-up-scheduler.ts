import { db } from "@/db";
import { leads, customers, users, siteSettings, leadStatusEnum } from "@/db/schema";
import { eq, and, lte, isNull } from "drizzle-orm";
import nodemailer from "nodemailer";

export interface FollowUpRule {
  status: string;
  delayHours: number;
  enabled: boolean;
}

export const FOLLOW_UP_RULES_KEY = "follow_up_rules";

export const FOLLOW_UP_RULE_STATUSES = [
  "new",
  "contacted",
  "quote_sent",
  "needs_follow_up",
] as const;

export const DEFAULT_RULES: FollowUpRule[] = [
  { status: "new", delayHours: 24, enabled: true },
  { status: "contacted", delayHours: 72, enabled: true },
  { status: "quote_sent", delayHours: 72, enabled: true },
  { status: "needs_follow_up", delayHours: 48, enabled: true },
];

function normalizeRules(raw: unknown): FollowUpRule[] | null {
  if (!Array.isArray(raw)) return null;

  const rules: FollowUpRule[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const { status, delayHours, enabled } = item as Record<string, unknown>;
    if (
      typeof status !== "string" ||
      !FOLLOW_UP_RULE_STATUSES.includes(status as (typeof FOLLOW_UP_RULE_STATUSES)[number])
    ) {
      return null;
    }
    if (typeof delayHours !== "number" || !Number.isFinite(delayHours) || delayHours < 1 || delayHours > 720) {
      return null;
    }
    rules.push({ status, delayHours, enabled: Boolean(enabled) });
  }

  const statuses = new Set(rules.map((r) => r.status));
  if (rules.length !== FOLLOW_UP_RULE_STATUSES.length || statuses.size !== rules.length) {
    return null;
  }

  return rules;
}

export async function getFollowUpRules(): Promise<FollowUpRule[]> {
  try {
    const [row] = await db
      .select({ valueJson: siteSettings.valueJson })
      .from(siteSettings)
      .where(eq(siteSettings.key, FOLLOW_UP_RULES_KEY))
      .limit(1);

    const normalized = normalizeRules(row?.valueJson);
    if (normalized) return normalized;
  } catch (error) {
    console.error("Failed to load follow-up rules from site_settings:", error);
  }
  return DEFAULT_RULES;
}

export async function saveFollowUpRules(rules: unknown): Promise<FollowUpRule[]> {
  const normalized = normalizeRules(rules);
  if (!normalized) {
    throw new Error("Invalid follow-up rules");
  }

  await db
    .insert(siteSettings)
    .values({ key: FOLLOW_UP_RULES_KEY, valueJson: normalized })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { valueJson: normalized },
    });

  return normalized;
}

export async function checkFollowUps(): Promise<{
  overdue: number;
  notified: number;
}> {
  const rules = await getFollowUpRules();
  let overdue = 0;
  let notified = 0;

  for (const rule of rules.filter((r) => r.enabled)) {
    // Find leads that match the status and are overdue
    const cutoffTime = new Date(Date.now() - rule.delayHours * 60 * 60 * 1000);

    const overdueLeads = await db
      .select({
        id: leads.id,
        customerName: customers.name,
        customerEmail: customers.email,
        nextFollowUpAt: leads.nextFollowUpAt,
        lastContactAt: leads.lastContactAt,
      })
      .from(leads)
      .innerJoin(customers, eq(leads.customerId, customers.id))
      .where(
        and(
          eq(leads.status, rule.status as (typeof leadStatusEnum.enumValues)[number]),
          lte(leads.createdAt, cutoffTime),
          // Either no follow-up set or follow-up is past due
          isNull(leads.nextFollowUpAt)
        )
      )
      .limit(50);

    overdue += overdueLeads.length;

    // Send notifications for overdue leads
    for (const lead of overdueLeads) {
      try {
        const sent = await sendFollowUpNotification(lead);
        if (sent) notified++;
      } catch (error) {
        console.error(`Failed to send follow-up for lead ${lead.id}:`, error);
      }
    }
  }

  return { overdue, notified };
}

async function sendFollowUpNotification(lead: {
  id: string;
  customerName: string;
  customerEmail: string | null;
}): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return false;

  // Get admin emails
  const admins = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.role, "admin"));

  if (admins.length === 0) return false;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://terraauto.uz";

  for (const admin of admins) {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "TerraAuto <noreply@terraauto.uz>",
      to: admin.email,
      subject: `⏰ Нужен follow-up: ${lead.customerName}`,
      text: `
Требуется внимание к заявке:

Клиент: ${lead.customerName}
Email клиента: ${lead.customerEmail || "не указан"}

Заявка требует follow-up. Пожалуйста, свяжитесь с клиентом или обновите статус заявки.

Перейти к заявке: ${siteUrl}/crm/leads/${lead.id}
      `.trim(),
    });
  }

  return true;
}

export async function getOverdueFollowUps(): Promise<
  {
    leadId: string;
    customerName: string;
    status: string;
    createdAt: Date;
    nextFollowUpAt: Date | null;
  }[]
> {
  const overdueLeads = await db
    .select({
      leadId: leads.id,
      customerName: customers.name,
      status: leads.status,
      createdAt: leads.createdAt,
      nextFollowUpAt: leads.nextFollowUpAt,
    })
    .from(leads)
    .innerJoin(customers, eq(leads.customerId, customers.id))
    .where(
      and(
        // Leads that have been around for more than 24 hours
        lte(leads.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
        // And either have no follow-up set or it's past due
        isNull(leads.nextFollowUpAt)
      )
    )
    .limit(100);

  return overdueLeads;
}
