import path from "path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const databaseUrl =
    process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), "dev.db")}`;

  const adapter = new PrismaBetterSqlite3({ url: databaseUrl });
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
    const cached = globalForPrisma.prisma as PrismaClient & {
      monitoringAdmin?: unknown;
    };
    if (!cached.monitoringAdmin) {
      void cached.$disconnect().catch(() => undefined);
      globalForPrisma.prisma = createPrismaClient();
    }
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = getPrismaClient();
