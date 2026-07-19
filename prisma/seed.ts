import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { MONITORING_SYSTEM_CATALOG } from "../src/lib/monitoring-systems";
import { DEFAULT_CHECK_TEMPLATES } from "../src/lib/checks-shared";
import { DEFAULT_ATTENDANCE_DEPARTMENTS } from "../src/lib/departments";
import { DEFAULT_STUDENT_ASSIGNMENTS } from "../src/lib/student-assignment";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const [index, department] of DEFAULT_ATTENDANCE_DEPARTMENTS.entries()) {
    await prisma.attendanceDepartmentOption.upsert({
      where: { code: department.code },
      update: { label: department.label, sortOrder: index, isActive: true },
      create: {
        code: department.code,
        label: department.label,
        sortOrder: index,
      },
    });
  }

  for (const [index, assignment] of DEFAULT_STUDENT_ASSIGNMENTS.entries()) {
    await prisma.studentAssignmentOption.upsert({
      where: { code: assignment.code },
      update: { label: assignment.label, sortOrder: index, isActive: true },
      create: {
        code: assignment.code,
        label: assignment.label,
        sortOrder: index,
      },
    });
  }

  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.admin.upsert({
    where: { username: "admin" },
    update: { department: "ITSD" },
    create: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
      department: "ITSD",
    },
  });

  const superAdminPasswordHash = await bcrypt.hash("superadmin123", 10);

  await prisma.admin.upsert({
    where: { username: "superadmin" },
    update: { role: "SUPER_ADMIN", department: null },
    create: {
      username: "superadmin",
      passwordHash: superAdminPasswordHash,
      role: "SUPER_ADMIN",
      department: null,
    },
  });

  const registrarPasswordHash = await bcrypt.hash("registrar123", 10);

  await prisma.admin.upsert({
    where: { username: "registrar" },
    update: { department: "REGISTRAR", role: "ADMIN" },
    create: {
      username: "registrar",
      passwordHash: registrarPasswordHash,
      role: "ADMIN",
      department: "REGISTRAR",
    },
  });

  const inventoryPasswordHash = await bcrypt.hash("inventory123", 10);

  await prisma.inventoryAdmin.upsert({
    where: { username: "inventory" },
    update: {},
    create: {
      username: "inventory",
      passwordHash: inventoryPasswordHash,
    },
  });

  console.log("Seeded default admin (username: admin, password: admin123, department: ITSD)");
  console.log(
    "Seeded super admin (username: superadmin, password: superadmin123)"
  );
  console.log(
    "Seeded registrar admin (username: registrar, password: registrar123, department: REGISTRAR)"
  );
  console.log(
    "Seeded inventory admin (username: inventory, password: inventory123)"
  );

  const monitoringPasswordHash = await bcrypt.hash("monitoring123", 10);

  await prisma.monitoringAdmin.upsert({
    where: { username: "monitoring" },
    update: {},
    create: {
      username: "monitoring",
      passwordHash: monitoringPasswordHash,
    },
  });

  console.log(
    "Seeded monitoring admin (username: monitoring, password: monitoring123)"
  );

  const todoPasswordHash = await bcrypt.hash("todo123", 10);

  await prisma.todoAdmin.upsert({
    where: { username: "todo" },
    update: {},
    create: {
      username: "todo",
      passwordHash: todoPasswordHash,
    },
  });

  console.log("Seeded todo admin (username: todo, password: todo123)");

  const checksPasswordHash = await bcrypt.hash("checks123", 10);

  await prisma.departmentCheckAdmin.upsert({
    where: { username: "checks" },
    update: {},
    create: {
      username: "checks",
      passwordHash: checksPasswordHash,
    },
  });

  console.log("Seeded checks admin (username: checks, password: checks123)");

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
    }
  }

  console.log(`Seeded ${DEFAULT_CHECK_TEMPLATES.length} default check schedules`);

  for (const system of MONITORING_SYSTEM_CATALOG) {
    await prisma.monitoringSystem.upsert({
      where: {
        category_name: {
          category: system.category,
          name: system.name,
        },
      },
      update: {
        accountNo: system.accountNo ?? null,
        sortOrder: system.sortOrder,
      },
      create: {
        name: system.name,
        category: system.category,
        accountNo: system.accountNo ?? null,
        sortOrder: system.sortOrder,
      },
    });
  }

  console.log(`Seeded ${MONITORING_SYSTEM_CATALOG.length} monitoring systems`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
