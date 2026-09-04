"use client";

import { AdminProvider } from "@/contexts/admin-context";

export function Providers({ children, userRole }: { children: React.ReactNode; userRole?: string }) {
  return <AdminProvider userRole={userRole}>{children}</AdminProvider>;
}
