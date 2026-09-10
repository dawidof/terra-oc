"use client";

import { usePathname } from "next/navigation";

import { ContactButtons } from "@/components/contact-buttons";
import { SiteFooter, SiteHeader } from "@/components/site-header";

/**
 * Routes that render their own application shell (sidebar + topbar) and must
 * not inherit the public marketing header, footer or floating contact buttons.
 */
const APP_SHELL_PREFIXES = ["/crm", "/dashboard"];

function isAppShellRoute(pathname: string): boolean {
  return APP_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isAppShellRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <ContactButtons variant="floating" />
    </>
  );
}
