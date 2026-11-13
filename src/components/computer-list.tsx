"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Pencil, Plus, Search, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { ComputerStatusBadge } from "@/components/computer-status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  COMPUTER_GROUPS,
  COMPUTER_GROUP_LABELS,
  COMPUTER_STATUSES,
  COMPUTER_STATUS_LABELS,
  computerLocationLabel,
  computerSpecSummary,
  type ComputerLocationRow,
  type ComputerRow,
  type ComputerStatus,
} from "@/lib/computers";
import { cn } from "@/lib/utils";

type FormState = Omit<ComputerRow, "id" | "locationName" | "group" | "updatedAt" | "ticket">;

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
] as const;

const SELECT_CLASS = "h-9 w-full rounded-md border bg-white px-2 text-sm";
const PAGE_SIZE = 50;

function blankForm(locationId: string): FormState {
  return {
    assetTag: "",
    locationId,
    seatLabel: "",
    assignedTo: "",
    brand: "",
    model: "",
    serialNumber: "",
    processor: "",
    ram: "",
    storage: "",
    operatingSystem: "",
    monitor: "",
    status: "WORKING",
    issue: "",
    dateAcquired: "",
    warrantyEnd: "",
    notes: "",
  };
}

function Field({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function ComputerList({
  computers,
  locations,
  initialGroup,
  initialLocation,
  initialStatus,
  openAdd,
}: {
  computers: ComputerRow[];
  locations: ComputerLocationRow[];
  initialGroup: string;
  initialLocation: string;
  initialStatus: string;
  openAdd: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState(
    (COMPUTER_GROUPS as readonly string[]).includes(initialGroup) ? initialGroup : ""
  );
  const [locationId, setLocationId] = useState(
    locations.some((location) => location.id === initialLocation) ? initialLocation : ""
  );
  const [status, setStatus] = useState(
    initialStatus === "ATTENTION" || (COMPUTER_STATUSES as readonly string[]).includes(initialStatus)
      ? initialStatus
      : ""
  );
  const [shown, setShown] = useState(PAGE_SIZE);
  const [editing, setEditing] = useState<ComputerRow | null>(null);
  // The dashboard’s "Add computer" link lands here with the form already open.
  const [dialogOpen, setDialogOpen] = useState(openAdd);
  const [form, setForm] = useState<FormState>(() =>
    blankForm(locations.find((location) => location.active)?.id ?? "")
  );
  const [saving, setSaving] = useState(false);
  const [ticketFor, setTicketFor] = useState<ComputerRow | null>(null);
  const [problem, setProblem] = useState("");
  const [priority, setPriority] = useState<string>("MEDIUM");

  const activeLocations = useMemo(() => locations.filter((location) => location.active), [locations]);
  const filterLocations = group ? locations.filter((location) => location.group === group) : locations;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return computers.filter((row) => {
      if (group && row.group !== group) return false;
      if (locationId && row.locationId !== locationId) return false;
      if (status === "ATTENTION") {
        if (row.status !== "DEFECTIVE" && row.status !== "UNDER_REPAIR") return false;
      } else if (status && row.status !== status) return false;
      if (!needle) return true;
      return [row.assetTag, row.serialNumber, row.assignedTo, row.seatLabel, row.brand, row.model, row.locationName]
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [computers, group, locationId, query, status]);

  function openCreate() {
    const preferred = activeLocations.find((location) => location.id === locationId) ??
      activeLocations.find((location) => !group || location.group === group) ??
      activeLocations[0];
    setEditing(null);
    setForm(blankForm(preferred?.id ?? ""));
    setDialogOpen(true);
  }

  function openEdit(row: ComputerRow) {
    const { id: _id, locationName: _name, group: _group, updatedAt: _updated, ticket: _ticket, ...rest } = row;
    void _id; void _name; void _group; void _updated; void _ticket;
    setEditing(row);
    setForm(rest);
    setDialogOpen(true);
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(
        editing ? `/api/inventory/computers/${editing.id}` : "/api/inventory/computers",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error ?? "Couldn't save the computer. Try again.");
        return;
      }
      toast.success(editing ? "Computer updated" : "Computer added");
      setDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Couldn't save the computer. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function openTicket(row: ComputerRow) {
    setTicketFor(row);
    setProblem(row.issue);
    setPriority("MEDIUM");
  }

  async function submitTicket(event: React.FormEvent) {
    event.preventDefault();
    if (!ticketFor) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/inventory/computers/${ticketFor.id}/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, priority }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error ?? "Couldn't open the ticket. Try again.");
        return;
      }
      toast.success(`Ticket ${data.number} opened`);
      setTicketFor(null);
      router.refresh();
    } catch {
      toast.error("Couldn't open the ticket. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: ComputerRow) {
    if (!window.confirm(`Remove ${row.assetTag} and its history? This can't be undone. To keep the record, set its status to Retired instead.`)) {
      return;
    }
    try {
      const response = await fetch(`/api/inventory/computers/${row.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(data.error ?? "Couldn't remove the computer.");
        return;
      }
      toast.success("Computer removed");
      router.refresh();
    } catch {
      toast.error("Couldn't remove the computer.");
    }
  }

  const visible = filtered.slice(0, shown);
  const needsIssue = form.status === "DEFECTIVE" || form.status === "UNDER_REPAIR";
  const formLocations = locations.filter(
    (location) => location.active || location.id === form.locationId
  );

  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShown(PAGE_SIZE);
              }}
              placeholder="COMLAB1-PC14, serial number, or user"
              aria-label="Search computers"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.open("/api/inventory/computers/export", "_self")}
              className="inline-flex h-9 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-medium hover:bg-slate-50"
            >
              <Download className="size-4" />
              Export
            </button>
            <Button
              type="button"
              onClick={openCreate}
              className="h-9 bg-[#16324f] text-white hover:bg-[#1d4168]"
            >
              <Plus className="size-4" />
              Add computer
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {[{ value: "", label: "All" }, ...COMPUTER_GROUPS.map((value) => ({ value, label: COMPUTER_GROUP_LABELS[value] }))].map(
            (option) => {
              const count = option.value
                ? computers.filter((row) => row.group === option.value).length
                : computers.length;
              return (
                <button
                  key={option.value || "all"}
                  type="button"
                  aria-pressed={group === option.value}
                  onClick={() => {
                    setGroup(option.value);
                    setLocationId("");
                    setShown(PAGE_SIZE);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    group === option.value
                      ? "border-[#16324f] bg-[#16324f] text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {option.label} <span className="tabular-nums opacity-75">{count}</span>
                </button>
              );
            }
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <select
              aria-label="Location"
              value={locationId}
              onChange={(event) => {
                setLocationId(event.target.value);
                setShown(PAGE_SIZE);
              }}
              className="h-8 rounded-md border bg-white px-2 text-xs"
            >
              <option value="">All locations</option>
              {filterLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {computerLocationLabel(location)}
                </option>
              ))}
            </select>
            <select
              aria-label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setShown(PAGE_SIZE);
              }}
              className="h-8 rounded-md border bg-white px-2 text-xs"
            >
              <option value="">All statuses</option>
              <option value="ATTENTION">Needs attention</option>
              {COMPUTER_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {COMPUTER_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium">
              {computers.length === 0 ? "Add your first computer" : "No computers match these filters"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {computers.length === 0
                ? "Each computer gets an asset tag, a location, and a status."
                : "Clear the search or pick a different location or status."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Asset tag</th>
                  <th className="px-4 py-2.5">Location</th>
                  <th className="px-4 py-2.5">Specs</th>
                  <th className="px-4 py-2.5">Assigned to</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5">
                      <p className="font-medium">{row.assetTag}</p>
                      <p className="text-xs text-slate-500">
                        {[row.brand, row.model].filter(Boolean).join(" ") || row.serialNumber || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <p>{computerLocationLabel({ name: row.locationName, group: row.group })}</p>
                      <p className="text-xs text-slate-500">{row.seatLabel || COMPUTER_GROUP_LABELS[row.group]}</p>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{computerSpecSummary(row) || "—"}</td>
                    <td className="px-4 py-2.5 text-slate-700">{row.assignedTo || "—"}</td>
                    <td className="px-4 py-2.5">
                      <ComputerStatusBadge status={row.status} />
                      {row.issue ? <p className="mt-1 max-w-48 truncate text-xs text-slate-500">{row.issue}</p> : null}
                      {row.ticket ? (
                        <Link
                          href={`/maintenance/${row.ticket.id}`}
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#2f6fed] hover:underline"
                        >
                          <Wrench className="size-3" />
                          {row.ticket.number}
                        </Link>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-1">
                        {!row.ticket && row.status !== "RETIRED" ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Open maintenance ticket for ${row.assetTag}`}
                            title="Open maintenance ticket"
                            onClick={() => openTicket(row)}
                          >
                            <Wrench className="size-4" />
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${row.assetTag}`}
                          onClick={() => openEdit(row)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${row.assetTag}`}
                          onClick={() => void remove(row)}
                        >
                          <Trash2 className="size-4 text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 ? (
          <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-xs text-slate-500">
            <span>
              Showing {visible.length} of {filtered.length}
              {filtered.length !== computers.length ? ` (${computers.length} total)` : ""}
            </span>
            {filtered.length > visible.length ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setShown((count) => count + PAGE_SIZE)}>
                Show more
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={save} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing ? `Edit ${editing.assetTag}` : "Add computer"}</DialogTitle>
              <DialogDescription>
                Only the asset tag and location are required. Fill in the rest as you learn it.
              </DialogDescription>
            </DialogHeader>

            {formLocations.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Add a location in Settings first.
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="assetTag" label="Asset tag">
                <Input
                  id="assetTag"
                  value={form.assetTag}
                  onChange={(event) => set("assetTag", event.target.value)}
                  placeholder="COMLAB1-PC14"
                  required
                  maxLength={60}
                />
              </Field>
              <Field id="locationId" label="Location">
                <select
                  id="locationId"
                  value={form.locationId}
                  onChange={(event) => set("locationId", event.target.value)}
                  className={SELECT_CLASS}
                  required
                >
                  <option value="" disabled>
                    Choose a location
                  </option>
                  {COMPUTER_GROUPS.map((value) => {
                    const options = formLocations.filter((location) => location.group === value);
                    return options.length === 0 ? null : (
                      <optgroup key={value} label={COMPUTER_GROUP_LABELS[value]}>
                        {options.map((location) => (
                          <option key={location.id} value={location.id}>
                            {location.name}
                            {location.active ? "" : " (hidden)"}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </Field>
              <Field id="seatLabel" label="Seat or desk">
                <Input id="seatLabel" value={form.seatLabel} onChange={(event) => set("seatLabel", event.target.value)} placeholder="Seat 14" />
              </Field>
              <Field id="assignedTo" label="Assigned to">
                <Input id="assignedTo" value={form.assignedTo} onChange={(event) => set("assignedTo", event.target.value)} placeholder="Juan Dela Cruz" />
              </Field>
              <Field id="status" label="Status">
                <select
                  id="status"
                  value={form.status}
                  onChange={(event) => set("status", event.target.value as ComputerStatus)}
                  className={SELECT_CLASS}
                >
                  {COMPUTER_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {COMPUTER_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </Field>
              {needsIssue ? (
                <Field id="issue" label="Issue">
                  <Input id="issue" value={form.issue} onChange={(event) => set("issue", event.target.value)} placeholder="No display" />
                </Field>
              ) : (
                <div className="hidden sm:block" />
              )}
              <Field id="brand" label="Brand">
                <Input id="brand" value={form.brand} onChange={(event) => set("brand", event.target.value)} placeholder="Acer" />
              </Field>
              <Field id="model" label="Model">
                <Input id="model" value={form.model} onChange={(event) => set("model", event.target.value)} placeholder="Veriton M4690G" />
              </Field>
              <Field id="serialNumber" label="Serial number">
                <Input id="serialNumber" value={form.serialNumber} onChange={(event) => set("serialNumber", event.target.value)} placeholder="DTVWRSP00123456" />
              </Field>
              <Field id="processor" label="Processor">
                <Input id="processor" value={form.processor} onChange={(event) => set("processor", event.target.value)} placeholder="Core i5-12400" />
              </Field>
              <Field id="ram" label="RAM">
                <Input id="ram" value={form.ram} onChange={(event) => set("ram", event.target.value)} placeholder="8 GB" />
              </Field>
              <Field id="storage" label="Storage">
                <Input id="storage" value={form.storage} onChange={(event) => set("storage", event.target.value)} placeholder="256 GB SSD" />
              </Field>
              <Field id="operatingSystem" label="Operating system">
                <Input id="operatingSystem" value={form.operatingSystem} onChange={(event) => set("operatingSystem", event.target.value)} placeholder="Windows 11 Pro" />
              </Field>
              <Field id="monitor" label="Monitor">
                <Input id="monitor" value={form.monitor} onChange={(event) => set("monitor", event.target.value)} placeholder='Acer 21.5"' />
              </Field>
              <Field id="dateAcquired" label="Date acquired">
                <Input id="dateAcquired" type="date" value={form.dateAcquired} onChange={(event) => set("dateAcquired", event.target.value)} />
              </Field>
              <Field id="warrantyEnd" label="Warranty end">
                <Input id="warrantyEnd" type="date" value={form.warrantyEnd} onChange={(event) => set("warrantyEnd", event.target.value)} />
              </Field>
              <Field id="notes" label="Notes" className="sm:col-span-2">
                <Textarea id="notes" value={form.notes} onChange={(event) => set("notes", event.target.value)} rows={2} />
              </Field>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#16324f] text-white hover:bg-[#1d4168]">
                {saving ? "Saving…" : editing ? "Save changes" : "Add computer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={ticketFor !== null} onOpenChange={(open) => (open ? null : setTicketFor(null))}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitTicket} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Open maintenance ticket</DialogTitle>
              <DialogDescription>
                {ticketFor?.assetTag} goes to the Maintenance portal as a new ticket
                {ticketFor?.status === "WORKING" ? " and is marked Under repair." : "."}
              </DialogDescription>
            </DialogHeader>
            <Field id="ticketProblem" label="Problem">
              <Textarea
                id="ticketProblem"
                value={problem}
                onChange={(event) => setProblem(event.target.value)}
                placeholder="No display after power on"
                rows={3}
                maxLength={500}
                required
              />
            </Field>
            <Field id="ticketPriority" label="Priority">
              <select
                id="ticketPriority"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                className={SELECT_CLASS}
              >
                {PRIORITIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTicketFor(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#16324f] text-white hover:bg-[#1d4168]">
                {saving ? "Opening…" : "Open ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
