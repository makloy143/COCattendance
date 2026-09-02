"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { MaintenanceForm } from "@/components/maintenance-form";
import { ButtonLink } from "@/components/button-link";
import type { MaintenanceRecordDto } from "@/lib/maintenance-shared";

export default function EditMaintenancePage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<MaintenanceRecordDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/inventory/maintenance/${params.id}`);
        const data = await response.json();
        if (!response.ok) {
          toast.error(data.error ?? "Failed to load maintenance record");
          setRecord(null);
          return;
        }
        setRecord(data);
      } catch {
        toast.error("Failed to load maintenance record");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [params.id]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading maintenance record...</p>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Maintenance record not found.
        </p>
        <ButtonLink href="/inventory/maintenance" variant="outline">
          Back to Maintenance
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Edit {record.maintenanceNumber}
        </h1>
        <p className="text-sm text-muted-foreground">
          Update diagnostic findings, repair progress, and asset details
        </p>
      </div>
      <MaintenanceForm mode="edit" record={record} />
    </div>
  );
}
