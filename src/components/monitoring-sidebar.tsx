"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  FileSpreadsheet,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PortalBackLink } from "@/components/portal-back-link";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/monitoring",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/monitoring/report",
    label: "Daily Report",
    icon: FileSpreadsheet,
  },
];

export function MonitoringSidebar({ username }: { username?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/monitoring/auth", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">COC-ILIGAN</p>
            <p className="text-xs text-muted-foreground">Monitoring Portal</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0",
                        isActive &&
                          "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        {username && (
          <p className="truncate px-2 py-1 text-xs text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">{username}</span>
          </p>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function MonitoringShell({
  children,
  username,
}: {
  children: React.ReactNode;
  username?: string;
}) {
  return (
    <SidebarProvider>
      <MonitoringSidebar username={username} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 hidden h-4 sm:block" />
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground sm:text-sm">
            <span className="hidden sm:inline">
              IT monitoring portal — daily systems status
            </span>
            <span className="sm:hidden">COC-ILIGAN Monitoring</span>
          </p>
          <PortalBackLink />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
