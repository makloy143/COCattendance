import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { AdminRole } from "@/generated/prisma/client";
import type { Department } from "@/lib/departments";

const SESSION_COOKIE = "cociligan_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  adminId: string;
  username: string;
  role: AdminRole;
  department: Department | null;
};

export async function verifyCredentials(username: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) return null;

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;

  return admin;
}

export async function createSession(
  adminId: string,
  username: string,
  role: AdminRole,
  department: Department | null
) {
  const token = await new SignJWT({ adminId, username, role, department })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });
}

function parseDepartment(value: unknown): Department | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return null;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const role =
      payload.role === "SUPER_ADMIN" || payload.role === "ADMIN"
        ? payload.role
        : "ADMIN";

    let department = parseDepartment(payload.department);

    if (role !== "SUPER_ADMIN" && !department) {
      const admin = await prisma.admin.findUnique({
        where: { id: payload.adminId as string },
        select: { department: true },
      });
      department = admin?.department ?? null;
    }

    return {
      adminId: payload.adminId as string,
      username: payload.username as string,
      role,
      department,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireSession();
  if (session.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }
  return session;
}

export function isSuperAdmin(session: SessionPayload | null) {
  return session?.role === "SUPER_ADMIN";
}

export function getStudentDepartmentFilter(
  session: SessionPayload,
  departmentScope?: string | null
) {
  if (session.role === "SUPER_ADMIN") {
    if (departmentScope) {
      return { department: departmentScope };
    }
    return {};
  }

  if (!session.department) {
    throw new Error("Admin department is not configured");
  }

  return { department: session.department };
}

export function assertDepartmentAccess(
  session: SessionPayload,
  department: Department
) {
  if (session.role === "SUPER_ADMIN") {
    return;
  }

  if (session.department !== department) {
    throw new Error("Forbidden");
  }
}

export function resolveStudentDepartment(
  session: SessionPayload,
  requestedDepartment?: Department | null
): Department {
  if (session.role === "SUPER_ADMIN") {
    if (!requestedDepartment) {
      throw new Error("Department is required");
    }
    return requestedDepartment;
  }

  if (!session.department) {
    throw new Error("Admin department is not configured");
  }

  if (requestedDepartment && requestedDepartment !== session.department) {
    throw new Error("Forbidden");
  }

  return session.department;
}
