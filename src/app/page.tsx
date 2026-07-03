import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  GraduationCap,
  Package,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "COC-ILIGAN Portal",
  description: "Choose your dashboard — attendance, daily monitoring, or inventory",
};

const portals = [
  {
    href: "/login",
    title: "Attendance Dashboard",
    description:
      "Manage student registration, QR scanning, and daily attendance records.",
    icon: GraduationCap,
    iconClass: "bg-emerald-600 text-white",
    cardClass: "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
  },
  {
    href: "/monitoring/login",
    title: "Daily Monitoring Dashboard",
    description:
      "Track daily IT systems monitoring reports and generate status summaries.",
    icon: Activity,
    iconClass: "bg-blue-600 text-white",
    cardClass: "hover:border-blue-500/50 hover:shadow-blue-500/10",
  },
  {
    href: "/inventory/login",
    title: "Inventory Dashboard",
    description:
      "Manage received items and borrow records from COC Main inventory.",
    icon: Package,
    iconClass: "bg-amber-600 text-white",
    cardClass: "hover:border-amber-500/50 hover:shadow-amber-500/10",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-background dark:to-emerald-950/20">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <div className="mb-10 max-w-2xl text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <GraduationCap className="size-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            COC-ILIGAN Portal
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Select a dashboard to get started
          </p>
        </div>

        <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {portals.map((portal) => (
            <Link key={portal.href} href={portal.href} className="group block">
              <Card
                className={cn(
                  "h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                  portal.cardClass
                )}
              >
                <CardHeader className="space-y-4">
                  <div
                    className={cn(
                      "flex size-12 items-center justify-center rounded-xl shadow-sm",
                      portal.iconClass
                    )}
                  >
                    <portal.icon className="size-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{portal.title}</CardTitle>
                    <CardDescription className="mt-1.5 leading-relaxed">
                      {portal.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors group-hover:gap-2.5">
                    Open dashboard
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">
        City College of Cagayan de Oro — Iligan Campus
      </footer>
    </div>
  );
}
