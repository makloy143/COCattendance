"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type InventoryDepartmentRow = {
  id: string;
  name: string;
  active: boolean;
  usageCount: number;
};

export function InventoryDepartmentSettings({
  departments,
}: {
  departments: InventoryDepartmentRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(departments.map((department) => [department.id, department.name]))
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function addDepartment(event: React.FormEvent) {
    event.preventDefault();
    setAdding(true);
    try {
      const response = await fetch("/api/inventory/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to add department");
        return;
      }
      toast.success("Department added");
      setName("");
      router.refresh();
    } catch {
      toast.error("Failed to add department");
    } finally {
      setAdding(false);
    }
  }

  async function saveDepartment(id: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/inventory/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: names[id] ?? "" }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to update department");
        return;
      }
      toast.success("Department updated");
      router.refresh();
    } catch {
      toast.error("Failed to update department");
    } finally {
      setPendingId(null);
    }
  }

  async function removeDepartment(department: InventoryDepartmentRow) {
    const message =
      department.usageCount > 0
        ? `Hide ${department.name} from the department list? Past records keep this name.`
        : `Remove ${department.name}?`;
    if (!window.confirm(message)) return;
    setPendingId(department.id);
    try {
      const response = await fetch(`/api/inventory/departments/${department.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to remove department");
        return;
      }
      toast.success(data.deactivated ? "Department hidden" : "Department removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove department");
    } finally {
      setPendingId(null);
    }
  }

  async function restoreDepartment(id: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/inventory/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to restore department");
        return;
      }
      toast.success("Department restored");
      router.refresh();
    } catch {
      toast.error("Failed to restore department");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-base font-semibold">Departments</h2>
        <p className="mt-1 text-sm text-slate-600">
          These names appear when ink is received or released. Renaming a department updates the records that already use it.
        </p>
      </div>

      <form onSubmit={addDepartment} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="newDepartment">New department</Label>
          <Input
            id="newDepartment"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="CLINIC"
            required
          />
        </div>
        <Button type="submit" disabled={adding} className="bg-[#0e6b43] text-white hover:bg-[#0c5b39]">
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      <ul className="mt-4 divide-y rounded-lg border">
        {departments.map((department) => (
          <li key={department.id} className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor={`department-${department.id}`}>Name</Label>
              <Input
                id={`department-${department.id}`}
                value={names[department.id] ?? department.name}
                onChange={(event) =>
                  setNames((current) => ({ ...current, [department.id]: event.target.value }))
                }
                disabled={!department.active}
                required
              />
              {!department.active ? (
                <p className="text-[11px] text-slate-500">Hidden from the department list.</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              {department.active ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pendingId === department.id}
                    onClick={() => void saveDepartment(department.id)}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pendingId === department.id}
                    onClick={() => void removeDepartment(department)}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pendingId === department.id}
                  onClick={() => void restoreDepartment(department.id)}
                >
                  Restore
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
