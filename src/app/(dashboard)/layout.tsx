import { DashboardShell } from "@/components/app-sidebar";
import { getSession, isSuperAdmin } from "@/lib/auth";
import { resolveDepartmentScope } from "@/lib/department-scope";
import { listDepartmentOptions } from "@/lib/departments-server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const superAdmin = isSuperAdmin(session);

  const [departments, departmentScope] = await Promise.all([
    superAdmin ? listDepartmentOptions() : Promise.resolve([]),
    session && superAdmin
      ? resolveDepartmentScope(session)
      : Promise.resolve(null),
  ]);

  return (
    <DashboardShell
      username={session?.username}
      role={session?.role}
      department={session?.department}
      departmentScope={departmentScope}
      departments={departments.map((item) => ({
        code: item.code,
        label: item.label,
      }))}
    >
      {children}
    </DashboardShell>
  );
}
