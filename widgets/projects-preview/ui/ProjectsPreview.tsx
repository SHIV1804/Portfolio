import React from "react";
import { ProjectCard } from "@/entities/project/ui/ProjectCard";
import { projects } from "@/entities/project/model/data";

export const ProjectsPreview: React.FC = () => {
  return (
    <section id="projects" className="py-20 md:py-32 border-t border-border">
      <h2 className="text-sm font-mono text-accent uppercase tracking-widest mb-12">
        04. Selected Projects
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project) => (
          <ProjectCard
            key={project.slug}
            title={project.title}
            description={project.description}
            tags={project.tags}
            href={project.href}
            isPlaceholder={project.isPlaceholder}
          />
        ))}
      </div>
    </section>
  );
};

