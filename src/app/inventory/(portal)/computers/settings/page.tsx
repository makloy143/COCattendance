import { ComputerLocationSettings } from "@/components/computer-location-settings";
import { listComputerLocations } from "@/lib/computers-data";
import { COMPUTER_GROUPS } from "@/lib/computers";
import { requireInventorySession } from "@/lib/inventory-auth";

export const dynamic = "force-dynamic";

const COPY = {
  DEPARTMENT: {
    title: "Departments",
    description: "Offices that have their own computers. Add a department here before assigning computers to it.",
    placeholder: "Clinic",
  },
  COMLAB: {
    title: "COMLAB rooms",
    description: "Each computer laboratory room.",
    placeholder: "COMLAB 2",
  },
  LIBRARY: {
    title: "Library areas",
    description: "Student-use computer areas in the library. The library staff office belongs under Departments.",
    placeholder: "Library e-resource area",
  },
} as const;

export default async function ComputerSettingsPage() {
  await requireInventorySession();
  const locations = await listComputerLocations();
  const order = ["DEPARTMENT", ...COMPUTER_GROUPS.filter((group) => group !== "DEPARTMENT")] as const;

  return (
    <div className="space-y-4">
      <p className="max-w-2xl text-sm text-slate-600">
        Locations are where computers live. Renaming one updates every computer in it. A location
        that still has computers is hidden instead of removed.
      </p>
      {order.map((group) => (
        <ComputerLocationSettings
          key={group}
          group={group}
          {...COPY[group]}
          locations={locations.filter((location) => location.group === group)}
        />
      ))}
    </div>
  );
}
