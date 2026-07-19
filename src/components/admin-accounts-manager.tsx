"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getDepartmentLabel,
  type Department,
} from "@/lib/departments";
import type { CatalogOption } from "@/lib/option-code";
import type { AdminRole } from "@/generated/prisma/client";

type AdminAccount = {
  id: string;
  username: string;
  role: AdminRole;
  department: Department | null;
  createdAt: string;
};

const emptyForm = {
  username: "",
  password: "",
  role: "ADMIN" as AdminRole,
  department: "REGISTRAR" as Department,
};

export function AdminAccountsManager() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [departments, setDepartments] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function loadAdmins() {
    setLoading(true);
    try {
      const [adminsResponse, departmentsResponse] = await Promise.all([
        fetch("/api/admin"),
        fetch("/api/options/departments"),
      ]);
      const adminsData = await adminsResponse.json();
      const departmentsData = await departmentsResponse.json();

      if (!adminsResponse.ok) {
        toast.error(adminsData.error ?? "Failed to load admin accounts");
        return;
      }
      if (!departmentsResponse.ok) {
        toast.error(departmentsData.error ?? "Failed to load departments");
        return;
      }

      setAdmins(adminsData);
      setDepartments(departmentsData);
      if (departmentsData[0]?.code) {
        setForm((current) => ({
          ...current,
          department: current.department || departmentsData[0].code,
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAdmins();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
          role: form.role,
          department: form.role === "ADMIN" ? form.department : null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Failed to create admin account");
        return;
      }

      toast.success(`Created admin account "${data.username}"`);
      setForm(emptyForm);
      await loadAdmins();
    } catch {
      toast.error("Failed to create admin account");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Delete admin account "${username}"?`)) return;

    const response = await fetch(`/api/admin/${id}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error ?? "Failed to delete admin account");
      return;
    }

    toast.success(`Deleted admin account "${username}"`);
    await loadAdmins();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4" />
            Create Department Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleCreate}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    username: e.target.value,
                  }))
                }
                placeholder="registrar_admin"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    password: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(value) => {
                  if (value === "ADMIN" || value === "SUPER_ADMIN") {
                    setForm((current) => ({ ...current, role: value }));
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={form.department}
                disabled={form.role === "SUPER_ADMIN"}
                onValueChange={(value) => {
                  if (value) {
                    setForm((current) => ({
                      ...current,
                      department: value,
                    }));
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.code} value={department.code}>
                      {department.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={saving}>
                {saving ? "Creating..." : "Create Admin Account"}
              </Button>
            </div>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">
            Department admins can only register and manage SA/HK students in
            their assigned department. Super admins can access all departments
            and manage accounts.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4" />
            Admin Accounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading accounts...</p>
          ) : admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No admin accounts found.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.username}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {admin.role === "SUPER_ADMIN"
                            ? "Super Admin"
                            : "Admin"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {admin.department
                          ? getDepartmentLabel(
                              admin.department,
                              Object.fromEntries(
                                departments.map((item) => [
                                  item.code,
                                  item.label,
                                ])
                              )
                            )
                          : "All departments"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            void handleDelete(admin.id, admin.username)
                          }
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
