import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { expect, test } from "@playwright/test";

const SAFE_DATABASE_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "postgres"]);

function assertDisposableCiDatabase(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.toLowerCase().includes("neon")) {
    throw new Error("Submission model smoke test refuses Neon and remote databases.");
  }

  const hostname = new URL(databaseUrl).hostname.toLowerCase();
  if (!SAFE_DATABASE_HOSTS.has(hostname)) {
    throw new Error(`Submission model smoke test refuses database host: ${hostname}`);
  }

  return databaseUrl;
}

test("Submission model supports CRUD and unique clientRequestId constraints on CI Postgres", async () => {
  test.skip(!process.env.CI, "This database integration test runs only in CI.");

  const connectionString = assertDisposableCiDatabase();
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const user = await prisma.user.create({
    data: {
      email: `submission-${randomUUID()}@example.test`,
      name: "Submission model smoke test",
    },
  });

  const requestId = `req-${randomUUID()}`;
  const submission = await prisma.submission.create({
    data: {
      userId: user.id,
      problemKey: "sliding-window/max-sum-subarray",
      language: "cpp",
      kind: "RUN",
      status: "QUEUED",
      verdict: "ACCEPTED",
      code: "int main() { return 0; }",
      stdin: "",
      testsPassed: 1,
      testsTotal: 1,
      timeMs: 10,
      memoryKb: 2048,
      stdoutTrunc: "ok",
      stderrTrunc: "",
      compileOutputTrunc: "",
      clientRequestId: requestId,
    },
  });

  const found = await prisma.submission.findUnique({
    where: { id: submission.id },
  });
  expect(found?.problemKey).toBe("sliding-window/max-sum-subarray");

  const duplicates = prisma.submission.create({
    data: {
      userId: user.id,
      problemKey: "sliding-window/max-sum-subarray",
      language: "cpp",
      kind: "RUN",
      status: "QUEUED",
      verdict: null,
      code: "int main() { return 0; }",
      clientRequestId: requestId,
    },
  });

  await expect(duplicates).rejects.toThrow();

  await prisma.submission.delete({ where: { id: submission.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
});
