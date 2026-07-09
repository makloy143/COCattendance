"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeftToLine,
  ArrowRightFromLine,
  IdCard,
  LayoutDashboard,
  LogOut,
  Package,
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
  { href: "/inventory", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/inventory/received", label: "Item Received", icon: Package },
  {
    href: "/inventory/received/release",
    label: "Release Item",
    icon: ArrowRightFromLine,
    match: ["/inventory/received/release"],
  },
  {
    href: "/inventory/borrows/new",
    label: "Borrow Item",
    icon: ArrowRightFromLine,
    match: ["/inventory/borrows/new"],
  },
  { href: "/inventory/returns", label: "Item Return", icon: ArrowLeftToLine },
  { href: "/inventory/id-errors", label: "ID Errors", icon: IdCard },
  {
    href: "/inventory/borrows",
    label: "Borrow History",
    icon: ArrowRightFromLine,
    match: ["/inventory/borrows"],
  },
];

export function InventorySidebar({ username }: { username?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/inventory/auth", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  function isNavActive(item: (typeof navItems)[number]) {
    if (item.exact) return pathname === item.href;
    if (item.match) {
      return item.match.some((m) => pathname === m);
    }
    if (item.href === "/inventory/borrows") {
      return pathname === "/inventory/borrows";
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Package className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">COCiligan</p>
            <p className="text-xs text-muted-foreground">Inventory Portal</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = isNavActive(item);

                return (
                  <SidebarMenuItem key={item.href + item.label}>
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

export function InventoryShell({
  children,
  username,
}: {
  children: React.ReactNode;
  username?: string;
}) {
  return (
    <SidebarProvider>
      <InventorySidebar username={username} />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-1 hidden h-4 sm:block" />
          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground sm:text-sm">
            <span className="hidden sm:inline">
              Inventory portal — received items, borrows & ID errors
            </span>
            <span className="sm:hidden">COCiligan Inventory</span>
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
