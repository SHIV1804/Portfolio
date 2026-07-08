import React from "react";
import { SkillBadge } from "@/entities/skill/ui/SkillBadge";

interface SkillGroup {
  title: string;
  skills: string[];
}

const skillGroups: SkillGroup[] = [
  {
    title: "Languages",
    skills: ["TypeScript", "JavaScript", "C", "C++", "Rust", "Python"],
  },
  {
    title: "Domain Expertise",
    skills: [
      "Embedded Systems",
      "Payment Terminals",
      "Firmware Development",
      "Real-time Operating Systems",
      "Network Protocols",
    ],
  },
  {
    title: "Tools & Practices",
    skills: [
      "Git",
      "Docker",
      "CI/CD",
      "Unit Testing",
      "System Architecture",
      "Agile Methodology",
    ],
  },
];

export const SkillsGrid: React.FC = () => {
  return (
    <section id="skills" className="py-20 md:py-32 border-t border-border">
      <h2 className="text-sm font-mono text-accent uppercase tracking-widest mb-12">
        02. Skills & Expertise
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {skillGroups.map((group) => (
          <div key={group.title} className="space-y-6">
            <h3 className="text-lg font-bold border-b border-border pb-2">
              {group.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <SkillBadge key={skill} name={skill} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
