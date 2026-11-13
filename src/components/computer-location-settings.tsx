"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ComputerGroup, ComputerLocationRow } from "@/lib/computers";

export function ComputerLocationSettings({
  group,
  title,
  description,
  placeholder,
  locations: departments,
}: {
  group: ComputerGroup;
  title: string;
  description: string;
  placeholder: string;
  locations: ComputerLocationRow[];
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
      const response = await fetch("/api/inventory/computers/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, group }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to add location");
        return;
      }
      toast.success("Location added");
      setName("");
      router.refresh();
    } catch {
      toast.error("Failed to add location");
    } finally {
      setAdding(false);
    }
  }

  async function saveDepartment(id: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/inventory/computers/locations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: names[id] ?? "" }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to update location");
        return;
      }
      toast.success("Location updated");
      router.refresh();
    } catch {
      toast.error("Failed to update location");
    } finally {
      setPendingId(null);
    }
  }

  async function removeDepartment(department: ComputerLocationRow) {
    const message =
      department.computerCount > 0
        ? `${department.name} still has ${department.computerCount} computer(s). Hide it from the location list?`
        : `Remove ${department.name}?`;
    if (!window.confirm(message)) return;
    setPendingId(department.id);
    try {
      const response = await fetch(`/api/inventory/computers/locations/${department.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to remove location");
        return;
      }
      toast.success(data.deactivated ? "Location hidden" : "Location removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove location");
    } finally {
      setPendingId(null);
    }
  }

  async function restoreDepartment(id: string) {
    setPendingId(id);
    try {
      const response = await fetch(`/api/inventory/computers/locations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to restore location");
        return;
      }
      toast.success("Location restored");
      router.refresh();
    } catch {
      toast.error("Failed to restore location");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      <form onSubmit={addDepartment} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor={`new-${group}`}>Add to {title.toLowerCase()}</Label>
          <Input
            id={`new-${group}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={placeholder}
            required
          />
        </div>
        <Button type="submit" disabled={adding} className="bg-[#16324f] text-white hover:bg-[#1d4168]">
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      {departments.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">None yet.</p>
      ) : null}
      <ul className={departments.length === 0 ? "hidden" : "mt-4 divide-y rounded-lg border"}>
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
              {department.active ? (
                <p className="text-[11px] text-slate-500">{department.computerCount} computer(s)</p>
              ) : null}
              {!department.active ? (
                <p className="text-[11px] text-slate-500">Hidden from the location list.</p>
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
