import { TodoShell } from "@/components/todo-sidebar";
import { getTodoSession } from "@/lib/todo-auth";

export default async function TodoPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getTodoSession();

  return <TodoShell username={session?.username}>{children}</TodoShell>;
}
