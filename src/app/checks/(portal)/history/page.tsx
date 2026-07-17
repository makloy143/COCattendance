"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CADENCE_LABELS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  type CheckStatusValue,
} from "@/lib/checks-shared";
import { formatDateTime } from "@/lib/date-utils";

type HistoryLog = {
  id: string;
  templateTitle: string;
  department: string;
  category: keyof typeof CATEGORY_LABELS;
  cadence: keyof typeof CADENCE_LABELS;
  status: CheckStatusValue;
  checkDate: string;
  notes: string | null;
  checkedBy: string | null;
  updatedAt: string;
};

export default function CheckHistoryPage() {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const response = await fetch("/api/checks/history");
        if (!response.ok) throw new Error();
        setLogs(await response.json());
      } catch {
        toast.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    }

    void loadHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Check History
        </h1>
        <p className="text-sm text-muted-foreground">
          Past department ink and technical check records
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent logs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No check history yet.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{log.templateTitle}</p>
                    <Badge variant="outline">
                      {CATEGORY_LABELS[log.category]}
                    </Badge>
                    <Badge variant="secondary">
                      {CADENCE_LABELS[log.cadence]}
                    </Badge>
                    <Badge
                      variant={
                        log.status === "ISSUE_FOUND" ? "destructive" : "outline"
                      }
                    >
                      {STATUS_LABELS[log.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {log.department} · Period {log.checkDate}
                    {log.checkedBy ? ` · Checked by ${log.checkedBy}` : ""}
                  </p>
                  {log.notes && (
                    <p className="mt-2 text-sm">{log.notes}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Updated {formatDateTime(log.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
