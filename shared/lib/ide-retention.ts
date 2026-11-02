import { prisma } from "@/shared/lib/prisma";

export const IDE_SUBMISSION_RETENTION_DAYS = "IDE_SUBMISSION_RETENTION_DAYS";

export async function deleteExpiredRunSubmissions(options?: {
  retentionDays?: number;
}) {
  const retentionDays = options?.retentionDays ?? Number(process.env[IDE_SUBMISSION_RETENTION_DAYS] ?? 14);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  return prisma.submission.deleteMany({
    where: {
      kind: "RUN",
      createdAt: { lt: cutoff },
    },
  });
}
