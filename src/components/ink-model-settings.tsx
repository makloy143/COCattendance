"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INK_COLORS, INK_COLOR_LABELS, type InkColor } from "@/lib/inventory";

export type InkModelSettingsRow = {
  id: string;
  name: string;
  inkColor: InkColor;
  active: boolean;
  receiptCount: number;
};

function isInkColor(value: string): value is InkColor {
  return (INK_COLORS as readonly string[]).includes(value);
}

export function InkModelSettings({ options }: { options: InkModelSettingsRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [inkColor, setInkColor] = useState<InkColor>("BLACK");
  const [adding, setAdding] = useState(false);
  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(options.map((option) => [option.id, option.name]))
  );
  const [colors, setColors] = useState<Record<string, InkColor>>(() =>
    Object.fromEntries(options.map((option) => [option.id, option.inkColor]))
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function addModel(event: React.FormEvent) {
    event.preventDefault();
    setAdding(true);
    try {
      const response = await fetch("/api/inventory/inks/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, inkColor }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to add ink model");
        return;
      }
      toast.success("Ink model added");
      setName("");
      router.refresh();
    } catch {
      toast.error("Failed to add ink model");
    } finally {
      setAdding(false);
    }
  }

  async function saveModel(option: InkModelSettingsRow) {
    setPendingId(option.id);
    try {
      const response = await fetch(`/api/inventory/inks/models/${option.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: names[option.id] ?? option.name,
          inkColor: option.receiptCount > 0 ? option.inkColor : colors[option.id] ?? option.inkColor,
          active: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to save ink model");
        return;
      }
      toast.success("Ink model saved");
      router.refresh();
    } catch {
      toast.error("Failed to save ink model");
    } finally {
      setPendingId(null);
    }
  }

  async function removeModel(option: InkModelSettingsRow) {
    setPendingId(option.id);
    try {
      const response = await fetch(`/api/inventory/inks/models/${option.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to remove ink model");
        return;
      }
      toast.success(
        data.deactivated
          ? "Removed from the receive form. Past receipts still show this model."
          : "Ink model removed"
      );
      router.refresh();
    } catch {
      toast.error("Failed to remove ink model");
    } finally {
      setPendingId(null);
    }
  }

  async function restoreModel(option: InkModelSettingsRow) {
    setPendingId(option.id);
    try {
      const response = await fetch(`/api/inventory/inks/models/${option.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? "Failed to restore ink model");
        return;
      }
      toast.success("Ink model restored");
      router.refresh();
    } catch {
      toast.error("Failed to restore ink model");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="max-w-3xl space-y-4 rounded-xl border bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-base font-semibold">Ink models</h2>
        <p className="mt-1 text-sm text-slate-600">
          These names appear when you receive ink. Each model keeps its own
          bottle balance. Removing a model that already has receipts hides it
          from the receive form and leaves the past bottles on the dashboard.
        </p>
      </div>

      <form onSubmit={addModel} className="grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="newInkModel">New ink model</Label>
          <Input
            id="newInkModel"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="BK 001"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="newInkColor">Color</Label>
          <select
            id="newInkColor"
            value={inkColor}
            onChange={(event) => {
              if (isInkColor(event.target.value)) setInkColor(event.target.value);
            }}
            className="h-10 w-full rounded-md border bg-white px-3 text-sm"
          >
            {INK_COLORS.map((color) => (
              <option key={color} value={color}>
                {INK_COLOR_LABELS[color]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={adding} className="bg-[#0e6b43] text-white hover:bg-[#0c5b39]">
          {adding ? "Adding..." : "Add"}
        </Button>
      </form>

      <ul className="divide-y rounded-lg border">
        {options.map((option) => (
          <li key={option.id} className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor={`ink-model-${option.id}`}>Name</Label>
              <Input
                id={`ink-model-${option.id}`}
                value={names[option.id] ?? option.name}
                onChange={(event) =>
                  setNames((current) => ({ ...current, [option.id]: event.target.value }))
                }
                disabled={!option.active}
                required
              />
              {!option.active ? (
                <p className="text-[11px] text-slate-500">Removed from the receive form.</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`ink-color-${option.id}`}>Color</Label>
              {option.receiptCount > 0 ? (
                <Input id={`ink-color-${option.id}`} value={INK_COLOR_LABELS[option.inkColor]} readOnly />
              ) : (
                <select
                  id={`ink-color-${option.id}`}
                  value={colors[option.id] ?? option.inkColor}
                  onChange={(event) => {
                    if (!isInkColor(event.target.value)) return;
                    const color = event.target.value;
                    setColors((current) => ({ ...current, [option.id]: color }));
                  }}
                  disabled={!option.active}
                  className="h-10 w-full rounded-md border bg-white px-3 text-sm disabled:bg-slate-50"
                >
                  {INK_COLORS.map((color) => (
                    <option key={color} value={color}>
                      {INK_COLOR_LABELS[color]}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-2">
              {option.active ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pendingId === option.id}
                    onClick={() => saveModel(option)}
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pendingId === option.id}
                    onClick={() => removeModel(option)}
                  >
                    Remove
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pendingId === option.id}
                  onClick={() => restoreModel(option)}
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
