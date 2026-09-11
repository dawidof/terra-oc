import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { createUserAccount, getTeamUsers } from "@/lib/users-admin";

type SessionUser = { id?: string; role?: string };

const createSchema = z.object({
  email: z.string().email("Некорректный email"),
  name: z.string().min(1, "Имя обязательно").max(255),
  password: z.string().min(8, "Пароль минимум 8 символов").max(128),
  role: z.enum(["admin", "manager"]),
});

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as SessionUser).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await getTeamUsers();
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as SessionUser).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || "Validation error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const user = await createUserAccount(
      parsed.data,
      (session.user as SessionUser).id!
    );
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
