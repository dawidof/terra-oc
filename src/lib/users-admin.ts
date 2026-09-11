import { asc, count, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { db } from "@/db";
import { leads, users } from "@/db/schema";
import { logAudit } from "@/lib/admin";

export async function getTeamUsers() {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
      leadCount: count(leads.id),
    })
    .from(users)
    .leftJoin(leads, eq(leads.assignedManagerId, users.id))
    .groupBy(users.id)
    .orderBy(asc(users.name));
}

export async function createUserAccount(
  data: { email: string; name: string; password: string; role: "admin" | "manager" },
  actorId: string
) {
  const email = data.email.trim().toLowerCase();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) throw new Error("Пользователь с таким email уже существует");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const [user] = await db
    .insert(users)
    .values({ email, name: data.name.trim(), passwordHash, role: data.role })
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

  await logAudit(actorId, "user", user.id, "create", null, {
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return user;
}

export async function updateUserAccount(
  userId: string,
  data: { name?: string; role?: "admin" | "manager"; active?: boolean },
  actorId: string
) {
  const [before] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!before) throw new Error("Пользователь не найден");

  const changes: { name?: string; role?: "admin" | "manager"; active?: boolean } = {};
  if (data.name !== undefined && data.name !== before.name) changes.name = data.name.trim();
  if (data.role !== undefined && data.role !== before.role) changes.role = data.role;
  if (data.active !== undefined && data.active !== before.active) changes.active = data.active;

  if (Object.keys(changes).length === 0) return { success: true, noChanges: true };

  await db.update(users).set(changes).where(eq(users.id, userId));

  await logAudit(
    actorId,
    "user",
    userId,
    "update",
    Object.fromEntries(
      Object.keys(changes).map((k) => [k, before[k as keyof typeof before]])
    ),
    changes
  );

  return { success: true };
}

export async function resetUserPassword(userId: string, newPassword: string, actorId: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw new Error("Пользователь не найден");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

  await logAudit(actorId, "user", userId, "reset_password", null, null);

  return { success: true };
}
