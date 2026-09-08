import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leads, leadConfigurations, users } from "@/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "30d";

  const now = new Date();
  let dateFrom: Date;

  switch (range) {
    case "7d":
      dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  try {
    // Leads trend (daily)
    const leadsTrend = await db
      .select({
        date: sql<string>`DATE(${leads.createdAt})`.as("date"),
        count: sql<number>`COUNT(*)::int`.as("count"),
      })
      .from(leads)
      .where(gte(leads.createdAt, dateFrom))
      .groupBy(sql`DATE(${leads.createdAt})`)
      .orderBy(sql`DATE(${leads.createdAt})`);

    // Conversion funnel (by status)
    const conversionFunnel = await db
      .select({
        status: leads.status,
        count: sql<number>`COUNT(*)::int`.as("count"),
      })
      .from(leads)
      .where(gte(leads.createdAt, dateFrom))
      .groupBy(leads.status);

    // Top models
    const topModels = await db
      .select({
        brandName: leadConfigurations.brandName,
        modelName: leadConfigurations.modelName,
        total: sql<number>`COUNT(*)::int`.as("total"),
      })
      .from(leads)
      .innerJoin(leadConfigurations, eq(leads.id, leadConfigurations.leadId))
      .where(gte(leads.createdAt, dateFrom))
      .groupBy(leadConfigurations.brandName, leadConfigurations.modelName)
      .orderBy(desc(sql`COUNT(*)::int`))
      .limit(10);

    // Source breakdown
    const sourceBreakdown = await db
      .select({
        source: leads.source,
        total: sql<number>`COUNT(*)::int`.as("total"),
      })
      .from(leads)
      .where(gte(leads.createdAt, dateFrom))
      .groupBy(leads.source);

    // Manager performance
    const managerPerformance = await db
      .select({
        managerId: leads.assignedManagerId,
        managerName: users.name,
        total: sql<number>`COUNT(*)::int`.as("total"),
      })
      .from(leads)
      .leftJoin(users, eq(leads.assignedManagerId, users.id))
      .where(gte(leads.createdAt, dateFrom))
      .groupBy(leads.assignedManagerId, users.name)
      .orderBy(desc(sql`COUNT(*)::int`));

    // Revenue estimate (monthly)
    const revenueEstimate = await db
      .select({
        month: sql<string>`DATE_TRUNC('month', ${leads.createdAt})::text`.as("month"),
        total: sql<number>`COALESCE(SUM(${leads.estimatedTotalUsd})::numeric, 0)`.as("total"),
      })
      .from(leads)
      .where(
        and(
          gte(leads.createdAt, dateFrom),
          eq(leads.status, "won")
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${leads.createdAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${leads.createdAt})`);

    // Summary stats
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(leads)
      .where(gte(leads.createdAt, dateFrom));

    const [wonResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(leads)
      .where(
        and(
          gte(leads.createdAt, dateFrom),
          eq(leads.status, "won")
        )
      );

    const [avgDealResult] = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${leads.estimatedTotalUsd})::numeric, 0)`,
      })
      .from(leads)
      .where(
        and(
          gte(leads.createdAt, dateFrom),
          eq(leads.status, "won")
        )
      );

    const totalLeads = totalResult?.count || 0;
    const wonLeads = wonResult?.count || 0;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
    const avgDealSize = avgDealResult?.avg || 0;

    return NextResponse.json({
      leadsTrend,
      conversionFunnel,
      topModels,
      sourceBreakdown,
      managerPerformance,
      revenueEstimate,
      summary: {
        totalLeads,
        conversionRate,
        avgDealSize: Math.round(avgDealSize),
        avgResponseTime: 24, // Placeholder - would need lastContactAt analysis
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
