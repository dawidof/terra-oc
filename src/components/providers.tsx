"use client";

import { ThemeProvider } from "next-themes";

import { AdminProvider } from "@/contexts/admin-context";

export function Providers({ children, userRole }: { children: React.ReactNode; userRole?: string }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <AdminProvider userRole={userRole}>{children}</AdminProvider>
    </ThemeProvider>
  );
}
