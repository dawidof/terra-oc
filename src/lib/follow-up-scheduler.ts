import { db } from "@/db";
import { leads, customers, leadConfigurations, users } from "@/db/schema";
import { eq, and, lte, isNull, sql } from "drizzle-orm";
import nodemailer from "nodemailer";

interface FollowUpRule {
  status: string;
  delayHours: number;
  enabled: boolean;
}

const DEFAULT_RULES: FollowUpRule[] = [
  { status: "new", delayHours: 24, enabled: true },
  { status: "contacted", delayHours: 72, enabled: true },
  { status: "quote_sent", delayHours: 72, enabled: true },
  { status: "needs_follow_up", delayHours: 48, enabled: true },
];

export async function getFollowUpRules(): Promise<FollowUpRule[]> {
  // In production, these would be stored in site_settings
  return DEFAULT_RULES;
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
          eq(leads.status, rule.status as any),
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
        await sendFollowUpNotification(lead);
        notified++;
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
}) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) return;

  // Get admin emails
  const admins = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.role, "admin"));

  if (admins.length === 0) return;

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
