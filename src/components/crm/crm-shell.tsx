"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  Car,
  ExternalLink,
  Home,
  LayoutDashboard,
  ListTodo,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  Settings,
  Star,
  User,
  Users,
  UsersRound,
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/lib/actions";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  adminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Основное",
    items: [
      { href: "/crm", label: "Дашборд", icon: LayoutDashboard, exact: true },
      { href: "/crm/leads", label: "Заявки", icon: Users },
      { href: "/crm/tasks", label: "Задачи", icon: ListTodo },
      { href: "/crm/deliveries", label: "Поставки", icon: Car },
      { href: "/portal", label: "Портал клиента", icon: User },
    ],
  },
  {
    label: "Администрирование",
    items: [
      { href: "/crm/users", label: "Команда", icon: UsersRound, adminOnly: true },
      { href: "/crm/reviews", label: "Отзывы", icon: Star, adminOnly: true },
      { href: "/crm/audit", label: "Аудит", icon: ScrollText, adminOnly: true },
      { href: "/crm/settings", label: "Настройки", icon: Settings, adminOnly: true },
    ],
  },
];

const allNavItems = navGroups.flatMap((group) => group.items);

const roleLabels: Record<string, string> = {
  admin: "Администратор",
  manager: "Менеджер",
};

const STORAGE_KEY = "crm-sidebar-collapsed";
const STORAGE_EVENT = "crm-sidebar-collapsed-change";

function subscribeToSidebar(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function useSidebarCollapsed(): [boolean, () => void] {
  const collapsed = useSyncExternalStore(
    subscribeToSidebar,
    () => window.localStorage.getItem(STORAGE_KEY) === "1",
    () => false
  );

  function toggle() {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "0" : "1");
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }

  return [collapsed, toggle];
}

interface CrmShellProps {
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  children: React.ReactNode;
}

export function CrmShell({
  userName,
  userEmail,
  userRole,
  children,
}: CrmShellProps) {
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const pathname = usePathname();
  const isAdmin = userRole === "admin";

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const currentLabel =
    allNavItems.find(isActive)?.label ??
    (pathname.startsWith("/crm") ? "CRM" : "");

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: isAdmin ? group.items : group.items.filter((item) => !item.adminOnly),
    }))
    .filter((group) => group.items.length > 0);

  const mobileItems = allNavItems.filter((item) => isAdmin || !item.adminOnly);

  return (
    <div className="min-h-screen bg-muted/40">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex lg:flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-sidebar-border",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {!collapsed && (
            <Link href="/crm" aria-label="CRM — Дашборд">
              <BrandMark size="sm" />
            </Link>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-2">
          {visibleGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              {!collapsed && (
                <p className="px-3 pt-1 pb-0.5 text-[11px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="mx-3 border-t border-sidebar-border" />}
              {group.items.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      collapsed && "justify-center px-2",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {active && (
                      <span
                        className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand"
                        aria-hidden
                      />
                    )}
                    <item.icon className="size-4 shrink-0" aria-hidden />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border p-2">
          <Link
            href="/"
            title="На сайт"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span>На сайт</span>}
          </Link>
        </div>
      </aside>

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-64"
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/crm" className="lg:hidden" aria-label="CRM — Дашборд">
              <BrandMark size="sm" />
            </Link>
            <span className="hidden truncate text-sm font-medium lg:block">
              {currentLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link href="/" />}
              nativeButton={false}
              aria-label="На главную"
              title="На главную"
            >
              <Home className="size-4" />
            </Button>
            <ThemeToggle />
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-medium">
                {userName || userEmail || "Пользователь"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {roleLabels[userRole ?? ""] ?? "Сотрудник"}
              </p>
            </div>
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut data-icon="inline-start" className="size-3.5" />
                Выйти
              </Button>
            </form>
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-background px-3 py-2 lg:hidden">
          {mobileItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
