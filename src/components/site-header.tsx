"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, Phone, X } from "lucide-react";

import { AdminToggle } from "@/components/admin/admin-toggle";
import { AutocompleteSearch } from "@/components/autocomplete-search";
import { BrandMark } from "@/components/brand-mark";
import { useAdmin } from "@/contexts/admin-context";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/choose", label: "Подбор" },
  { href: "/calculator", label: "Калькулятор" },
  { href: "/how-it-works", label: "Как купить" },
  { href: "/portal", label: "Отследить заказ" },
];

export function SiteHeader() {
  const { isAdmin, is_admin_user } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl transition-shadow duration-200",
          scrolled && "shadow-sm"
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" aria-label="TerraAuto — на главную">
            <BrandMark />
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-foreground/60 hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/cars"
              className="hidden rounded-lg bg-surface-dark px-4 py-2 text-xs font-semibold text-surface-dark-foreground transition-opacity hover:opacity-90 md:inline-flex"
            >
              Каталог авто
            </Link>
            <AutocompleteSearch className="hidden w-52 xl:block" />
            <a
              href="tel:+998901234567"
              className="hidden items-center gap-1.5 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground lg:inline-flex"
            >
              <Phone className="size-3.5" aria-hidden />
              +998 90 123 45 67
            </a>
            {is_admin_user && <AdminToggle />}
            <Link
              href="/login"
              className="hidden items-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex"
              title="Вход в CRM"
            >
              <LogIn className="size-4" />
            </Link>
            <button
              type="button"
              className="-mr-1 rounded-lg p-2 text-foreground transition-colors hover:bg-muted md:hidden"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label="Меню"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-border bg-background px-4 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              <Link
                href="/cars"
                className="rounded-lg bg-surface-dark px-3 py-2.5 text-sm font-semibold text-surface-dark-foreground"
              >
                Каталог авто
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-4">
              <div className="min-w-0 flex-1">
                <AutocompleteSearch className="w-full" />
              </div>
            </div>
            {is_admin_user && (
              <div className="mt-3 flex items-center gap-2">
                <AdminToggle />
              </div>
            )}
            <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
              <a
                href="tel:+998901234567"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <Phone className="size-3.5" aria-hidden />
                +998 90 123 45 67
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <LogIn className="size-3.5" />
                Вход в CRM
              </Link>
            </div>
          </nav>
        )}
      </header>

      {isAdmin && (
        <div className="fixed bottom-4 left-4 z-50 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          Режим редактирования
        </div>
      )}
    </>
  );
}

const footerColumns = [
  {
    title: "Каталог",
    links: [
      { href: "/cars", label: "Автомобили" },
      { href: "/choose", label: "Подбор" },
      { href: "/compare", label: "Сравнение" },
      { href: "/calculator", label: "Калькулятор" },
    ],
  },
  {
    title: "Информация",
    links: [
      { href: "/how-it-works", label: "Как купить" },
      { href: "/portal", label: "Отследить заказ" },
      { href: "/about", label: "О компании" },
      { href: "/reviews", label: "Отзывы" },
      { href: "/contacts", label: "Контакты" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted">
      <div className="container mx-auto px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <BrandMark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Автомобили из Китая, Кореи, США и Дубая с доставкой и оформлением
              в Узбекистане. Работаем по договору.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <a
                href="tel:+998901234567"
                className="inline-flex items-center gap-1.5 text-foreground transition-colors hover:text-brand"
              >
                <Phone className="size-3.5" aria-hidden />
                +998 90 123 45 67
              </a>
              <a
                href="https://instagram.com/terraauto_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Instagram
              </a>
              <a
                href="https://youtube.com/@TerraAutoUz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                YouTube
              </a>
            </div>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className="md:col-span-2">
              <h3 className="text-xs font-medium tracking-wide text-foreground uppercase">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="md:col-span-3">
            <h3 className="text-xs font-medium tracking-wide text-foreground uppercase">
              Мессенджеры
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href="https://wa.me/998901234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/terraauto_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Telegram
                </a>
              </li>
              <li>
                <Link
                  href="/contacts"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Все контакты
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} TerraAuto. Все права защищены.</p>
          <Link
            href="/privacy"
            className="transition-colors hover:text-foreground"
          >
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </footer>
  );
}
