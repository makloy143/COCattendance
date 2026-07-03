import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { todoUpdateSchema } from "@/lib/validations";
import { Prisma } from "@/generated/prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;

    const body = await request.json();
    const parsed = todoUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const data: Prisma.TodoUpdateInput = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.description !== undefined) {
      data.description = parsed.data.description || null;
    }
    if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
    if (parsed.data.isDone !== undefined) data.isDone = parsed.data.isDone;
    if (parsed.data.dueDate !== undefined) {
      data.dueDate = parsed.data.dueDate
        ? new Date(parsed.data.dueDate)
        : null;
    }

    const todo = await prisma.todo.update({ where: { id }, data });

    return NextResponse.json(todo);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update to-do" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireSession();
    const { id } = await context.params;

    await prisma.todo.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete to-do" },
      { status: 500 }
    );
  }
}
