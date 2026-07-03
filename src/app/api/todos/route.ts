import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todoSchema } from "@/lib/validations";

export async function GET() {
  try {
    await requireSession();

    const todos = await prisma.todo.findMany({
      orderBy: [{ isDone: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(todos);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch to-dos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSession();

    const body = await request.json();
    const parsed = todoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const todo = await prisma.todo.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        priority: parsed.data.priority,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create to-do" },
      { status: 500 }
    );
  }
}
