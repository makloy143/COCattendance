import { NextRequest, NextResponse } from "next/server";
import {
  createChecksSession,
  destroyChecksSession,
  verifyChecksCredentials,
} from "@/lib/checks-auth";
import { loginSchema } from "@/lib/validations";

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

    const admin = await verifyChecksCredentials(
      parsed.data.username,
      parsed.data.password
    );

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    await createChecksSession(admin.id, admin.username);

    return NextResponse.json({ success: true, username: admin.username });
  } catch (error) {
    console.error("Checks login error:", error);
    const message =
      error instanceof Error && error.message.includes("AUTH_SECRET")
        ? "Server auth is not configured"
        : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  await destroyChecksSession();
  return NextResponse.json({ success: true });
}
