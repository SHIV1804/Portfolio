import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test("Prisma packages are declared once and use the same Prisma version", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url), "utf8"),
  ) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const dependencies = packageJson.dependencies ?? {};
  const devDependencies = packageJson.devDependencies ?? {};
  const overlap = Object.keys(dependencies).filter((name) => name in devDependencies);

  expect(overlap).toEqual([]);
  expect(dependencies.prisma).toBe("7.10.1");
  expect(dependencies["@prisma/client"]).toBe("7.10.1");
  expect(dependencies.dotenv).toBe("17.2.3");
  expect(devDependencies.prisma).toBeUndefined();
  expect(devDependencies.dotenv).toBeUndefined();
});
