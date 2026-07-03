"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  IT_STAFF_NAMES,
  getCurrentTimeString,
  formatItemDescription,
} from "@/lib/inventory";

type BorrowForReturn = {
  id: string;
  borrowerName: string;
  department: string;
  dateBorrowed: string;
  timeBorrowed: string | null;
  receivedItem: {
    itemName: string;
    brand: string | null;
    model: string | null;
    color: string | null;
    serialNumber: string | null;
  };
};

type ReturnItemDialogProps = {
  borrow: BorrowForReturn | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updated: { id: string }) => void;
};

export function ReturnItemDialog({
  borrow,
  open,
  onOpenChange,
  onSuccess,
}: ReturnItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [returnerName, setReturnerName] = useState("");
  const [receivedByName, setReceivedByName] = useState("");
  const [dateReturned, setDateReturned] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeReturned, setTimeReturned] = useState(getCurrentTimeString());

  function resetForm() {
    if (borrow) {
      setReturnerName(borrow.borrowerName);
    } else {
      setReturnerName("");
    }
    setReceivedByName("");
    setDateReturned(format(new Date(), "yyyy-MM-dd"));
    setTimeReturned(getCurrentTimeString());
  }

  function handleOpenChange(next: boolean) {
    if (next && borrow) {
      setReturnerName(borrow.borrowerName);
    }
    if (!next) resetForm();
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!borrow) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/inventory/borrows/${borrow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnerName,
          receivedByName,
          dateReturned,
          timeReturned,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to process return");
        return;
      }

      toast.success("Item returned successfully");
      onSuccess(data);
      handleOpenChange(false);
    } catch {
      toast.error("Failed to process return");
    } finally {
      setLoading(false);
    }
  }

  if (!borrow) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Return Item</DialogTitle>
            <DialogDescription>
              Record return details for{" "}
              {formatItemDescription(borrow.receivedItem)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="returnerName">Return by</Label>
              <Input
                id="returnerName"
                value={returnerName}
                onChange={(e) => setReturnerName(e.target.value)}
                placeholder="Person returning the item"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receivedByName">Received by (IT staff)</Label>
              <Input
                id="receivedByName"
                value={receivedByName}
                onChange={(e) => setReceivedByName(e.target.value)}
                placeholder="Staff accepting the return"
                list="it-staff-list"
                required
              />
              <datalist id="it-staff-list">
                {IT_STAFF_NAMES.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="dateReturned">Date return</Label>
                <Input
                  id="dateReturned"
                  type="date"
                  value={dateReturned}
                  onChange={(e) => setDateReturned(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeReturned">Time return</Label>
                <Input
                  id="timeReturned"
                  type="time"
                  value={timeReturned}
                  onChange={(e) => setTimeReturned(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !receivedByName.trim()}>
              {loading ? "Saving..." : "Confirm Return"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
