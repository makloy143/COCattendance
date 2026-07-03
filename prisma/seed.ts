import "dotenv/config";
import path from "path";
import bcrypt from "bcryptjs";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import { MONITORING_SYSTEM_CATALOG } from "../src/lib/monitoring-systems";

const databaseUrl =
  process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`;

const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
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

  console.log("Seeded default admin (username: admin, password: admin123)");
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
