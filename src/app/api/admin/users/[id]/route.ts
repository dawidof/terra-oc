import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { resetUserPassword, updateUserAccount } from "@/lib/users-admin";

const updateSchema = z.object({
  name: z.string().min(1, "Имя обязательно").max(255).optional(),
  role: z.enum(["admin", "manager"]).optional(),
  active: z.boolean().optional(),
  password: z.string().min(8, "Пароль минимум 8 символов").max(128).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user as { role?: string }).role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const actorId = (session.user as { id: string }).id;

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Validation error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (
    id === actorId &&
    (parsed.data.role !== undefined || parsed.data.active !== undefined)
  ) {
    return NextResponse.json(
      { error: "Нельзя менять собственную роль или статус" },
      { status: 400 }
    );
  }

  try {
    const { password, ...account } = parsed.data;

    if (Object.keys(account).length > 0) {
      await updateUserAccount(id, account, actorId);
    }
    if (password) {
      await resetUserPassword(id, password, actorId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
