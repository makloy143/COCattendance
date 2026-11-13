"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { History, LayoutDashboard, LogOut, Menu, Monitor, MonitorCog, Settings, UserRound, X } from "lucide-react";
import { InventoryDashboardSwitcher } from "@/components/inventory-dashboard-switcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inventory/computers", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/inventory/computers/list", label: "All Computers", icon: Monitor },
  { href: "/inventory/computers/history", label: "Change History", icon: History },
  { href: "/inventory/computers/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageTitle(pathname: string) {
  if (pathname === "/inventory/computers") return "Computers Dashboard";
  return navItems.find((item) => isActive(pathname, item.href, item.exact))?.label ?? "Computers";
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white",
              active && "bg-[#2f6fed] text-white shadow-sm"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ComputerShell({
  children,
  username,
}: {
  children: React.ReactNode;
  username?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const title = pageTitle(pathname);

  async function handleLogout() {
    await fetch("/api/inventory/auth", { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] text-slate-900">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-[#16324f] text-white md:flex">
        <div className="px-5 pb-1 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
            Computer Inventory
          </p>
        </div>
        <NavLinks pathname={pathname} />
        <div className="space-y-3 border-t border-white/15 p-3">
          <InventoryDashboardSwitcher tone="inverse" />
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-64 flex-col bg-[#16324f] text-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-4">
              <p className="text-sm font-semibold">Computers</p>
              <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-white/95 px-4 py-3 backdrop-blur sm:px-6 md:px-8">
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg border md:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-4" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#16324f] text-white">
              <MonitorCog className="size-4" />
            </div>
            <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{title}</h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full border bg-white py-1 pr-3 pl-1 text-sm sm:flex">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#e8eef8] text-[#16324f]">
              <UserRound className="size-4" />
            </span>
            <span className="max-w-32 truncate font-medium">{username || "Inventory"}</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
