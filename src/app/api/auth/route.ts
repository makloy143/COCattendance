import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  destroySession,
  getSession,
  verifyCredentials,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    username: session.username,
    role: session.role,
    department: session.department,
    canResetAttendance: session.role === "SUPER_ADMIN",
    canManageAdmins: session.role === "SUPER_ADMIN",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const admin = await verifyCredentials(
      parsed.data.username,
      parsed.data.password
    );

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    await createSession(
      admin.id,
      admin.username,
      admin.role,
      admin.department
    );

    return NextResponse.json({
      success: true,
      username: admin.username,
      role: admin.role,
      department: admin.department,
      canResetAttendance: admin.role === "SUPER_ADMIN",
      canManageAdmins: admin.role === "SUPER_ADMIN",
    });
  } catch {
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ success: true });
}
