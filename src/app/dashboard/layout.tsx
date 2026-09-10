import { Sidebar } from "@/components/admin/sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userRole = (session?.user as { role?: string })?.role;

  if (!session || (userRole !== "admin" && userRole !== "manager")) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-muted-section">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
