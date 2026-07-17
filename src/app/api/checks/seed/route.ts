import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { DEFAULT_CHECK_TEMPLATES } from "@/lib/checks-shared";

export async function POST() {
  try {
    const existingAdmins = await prisma.departmentCheckAdmin.count();
    if (existingAdmins > 0) {
      return NextResponse.json(
        { error: "Checks admin already exists", seeded: false },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash("checks123", 10);

    await prisma.departmentCheckAdmin.create({
      data: {
        username: "checks",
        passwordHash,
      },
    });

    let templatesCreated = 0;

    for (const template of DEFAULT_CHECK_TEMPLATES) {
      const existing = await prisma.checkTemplate.findFirst({
        where: {
          department: template.department,
          title: template.title,
        },
      });

      if (!existing) {
        await prisma.checkTemplate.create({
          data: {
            department: template.department,
            title: template.title,
            description: template.description,
            category: template.category,
            cadence: template.cadence,
            dayOfWeek: "dayOfWeek" in template ? template.dayOfWeek : null,
            dayOfMonth: "dayOfMonth" in template ? template.dayOfMonth : null,
            sortOrder: template.sortOrder,
          },
        });
        templatesCreated += 1;
      }
    }

    return NextResponse.json({
      success: true,
      seeded: true,
      username: "checks",
      templatesCreated,
    });
  } catch (error) {
    console.error("Checks seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed checks portal" },
      { status: 500 }
    );
  }
}
