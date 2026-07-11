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
    description:
      "A C++ tool for parsing and analyzing production log files at scale.",
    tags: ["C++", "Systems"],
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
