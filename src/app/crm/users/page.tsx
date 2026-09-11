import { redirect } from "next/navigation";

import { UsersManager } from "@/components/crm/users-manager";
import { auth } from "@/lib/auth";
import { getTeamUsers } from "@/lib/users-admin";

export const metadata = {
  title: "CRM — Команда",
};

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") redirect("/crm");

  const users = await getTeamUsers();

  return (
    <UsersManager
      users={users}
      currentUserId={(session.user as { id?: string }).id ?? ""}
    />
  );
}
