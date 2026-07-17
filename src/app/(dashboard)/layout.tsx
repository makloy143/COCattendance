import { DashboardShell } from "@/components/app-sidebar";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <DashboardShell
      username={session?.username}
      role={session?.role}
      department={session?.department}
    >
      {children}
    </DashboardShell>
  );
}
