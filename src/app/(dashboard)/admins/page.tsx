import { redirect } from "next/navigation";
import { AdminAccountsManager } from "@/components/admin-accounts-manager";
import { CatalogOptionsManager } from "@/components/catalog-options-manager";
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
          Manage department admins, and add Departments or Assign to options used
          across the attendance portal.
        </p>
      </div>
      <CatalogOptionsManager />
      <AdminAccountsManager />
    </div>
  );
}
