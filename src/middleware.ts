import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_SESSION_COOKIE = "cociligan_session";
const INVENTORY_SESSION_COOKIE = "cociligan_inventory_session";
const MONITORING_SESSION_COOKIE = "cociligan_monitoring_session";
const TODO_SESSION_COOKIE = "cociligan_todo_session";
const CHECKS_SESSION_COOKIE = "cociligan_checks_session";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function hasValidSession(request: NextRequest, cookieName: string) {
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return false;

  const secret = getSecretKey();
  if (!secret) return false;

  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminAuthenticated = await hasValidSession(
    request,
    ADMIN_SESSION_COOKIE
  );
  const inventoryAuthenticated = await hasValidSession(
    request,
    INVENTORY_SESSION_COOKIE
  );
  const monitoringAuthenticated = await hasValidSession(
    request,
    MONITORING_SESSION_COOKIE
  );
  const todoAuthenticated = await hasValidSession(
    request,
    TODO_SESSION_COOKIE
  );
  const checksAuthenticated = await hasValidSession(
    request,
    CHECKS_SESSION_COOKIE
  );

  const isMonitoringLogin = pathname === "/monitoring/login";
  const isMonitoringRoute =
    pathname === "/monitoring" || pathname.startsWith("/monitoring/");
  const isMonitoringApi =
    pathname.startsWith("/api/monitoring") &&
    !pathname.startsWith("/api/monitoring/auth");

  if (isMonitoringLogin) {
    if (monitoringAuthenticated) {
      return NextResponse.redirect(new URL("/monitoring", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/monitoring/auth")) {
    return NextResponse.next();
  }

  if (isMonitoringApi || (isMonitoringRoute && !isMonitoringLogin)) {
    if (!monitoringAuthenticated) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/monitoring/login", request.url));
    }
    return NextResponse.next();
  }

  const isInventoryLogin = pathname === "/inventory/login";
  const isInventoryRoute =
    pathname === "/inventory" || pathname.startsWith("/inventory/");
  const isInventoryApi =
    pathname.startsWith("/api/inventory") &&
    !pathname.startsWith("/api/inventory/auth");

  if (isInventoryLogin) {
    if (inventoryAuthenticated) {
      return NextResponse.redirect(new URL("/inventory", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/inventory/auth")) {
    return NextResponse.next();
  }

  if (isInventoryApi || (isInventoryRoute && !isInventoryLogin)) {
    if (!inventoryAuthenticated) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/inventory/login", request.url));
    }
    return NextResponse.next();
  }

  const isTodoLogin = pathname === "/todos/login";
  const isTodoRoute =
    pathname === "/todos" || pathname.startsWith("/todos/");
  const isTodoApi =
    pathname.startsWith("/api/todos") &&
    !pathname.startsWith("/api/todos/auth");

  if (isTodoLogin) {
    if (todoAuthenticated) {
      return NextResponse.redirect(new URL("/todos", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/todos/auth")) {
    return NextResponse.next();
  }

  if (isTodoApi || (isTodoRoute && !isTodoLogin)) {
    if (!todoAuthenticated) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/todos/login", request.url));
    }
    return NextResponse.next();
  }

  const isChecksLogin = pathname === "/checks/login";
  const isChecksRoute =
    pathname === "/checks" || pathname.startsWith("/checks/");
  const isChecksApi =
    pathname.startsWith("/api/checks") &&
    !pathname.startsWith("/api/checks/auth");

  if (isChecksLogin) {
    if (checksAuthenticated) {
      return NextResponse.redirect(new URL("/checks", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/checks/auth")) {
    return NextResponse.next();
  }

  if (isChecksApi || (isChecksRoute && !isChecksLogin)) {
    if (!checksAuthenticated) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/checks/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/login")) {
    if (adminAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/")) {
    if (!adminAuthenticated) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
};
