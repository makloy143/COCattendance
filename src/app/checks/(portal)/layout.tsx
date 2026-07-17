import { ChecksShell } from "@/components/checks-sidebar";
import { getChecksSession } from "@/lib/checks-auth";

export default async function ChecksPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getChecksSession();

  return <ChecksShell username={session?.username}>{children}</ChecksShell>;
}
