"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminToggle } from "@/components/admin/admin-toggle";
import { SettingsDrawer } from "@/components/admin/settings-drawer";
import { useAdmin } from "@/contexts/admin-context";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const { isAdmin } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/" className="text-2xl font-bold text-emerald-600">
          TerraAuto
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 md:flex">
          <Link href="/cars" className="text-sm text-muted-foreground hover:text-foreground">
            Автомобили
          </Link>
          <Link href="/choose" className="text-sm text-muted-foreground hover:text-foreground">
            Помочь выбрать
          </Link>
          <Link href="/calculator" className="text-sm text-muted-foreground hover:text-foreground">
            Калькулятор
          </Link>
          <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
            Как купить
          </Link>
          {isAdmin && (
            <>
              <AdminToggle />
              <SettingsDrawer />
            </>
          )}
          <Link href="/login">
            <Button variant="outline" size="sm">
              Вход в CRM
            </Button>
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Меню"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="container mx-auto flex flex-col gap-2 border-t px-4 py-4 md:hidden">
          <Link href="/cars" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>
            Автомобили
          </Link>
          <Link href="/choose" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>
            Помочь выбрать
          </Link>
          <Link href="/calculator" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>
            Калькулятор
          </Link>
          <Link href="/how-it-works" className="py-2 text-sm" onClick={() => setMobileOpen(false)}>
            Как купить
          </Link>
          {isAdmin && (
            <div className="flex items-center gap-2 py-2">
              <AdminToggle />
              <SettingsDrawer />
            </div>
          )}
          <Link href="/login" onClick={() => setMobileOpen(false)}>
            <Button variant="outline" size="sm" className="w-full">
              Вход в CRM
            </Button>
          </Link>
        </nav>
      )}

      {isAdmin && (
        <div className="bg-emerald-600 py-1 text-center text-xs text-white">
          Режим редактирования включён — нажмите на значения для редактирования
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 font-semibold">TerraAuto</h3>
            <p className="text-sm text-muted-foreground">
              Автомобили из Китая, Кореи, США и Дубая с доставкой в Узбекистан
            </p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Каталог</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/cars" className="hover:text-foreground">Автомобили</Link></li>
              <li><Link href="/choose" className="hover:text-foreground">Помочь выбрать</Link></li>
              <li><Link href="/calculator" className="hover:text-foreground">Калькулятор</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Информация</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/how-it-works" className="hover:text-foreground">Как купить</Link></li>
              <li><Link href="/about" className="hover:text-foreground">О компании</Link></li>
              <li><Link href="/reviews" className="hover:text-foreground">Отзывы</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold">Контакты</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/contacts" className="hover:text-foreground">Связаться с нами</Link></li>
              <li><a href="tel:+998901234567" className="hover:text-foreground">+998 90 123 45 67</a></li>
              <li><a href="https://t.me/terraauto" className="hover:text-foreground" target="_blank" rel="noopener noreferrer">Telegram</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} TerraAuto. Все права защищены.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">Политика конфиденциальности</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
