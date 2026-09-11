import { redirect } from "next/navigation";

import { TasksBoard } from "@/components/crm/tasks-board";
import { auth } from "@/lib/auth";
import { getFollowUpTasks } from "@/lib/crm";

export const metadata = {
  title: "CRM — Задачи",
};

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tasks = await getFollowUpTasks(100);

  return <TasksBoard tasks={tasks} />;
}
