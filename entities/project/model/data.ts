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
