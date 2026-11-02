export const SubmissionKind = {
  RUN: "RUN",
  SUBMIT: "SUBMIT",
} as const;

export const SubmissionStatus = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  DONE: "DONE",
  FAILED: "FAILED",
} as const;

export const SubmissionVerdict = {
  ACCEPTED: "ACCEPTED",
  WRONG_ANSWER: "WRONG_ANSWER",
  TIME_LIMIT: "TIME_LIMIT",
  MEMORY_LIMIT: "MEMORY_LIMIT",
  RUNTIME_ERROR: "RUNTIME_ERROR",
  COMPILE_ERROR: "COMPILE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type SubmissionKind = (typeof SubmissionKind)[keyof typeof SubmissionKind];
export type SubmissionStatus = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];
export type SubmissionVerdict = (typeof SubmissionVerdict)[keyof typeof SubmissionVerdict];
