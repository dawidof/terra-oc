import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { CrmShell } from "@/components/crm/crm-shell";
import { auth } from "@/lib/auth";

export default async function CrmLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };

  return (
    <CrmShell
      userName={user.name}
      userEmail={user.email}
      userRole={user.role}
    >
      {children}
    </CrmShell>
  );
}
