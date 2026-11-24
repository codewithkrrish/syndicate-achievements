import { PrismaClient } from "@prisma/client";

// Single PrismaClient for the whole app. In development, Next.js hot-reload
// would otherwise spawn a new client (and a new connection pool) per reload,
// so the instance is cached on globalThis. In production this is a no-op
// safeguard — one process, one client.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
