import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "cociligan_monitoring_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export type MonitoringSessionPayload = {
  monitoringAdminId: string;
  username: string;
};

export async function verifyMonitoringCredentials(
  username: string,
  password: string
) {
  const admin = await prisma.monitoringAdmin.findUnique({ where: { username } });
  if (!admin) return null;

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;

  return admin;
}

export async function createMonitoringSession(
  monitoringAdminId: string,
  username: string
) {
  const token = await new SignJWT({ monitoringAdminId, username })
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

export async function getMonitoringSession(): Promise<MonitoringSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      monitoringAdminId: payload.monitoringAdminId as string,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

export async function destroyMonitoringSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireMonitoringSession() {
  const session = await getMonitoringSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export { SESSION_COOKIE as MONITORING_SESSION_COOKIE };
