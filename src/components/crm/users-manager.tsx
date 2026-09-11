"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { KeyRound, MoreHorizontal, ShieldCheck, UserCog, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/format";

interface TeamUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: Date | string;
  leadCount: number;
}

export function UsersManager({
  users,
  currentUserId,
}: {
  users: TeamUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<TeamUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "manager" });
  const [newPassword, setNewPassword] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось создать пользователя");
      toast.success("Сотрудник добавлен");
      setAddOpen(false);
      setForm({ name: "", email: "", password: "", role: "manager" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${resetTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось сбросить пароль");
      toast.success("Пароль обновлён");
      setResetTarget(null);
      setNewPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function patchUser(user: TeamUser, body: Record<string, unknown>, message: string) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      toast.success(message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Команда</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {users.length} сотрудников · роли и доступы
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus data-icon="inline-start" className="size-4" />
          Добавить сотрудника
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Сотрудник</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead className="text-right">Заявки</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Создан</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              return (
                <TableRow key={user.id} className={ !user.active ? "opacity-60" : undefined}>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge className="bg-brand-muted text-brand-muted-foreground">
                        <ShieldCheck data-icon="inline-start" className="size-3" />
                        Администратор
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Менеджер</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{user.leadCount}</TableCell>
                  <TableCell>
                    {user.active ? (
                      <Badge className="bg-emerald-50 text-emerald-700">Активен</Badge>
                    ) : (
                      <Badge variant="secondary">Отключён</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon-sm" />
                        }
                        aria-label={`Действия для ${user.name}`}
                        disabled={isSelf}
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            patchUser(
                              user,
                              { role: user.role === "admin" ? "manager" : "admin" },
                              user.role === "admin" ? "Роль изменена на менеджера" : "Роль изменена на администратора"
                            )
                          }
                        >
                          <UserCog className="size-4" />
                          {user.role === "admin" ? "Сделать менеджером" : "Сделать администратором"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            patchUser(
                              user,
                              { active: !user.active },
                              user.active ? "Сотрудник отключён" : "Сотрудник активирован"
                            )
                          }
                        >
                          {user.active ? "Деактивировать" : "Активировать"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setResetTarget(user);
                            setNewPassword("");
                          }}
                        >
                          <KeyRound className="size-4" />
                          Сбросить пароль
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Новый сотрудник</SheetTitle>
            <SheetDescription>
              Создайте аккаунт менеджера или администратора CRM
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleAdd} className="flex flex-1 flex-col gap-4 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-name">Имя</Label>
              <Input
                id="user-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Азиз Каримов"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="aziz@terraauto.uz"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-password">Пароль</Label>
              <Input
                id="user-password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Минимум 8 символов"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Роль</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v || "manager" })}
                items={[
                  { value: "manager", label: "Менеджер" },
                  { value: "admin", label: "Администратор" },
                ]}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager" label="Менеджер">
                    Менеджер
                  </SelectItem>
                  <SelectItem value="admin" label="Администратор">
                    Администратор
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SheetFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Создание…" : "Создать"}
              </Button>
              <SheetClose render={<Button variant="outline" type="button" />}>
                Отмена
              </SheetClose>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet
        open={resetTarget !== null}
        onOpenChange={(open) => !open && setResetTarget(null)}
      >
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Сброс пароля</SheetTitle>
            <SheetDescription>
              Новый пароль для {resetTarget?.name || "сотрудника"}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleReset} className="flex flex-1 flex-col gap-4 px-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">Новый пароль</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Минимум 8 символов"
              />
            </div>
            <SheetFooter>
              <Button type="submit" disabled={saving || !resetTarget}>
                {saving ? "Сохранение…" : "Сохранить"}
              </Button>
              <SheetClose render={<Button variant="outline" type="button" />}>
                Отмена
              </SheetClose>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
