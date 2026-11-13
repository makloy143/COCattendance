import { listComputerHistory } from "@/lib/computers-data";
import { formatDateTime } from "@/lib/date-utils";
import { requireInventorySession } from "@/lib/inventory-auth";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  ADDED: "Added",
  MOVED: "Moved",
  STATUS: "Status",
  ASSIGNED: "Assigned",
  EDITED: "Edited",
  TICKET: "Ticket",
};

export default async function ComputerHistoryPage() {
  await requireInventorySession();
  const rows = await listComputerHistory();

  return (
    <section className="rounded-xl border bg-white shadow-sm">
      <div className="border-b p-4 sm:p-5">
        <h2 className="text-base font-semibold">Change history</h2>
        <p className="mt-1 text-sm text-slate-600">
          Every computer added, moved, reassigned, or given a new status. Showing the latest {rows.length}.
        </p>
      </div>
      {rows.length === 0 ? (
        <p className="p-5 text-sm text-slate-600">Changes appear here once computers are added.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
              <tr>
                <th className="px-4 py-2.5">When</th>
                <th className="px-4 py-2.5">Asset tag</th>
                <th className="px-4 py-2.5">Change</th>
                <th className="px-4 py-2.5">Details</th>
                <th className="px-4 py-2.5">By</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{formatDateTime(row.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-medium">{row.assetTag}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">{ACTION_LABELS[row.action] ?? row.action}</td>
                  <td className="px-4 py-2.5 text-slate-700">{row.detail}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{row.actor || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
