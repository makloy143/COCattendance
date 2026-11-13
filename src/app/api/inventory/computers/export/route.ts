import { requireInventorySession } from "@/lib/inventory-auth";
import { inventoryErrorResponse } from "@/lib/inventory-api";
import { listComputers } from "@/lib/computers-data";
import {
  COMPUTER_GROUPS,
  COMPUTER_GROUP_LABELS,
  COMPUTER_STATUS_LABELS,
} from "@/lib/computers";
import { buildExcelDocument } from "@/lib/excel-table";
import { formatManilaDateInput } from "@/lib/date-utils";

export async function GET() {
  try {
    await requireInventorySession();
    const rows = await listComputers();
    const sections = COMPUTER_GROUPS.map((group) => ({
      heading: `${COMPUTER_GROUP_LABELS[group]} computers`,
      headers: [
        "Asset tag", "Location", "Seat / desk", "Assigned to", "Status", "Issue", "Brand", "Model",
        "Serial number", "Processor", "RAM", "Storage", "Operating system", "Monitor",
        "Date acquired", "Warranty end", "Notes",
      ],
      rows: rows
        .filter((row) => row.group === group)
        .map((row) => [
          row.assetTag, row.locationName, row.seatLabel, row.assignedTo, COMPUTER_STATUS_LABELS[row.status],
          row.issue, row.brand, row.model, row.serialNumber, row.processor, row.ram, row.storage,
          row.operatingSystem, row.monitor, row.dateAcquired, row.warrantyEnd, row.notes,
        ]),
    }));
    const today = formatManilaDateInput();
    const file = buildExcelDocument(`Computer inventory as of ${today}`, sections);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="computer-inventory-${today}.xls"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return inventoryErrorResponse(error, "Failed to export computers");
  }
}
