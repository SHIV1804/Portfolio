export interface Project {
  slug: string;
  title: string;
  description: string;
  tags?: string[];
  href: string;
  isPlaceholder?: boolean;
}

export const projects: Project[] = [
  {
    slug: "log-analyser",
    title: "Log Analyser",
    // VERIFIED: "planned... architecture design in progress" and the
    // "Concept" tag are accurate — confirmed via GitHub API query against
    // the real account (SHIV1804), no matching implementation exists
    // anywhere. See ../../CONTENT_VERIFICATION_PROGRESS.md, Step 2, finding #20.
    description:
      "A planned C++ tool for parsing and analyzing production log files — architecture design in progress.",
    tags: ["C++", "Systems", "Concept"],
    href: "/projects/log-analyser",
  },
  {
    slug: "case-study-two",
    title: "Second project",
    description: "[PLACEHOLDER — project not yet selected]",
    href: "/projects/case-study-two",
    isPlaceholder: true,
  },
];
