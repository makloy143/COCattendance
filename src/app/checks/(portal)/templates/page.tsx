"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DepartmentSelect } from "@/components/department-select";
import {
  CADENCE_LABELS,
  CATEGORY_LABELS,
  type CheckCadenceValue,
  type CheckCategoryValue,
  type CheckTemplateDto,
  WEEKDAY_OPTIONS,
} from "@/lib/checks-shared";

type TemplateForm = {
  department: string;
  title: string;
  description: string;
  category: CheckCategoryValue;
  cadence: CheckCadenceValue;
  dayOfWeek: string;
  dayOfMonth: string;
  isActive: boolean;
};

const emptyForm = (): TemplateForm => ({
  department: "COMLAB",
  title: "",
  description: "",
  category: "OTHER",
  cadence: "WEEKLY",
  dayOfWeek: "1",
  dayOfMonth: "1",
  isActive: true,
});

export default function CheckTemplatesPage() {
  const [templates, setTemplates] = useState<CheckTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(emptyForm());

  async function loadTemplates() {
    setLoading(true);
    try {
      const response = await fetch("/api/checks/templates");
      if (!response.ok) throw new Error();
      setTemplates(await response.json());
    } catch {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checks/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: form.department,
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          cadence: form.cadence,
          dayOfWeek:
            form.cadence === "WEEKLY" ? Number(form.dayOfWeek) : null,
          dayOfMonth:
            form.cadence === "MONTHLY" ? Number(form.dayOfMonth) : null,
          isActive: form.isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create schedule");
      }

      toast.success("Schedule created");
      setForm(emptyForm());
      await loadTemplates();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create schedule"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(template: CheckTemplateDto) {
    setBusyId(template.id);
    try {
      const response = await fetch("/api/checks/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: template.id,
          isActive: !template.isActive,
        }),
      });

      if (!response.ok) throw new Error();
      await loadTemplates();
    } catch {
      toast.error("Failed to update schedule");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/checks/templates?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      toast.success("Schedule deleted");
      await loadTemplates();
    } catch {
      toast.error("Failed to delete schedule");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Check Schedules
        </h1>
        <p className="text-sm text-muted-foreground">
          Set daily, weekly, or monthly reminders for department ink and
          technical checks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add new schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Department</Label>
                <DepartmentSelect
                  value={form.department}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, department: value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Check title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Check ink levels and cartridges"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="What should be inspected during this check?"
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => {
                    if (value) {
                      setForm((current) => ({
                        ...current,
                        category: value as CheckCategoryValue,
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reminder frequency</Label>
                <Select
                  value={form.cadence}
                  onValueChange={(value) => {
                    if (value) {
                      setForm((current) => ({
                        ...current,
                        cadence: value as CheckCadenceValue,
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CADENCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.cadence === "WEEKLY" && (
                <div className="space-y-2">
                  <Label>Day of week</Label>
                  <Select
                    value={form.dayOfWeek}
                    onValueChange={(value) => {
                      if (value) {
                        setForm((current) => ({ ...current, dayOfWeek: value }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAY_OPTIONS.map((day) => (
                        <SelectItem
                          key={day.dayOfWeek}
                          value={String(day.dayOfWeek)}
                        >
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {form.cadence === "MONTHLY" && (
                <div className="space-y-2">
                  <Label htmlFor="dayOfMonth">Day of month</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min={1}
                    max={28}
                    value={form.dayOfMonth}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dayOfMonth: event.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Add schedule
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configured schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No schedules yet. Add your first reminder above.
            </p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{template.title}</p>
                      <Badge variant="outline">
                        {CATEGORY_LABELS[template.category]}
                      </Badge>
                      <Badge variant="secondary">
                        {CADENCE_LABELS[template.cadence]}
                      </Badge>
                      {!template.isActive && (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {template.department} · {template.cadenceLabel}
                    </p>
                    {template.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === template.id}
                      onClick={() => void toggleActive(template)}
                    >
                      {template.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === template.id}
                      onClick={() => void handleDelete(template.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
