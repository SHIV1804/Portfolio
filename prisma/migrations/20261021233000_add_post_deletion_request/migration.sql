-- AlterTable
ALTER TABLE "Post" ADD COLUMN "deletionReason" TEXT,
ADD COLUMN "deletionRequestedAt" TIMESTAMP(3);
