import React from "react";

interface SkillBadgeProps {
  name: string;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ name }) => {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium font-mono bg-surface-raised border border-border text-foreground-muted">
      {name}
    </span>
  );
};
