"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Plus, Trash2, UserRoundCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CatalogOption } from "@/lib/option-code";

type OptionKind = "departments" | "assignments";

function OptionsSection({
  kind,
  title,
  description,
  icon: Icon,
}: {
  kind: OptionKind;
  title: string;
  description: string;
  icon: typeof Building2;
}) {
  const [options, setOptions] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState("");

  async function loadOptions() {
    setLoading(true);
    try {
      const response = await fetch(`/api/options/${kind}?all=true`);
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error ?? `Failed to load ${title.toLowerCase()}`);
        return;
      }
      setOptions(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOptions();
    // Reload whenever the option catalog kind changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/options/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? `Failed to add ${title.toLowerCase()}`);
        return;
      }

      toast.success(`Added "${data.label}"`);
      setLabel("");
      await loadOptions();
    } catch {
      toast.error(`Failed to add ${title.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(option: CatalogOption) {
    const response = await fetch(
      `/api/options/${kind}/${encodeURIComponent(option.code)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !option.isActive }),
      }
    );
    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Failed to update option");
      return;
    }

    toast.success(
      data.isActive ? `Activated "${data.label}"` : `Deactivated "${data.label}"`
    );
    await loadOptions();
  }

  async function handleDelete(option: CatalogOption) {
    if (!confirm(`Remove "${option.label}"?`)) return;

    const response = await fetch(
      `/api/options/${kind}/${encodeURIComponent(option.code)}`,
      { method: "DELETE" }
    );
    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Failed to remove option");
      return;
    }

    if (data.deactivated) {
      toast.success(data.message ?? `Deactivated "${option.label}"`);
    } else {
      toast.success(`Removed "${option.label}"`);
    }
    await loadOptions();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <form
          onSubmit={handleCreate}
          className="grid gap-3 sm:grid-cols-[1fr_auto]"
        >
          <div className="space-y-2">
            <Label htmlFor={`${kind}-label`}>New label</Label>
            <Input
              id={`${kind}-label`}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={
                kind === "departments" ? "e.g. Clinic" : "e.g. Alumni Office"
              }
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving || !label.trim()}>
              <Plus className="size-4" />
              {saving ? "Adding..." : "Add"}
            </Button>
          </div>
        </form>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-muted-foreground">No options yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {options.map((option) => (
                  <TableRow key={option.code}>
                    <TableCell className="font-medium">{option.label}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {option.code}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {option.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-1 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleToggle(option)}
                      >
                        {option.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDelete(option)}
                      >
                        <Trash2 className="size-4" />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CatalogOptionsManager() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <OptionsSection
        kind="departments"
        title="Departments"
        description="These appear when assigning department admins and when registering students."
        icon={Building2}
      />
      <OptionsSection
        kind="assignments"
        title="Assign to"
        description="These appear in the student form Assign to dropdown."
        icon={UserRoundCog}
      />
    </div>
  );
}
