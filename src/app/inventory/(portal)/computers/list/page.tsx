import { ComputerList } from "@/components/computer-list";
import { listComputerLocations, listComputers } from "@/lib/computers-data";
import { requireInventorySession } from "@/lib/inventory-auth";

export const dynamic = "force-dynamic";

export default async function ComputerListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireInventorySession();
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  const [computers, locations] = await Promise.all([listComputers(), listComputerLocations()]);

  return (
    <ComputerList
      computers={computers}
      locations={locations}
      initialGroup={one("group")}
      initialLocation={one("location")}
      initialStatus={one("status")}
      openAdd={one("add") === "1"}
    />
  );
}
