export const PostStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type PostStatus = (typeof PostStatus)[keyof typeof PostStatus];
