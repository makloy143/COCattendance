"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ID_BAD_PRINT_STATUSES,
  ID_BAD_PRINT_STATUS_LABELS,
  ID_RELEASE_REASON_PRESETS,
  type IdBadPrintStatus,
} from "@/lib/id-maintenance";

async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function IdRemoveButton({
  endpoint,
  confirmMessage,
}: {
  endpoint: string;
  confirmMessage: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) {
        toast.error(await readError(response, "Could not remove this record"));
        return;
      }
      toast.success("Record removed");
      router.refresh();
    } catch {
      toast.error("Could not remove this record");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="cursor-pointer"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void handleClick();
      }}
      disabled={loading}
    >
      {loading ? "Removing..." : "Remove"}
    </Button>
  );
}

export function IdReleaseReasonEditor({
  id,
  reason,
}: {
  id: string;
  reason: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(reason);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    const next = value.trim();
    if (!next) {
      toast.error("Reason is required");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/id/releases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: next }),
      });
      if (!response.ok) {
        toast.error(await readError(response, "Could not update the reason"));
        return;
      }
      toast.success("Reason updated");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Could not update the reason");
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span>{reason}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            setValue(reason);
            setEditing(true);
          }}
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-w-56 items-center gap-2">
      <Input
        value={value}
        list={`release-reason-${id}`}
        onChange={(event) => setValue(event.target.value)}
        aria-label="Reason"
        required
      />
      <datalist id={`release-reason-${id}`}>
        {ID_RELEASE_REASON_PRESETS.map((preset) => (
          <option key={preset} value={preset} />
        ))}
      </datalist>
      <Button type="button" size="sm" className="cursor-pointer" onClick={() => void handleSave()} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="cursor-pointer"
        onClick={() => {
          setValue(reason);
          setEditing(false);
        }}
        disabled={loading}
      >
        Cancel
      </Button>
    </div>
  );
}

export function IdBadPrintStatusSelect({
  id,
  status,
}: {
  id: string;
  status: IdBadPrintStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  async function handleChange(next: string) {
    if (next !== "REPRINT" && next !== "RESOLVED" && next !== "CANCELLED") return;
    if (
      next === "CANCELLED" &&
      !window.confirm("Cancelling returns these wasted cards to stock. Continue?")
    ) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/id/bad-prints/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        toast.error(await readError(response, "Could not update status"));
        return;
      }
      setValue(next);
      toast.success("Status updated");
      router.refresh();
    } catch {
      toast.error("Could not update status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      aria-label="Bad printing status"
      value={value}
      disabled={loading}
      onChange={(event) => handleChange(event.target.value)}
      className="h-8 rounded-md border bg-white px-2 text-xs"
    >
      {ID_BAD_PRINT_STATUSES.map((item) => (
        <option key={item} value={item}>
          {ID_BAD_PRINT_STATUS_LABELS[item]}
        </option>
      ))}
    </select>
  );
}
