import React from "react";
import { ProjectCard } from "@/entities/project/ui/ProjectCard";

export const ProjectsPreview: React.FC = () => {
  return (
    <section id="projects" className="py-20 md:py-32 border-t border-border">
      <h2 className="text-sm font-mono text-accent uppercase tracking-widest mb-12">
        04. Selected Projects
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProjectCard
          title="Log Analyser"
          description="A high-performance C++ utility for transaction-flow analysis in production environments. Processes 100k+ line logs in sub-second time."
          tags={["C++", "mmap", "Regex", "Systems"]}
          href="/projects/log-analyser"
        />
        <ProjectCard
          title="Second project"
          description="[PLACEHOLDER — project not yet selected]"
          href="/projects/case-study-two"
          isPlaceholder={true}
        />
      </div>
    </section>
  );
};
