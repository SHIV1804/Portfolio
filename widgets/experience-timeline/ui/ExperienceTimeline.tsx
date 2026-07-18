import React from "react";

interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  description: string;
}

const experiences: ExperienceItem[] = [
  {
    company: "Payment Technology Company (name withheld)",
    role: "Associate Software Developer",
    period: "Oct 2025 — Present",
    description:
      "Building software for Verifone payment terminal devices, working with clients in the US and UK. Collaborate with cross-functional teams and communicate directly with clients to ensure delivered software meets quality expectations.",
  },
];

export const ExperienceTimeline: React.FC = () => {
  return (
    <section id="experience" className="py-20 md:py-32 border-t border-border">
      <h2 className="text-sm font-mono text-accent uppercase tracking-widest mb-12">
        03. Experience
      </h2>
      <div className="space-y-12">
        {experiences.map((exp, index) => (
          <div key={index} className="relative pl-8 border-l-2 border-border">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-accent border-4 border-background" />
            <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-4">
              <h3 className="text-xl font-bold">{exp.role}</h3>
              <span className="text-sm font-mono text-foreground-faint">
                {exp.period}
              </span>
            </div>
            <p className="text-accent font-medium mb-4">{exp.company}</p>
            <p className="text-foreground-muted leading-relaxed max-w-2xl">
              {exp.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
