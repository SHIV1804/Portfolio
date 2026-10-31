import { randomUUID } from "node:crypto";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaPg } from "@prisma/adapter-pg";
import { expect, test } from "@playwright/test";
import { PrismaClient } from "../../generated/prisma/client";

const SAFE_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "postgres"]);

function assertDisposableCiDatabase(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.toLowerCase().includes("neon")) {
    throw new Error("Prisma adapter smoke test refuses Neon and remote databases.");
  }

  const hostname = new URL(databaseUrl).hostname.toLowerCase();
  if (!SAFE_DATABASE_HOSTS.has(hostname)) {
    throw new Error(`Prisma adapter smoke test refuses database host: ${hostname}`);
  }

  return databaseUrl;
}

test("Auth.js Prisma adapter can create, read, and delete users and sessions on CI Postgres", async () => {
  test.skip(!process.env.CI, "This database integration test runs only in CI.");

  const connectionString = assertDisposableCiDatabase();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  const adapter = PrismaAdapter(prisma as never);
  const email = `prisma-adapter-${randomUUID()}@example.test`;
  const sessionToken = `prisma-adapter-${randomUUID()}`;
  let userId: string | undefined;

  try {
    const user = await adapter.createUser!({
      id: randomUUID(),
      email,
      emailVerified: null,
      name: "Prisma adapter CI smoke test",
      image: null,
    });
    userId = user.id;

    const foundUser = await adapter.getUserByEmail!(email);
    expect(foundUser?.id).toBe(user.id);

    const expires = new Date(Date.now() + 60_000);
    await adapter.createSession!({ sessionToken, userId: user.id, expires });
    const sessionAndUser = await adapter.getSessionAndUser!(sessionToken);
    expect(sessionAndUser?.user.id).toBe(user.id);
    expect(sessionAndUser?.session.sessionToken).toBe(sessionToken);

    await adapter.deleteSession!(sessionToken);
    await adapter.deleteUser!(user.id);
    userId = undefined;
  } finally {
    if (userId) {
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  }
});
