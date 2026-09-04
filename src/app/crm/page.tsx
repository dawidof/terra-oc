import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CrmPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as any;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-emerald-600">
            TerraAuto
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.name} ({user.role})
            </span>
            <form
              action={async () => {
                "use server";
                const { signOut } = await import("@/lib/auth");
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                Выйти
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">CRM Панель управления</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-2 text-lg font-semibold">Заявки</h2>
            <p className="text-3xl font-bold text-emerald-600">0</p>
            <p className="text-sm text-muted-foreground">новых заявок</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-2 text-lg font-semibold">В работе</h2>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-muted-foreground">активных заявок</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-2 text-lg font-semibold">Продажи</h2>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-muted-foreground">за текущий месяц</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Последние заявки</h2>
          <p className="text-sm text-muted-foreground">
            Заявки пока отсутствуют. Начните с добавления автомобилей в каталог.
          </p>
        </div>
      </main>
    </div>
  );
}
