import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("Schema enums stay in sync with client-safe enum constants", async () => {
  const schema = await readFile(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");
  const ideVerdict = await readFile(new URL("../../shared/lib/ide-verdict.ts", import.meta.url), "utf8");

  const requiredSchemaEnums = [
    "enum SubmissionKind",
    "enum SubmissionStatus",
    "enum SubmissionVerdict",
  ];

  for (const block of requiredSchemaEnums) {
    expect(schema).toContain(block);
  }

  expect(ideVerdict).toContain("SubmissionKind");
  expect(ideVerdict).toContain("SubmissionStatus");
  expect(ideVerdict).toContain("SubmissionVerdict");
  expect(ideVerdict).toContain('ACCEPTED');
  expect(ideVerdict).toContain('WRONG_ANSWER');
  expect(ideVerdict).toContain('COMPILE_ERROR');
});
