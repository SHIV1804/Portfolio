import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

type PrismaClientSingleton = PrismaClient;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

let localPrisma: PrismaClientSingleton | undefined;

function getPrismaClient(): PrismaClientSingleton {
  if (localPrisma) return localPrisma;

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set before using Prisma.");
  }

  localPrisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = localPrisma;
  }

  return localPrisma;
}

/**
 * Defer client construction until a Prisma property is accessed so importing
 * this module does not require DATABASE_URL during static builds.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
