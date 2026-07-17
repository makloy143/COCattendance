import { redirect } from "next/navigation";
import { AdminAccountsManager } from "@/components/admin-accounts-manager";
import { requireSuperAdmin } from "@/lib/auth";

export default async function AdminAccountsPage() {
  try {
    await requireSuperAdmin();
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Admin Accounts
        </h1>
        <p className="text-sm text-muted-foreground">
          Create department-scoped admin accounts for REGISTRAR, FINANCE, CSDL,
          LIBRARY, MARKETING, GSD, GUIDANCE, and ITSD
        </p>
      </div>
      <AdminAccountsManager />
    </div>
  );
}
