import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { test, expect } from "@playwright/test";

const execFileAsync = promisify(execFile);

test("Prisma import is lazy when DATABASE_URL is unset", async () => {
  const script = `
    const { prisma } = await import('./shared/lib/prisma.ts');
    console.log('import-ok');
    try {
      void prisma.post;
      console.log('access-did-not-throw');
    } catch (error) {
      console.log(error instanceof Error ? error.message : String(error));
    }
  `;

  const { stdout } = await execFileAsync(
    process.execPath,
    ["--import", "tsx/esm", "--input-type=module", "--eval", script],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: "" },
    },
  );

  expect(stdout).toContain("import-ok");
  expect(stdout).toContain("DATABASE_URL must be set before using Prisma.");
  expect(stdout).not.toContain("access-did-not-throw");
});
