"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Loader2,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABELS,
  type CheckItemDto,
  STATUS_LABELS,
} from "@/lib/checks-shared";
import { IT_STAFF_NAMES } from "@/lib/inventory";
import { cn } from "@/lib/utils";

const categoryIcon = {
  INK: Droplets,
  TECHNICAL: Wrench,
  OTHER: ClipboardCheck,
} as const;

type CheckFormState = {
  status: "COMPLETED" | "ISSUE_FOUND" | "SKIPPED";
  notes: string;
  checkedBy: string;
};

export default function TodayChecksPage() {
  const [items, setItems] = useState<CheckItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, CheckFormState>>({});

  async function loadItems() {
    setLoading(true);
    try {
      const response = await fetch("/api/checks");
      if (!response.ok) throw new Error();
      const data = await response.json();
      setItems(data.items ?? []);
    } catch {
      toast.error("Failed to load checks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  function getFormKey(item: CheckItemDto) {
    return `${item.templateId}-${item.periodStart}`;
  }

  function getForm(item: CheckItemDto): CheckFormState {
    const key = getFormKey(item);
    return (
      forms[key] ?? {
        status: "COMPLETED",
        notes: item.logNotes ?? "",
        checkedBy: item.checkedBy ?? IT_STAFF_NAMES[0],
      }
    );
  }

  function updateForm(item: CheckItemDto, patch: Partial<CheckFormState>) {
    const key = getFormKey(item);
    setForms((current) => ({
      ...current,
      [key]: { ...getForm(item), ...patch },
    }));
  }

  async function handleSubmit(item: CheckItemDto) {
    const key = getFormKey(item);
    const form = getForm(item);
    setBusyKey(key);

    try {
      const response = await fetch("/api/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: item.templateId,
          periodStart: item.periodStart,
          status: form.status,
          notes: form.notes,
          checkedBy: form.checkedBy,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save check");
      }

      toast.success(
        form.status === "ISSUE_FOUND"
          ? "Issue recorded"
          : "Check saved successfully"
      );
      await loadItems();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save check"
      );
    } finally {
      setBusyKey(null);
    }
  }

  const overdueCount = items.filter((item) => item.urgency === "overdue").length;
  const dueTodayCount = items.filter((item) => item.urgency === "due_today").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Today&apos;s Checks
        </h1>
        <p className="text-sm text-muted-foreground">
          Complete department ink and technical inspections that are due or
          overdue
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueTodayCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {overdueCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 className="size-10 text-emerald-600" />
            <p className="text-sm font-medium">All caught up</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              No department checks are due or overdue right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const key = getFormKey(item);
            const form = getForm(item);
            const Icon = categoryIcon[item.category];
            const isBusy = busyKey === key;

            return (
              <Card
                key={key}
                className={cn(
                  item.urgency === "overdue" &&
                    "border-amber-300 dark:border-amber-800"
                )}
              >
                <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Icon className="size-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.department} · {CATEGORY_LABELS[item.category]} ·{" "}
                        {item.cadenceLabel}
                      </p>
                      {item.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      item.urgency === "overdue" ? "destructive" : "secondary"
                    }
                    className="shrink-0"
                  >
                    {item.urgency === "overdue" ? (
                      <>
                        <AlertTriangle className="size-3" />
                        Overdue
                      </>
                    ) : (
                      "Due today"
                    )}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {item.overdueSince && (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Scheduled for {item.overdueSince}
                    </p>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Result</Label>
                      <Select
                        value={form.status}
                        onValueChange={(value) => {
                          if (value) {
                            updateForm(item, {
                              status: value as CheckFormState["status"],
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMPLETED">
                            {STATUS_LABELS.COMPLETED}
                          </SelectItem>
                          <SelectItem value="ISSUE_FOUND">
                            {STATUS_LABELS.ISSUE_FOUND}
                          </SelectItem>
                          <SelectItem value="SKIPPED">
                            {STATUS_LABELS.SKIPPED}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Checked by</Label>
                      <Select
                        value={form.checkedBy}
                        onValueChange={(value) => {
                          if (value) updateForm(item, { checkedBy: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {IT_STAFF_NAMES.map((name) => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${key}`}>Notes</Label>
                    <Textarea
                      id={`notes-${key}`}
                      value={form.notes}
                      onChange={(event) =>
                        updateForm(item, { notes: event.target.value })
                      }
                      placeholder={
                        form.status === "ISSUE_FOUND"
                          ? "Describe the ink or technical issue found..."
                          : "Optional notes..."
                      }
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={() => void handleSubmit(item)}
                    disabled={isBusy}
                  >
                    {isBusy ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save check"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
