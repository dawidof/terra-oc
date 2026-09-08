import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InventoryManager } from "@/components/crm/inventory-manager";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
  title: "Инвентарь — CRM — TerraAuto",
};

export default async function InventoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/crm">
              <Button variant="ghost" size="sm">
                CRM
              </Button>
            </Link>
            <Link href="/crm/inventory">
              <Button variant="outline" size="sm">
                Инвентарь
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <InventoryManager />
      </main>
    </div>
  );
}
