import { MaintenanceForm } from "@/components/maintenance-form";

export default function NewMaintenancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Report Issue
        </h1>
        <p className="text-sm text-muted-foreground">
          Log a broken, damaged, or malfunctioning device for IT follow-up
        </p>
      </div>
      <MaintenanceForm />
    </div>
  );
}
