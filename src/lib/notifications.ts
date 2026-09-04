import { db } from "@/db";
import { leadActivities, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

export interface LeadNotification {
  leadId: string;
  customerName: string;
  customerPhone: string;
  vehicle?: string;
  source: string;
  estimatedTotal?: string;
}

function getAdminEmails(): Promise<string[]> {
  return db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.role, "admin"))
    .then((rows) => rows.map((r) => r.email));
}

function formatLeadMessage(lead: LeadNotification): string {
  const lines = [
    `Новая заявка на сайте TerraAuto`,
    ``,
    `Клиент: ${lead.customerName}`,
    `Телефон: ${lead.customerPhone}`,
    `Источник: ${lead.source}`,
  ];

  if (lead.vehicle) {
    lines.push(`Авто: ${lead.vehicle}`);
  }
  if (lead.estimatedTotal) {
    lines.push(`Сумма: $${Number(lead.estimatedTotal).toLocaleString("en-US")}`);
  }

  lines.push(
    ``,
    `Откройте CRM для обработки: ${process.env.NEXT_PUBLIC_SITE_URL || "https://terraauto.uz"}/crm/leads/${lead.leadId}`
  );

  return lines.join("\n");
}

export async function notifyNewLead(lead: LeadNotification): Promise<void> {
  // Log notification to database
  await db.insert(leadActivities).values({
    leadId: lead.leadId,
    type: "notification_sent",
    metadataJson: {
      channel: "system",
      message: `Новая заявка от ${lead.customerName}`,
    },
  });

  // Send email if SMTP is configured
  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    try {
      const adminEmails = await getAdminEmails();
      if (adminEmails.length === 0) return;

      const message = formatLeadMessage(lead);

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || "TerraAuto <noreply@terraauto.uz>",
        to: adminEmails.join(", "),
        subject: `Новая заявка: ${lead.customerName} — ${lead.vehicle || "TerraAuto"}`,
        text: message,
      });
    } catch (error) {
      console.error("Email notification failed:", error);
      // Don't throw - notification failure shouldn't block lead creation
    }
  }
}
