"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function InkClearStockButton({
  modelName,
  label,
  confirmMessage,
  endpoint,
  variant = "outline",
}: {
  modelName?: string;
  label: string;
  confirmMessage: string;
  endpoint?: string;
  variant?: "outline" | "ghost";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const response = await fetch(endpoint ?? "/api/inventory/inks/stock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: endpoint ? undefined : JSON.stringify(modelName ? { modelName } : {}),
      });
      const data = (await response.json().catch(() => ({}))) as {
        cleared?: number;
        removed?: boolean;
        error?: string;
      };
      if (!response.ok) {
        toast.error(data.error ?? "Could not clear available ink");
        return;
      }
      if (data.removed) {
        toast.success("Release removed");
      } else {
        const count = data.cleared ?? 0;
        toast.success(count === 1 ? "Cleared 1 available bottle" : `Cleared ${count} available bottles`);
      }
      router.refresh();
    } catch {
      toast.error("Could not clear available ink");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant={variant} size="sm" onClick={handleClick} disabled={loading}>
      {loading ? "Clearing..." : label}
    </Button>
  );
}

export function InkReleaseDepartmentEditor({
  id,
  department,
}: {
  id: string;
  department: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(department);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    void fetch("/api/inventory/departments")
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as unknown;
        if (!cancelled && Array.isArray(data) && data.every((item) => typeof item === "string")) {
          setDepartments(data);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [editing]);

  const choices = departments.includes(value) || !value ? departments : [value, ...departments];

  async function handleSave() {
    const next = value.trim();
    if (!next) {
      toast.error("Department is required");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/inks/releases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        toast.error(data.error ?? "Could not update the department");
        return;
      }
      toast.success("Department updated");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Could not update the department");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span>{department}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => {
          setValue(department);
          setEditing(true);
        }}>
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-w-56 items-center gap-2">
      <Label className="sr-only" htmlFor={`release-department-${id}`}>Department</Label>
      <select
        id={`release-department-${id}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-8 w-full rounded-md border bg-white px-2 text-sm"
      >
        {choices.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <Button type="button" size="sm" onClick={() => void handleSave()} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setValue(department);
          setEditing(false);
        }}
        disabled={loading}
      >
        Cancel
      </Button>
    </div>
  );
}
