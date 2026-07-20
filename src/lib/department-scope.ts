import { cookies } from "next/headers";
import type { SessionPayload } from "@/lib/auth";
import { listDepartmentOptions } from "@/lib/departments-server";

export const DEPARTMENT_SCOPE_COOKIE = "cociligan_department_scope";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function getDepartmentScopeCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(DEPARTMENT_SCOPE_COOKIE)?.value?.trim();
  return value || null;
}

export async function setDepartmentScopeCookie(department: string | null) {
  const cookieStore = await cookies();

  if (!department) {
    cookieStore.delete(DEPARTMENT_SCOPE_COOKIE);
    return;
  }

  cookieStore.set(DEPARTMENT_SCOPE_COOKIE, department, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Resolves the active department scope for a superadmin.
 * Regular admins always return null (their session department is used instead).
 * Optional `override` (e.g. query param) wins over the cookie when valid.
 */
export async function resolveDepartmentScope(
  session: SessionPayload,
  override?: string | null
): Promise<string | null> {
  if (session.role !== "SUPER_ADMIN") {
    return null;
  }

  const requested = override?.trim() || (await getDepartmentScopeCookie());
  if (!requested) {
    return null;
  }

  const departments = await listDepartmentOptions();
  if (departments.some((item) => item.code === requested)) {
    return requested;
  }

  return null;
}
