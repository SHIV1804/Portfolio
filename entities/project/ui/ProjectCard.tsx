import React from "react";
import Link from "next/link";

interface ProjectCardProps {
  title: string;
  description: string;
  tags?: string[];
  href?: string;
  isPlaceholder?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  tags = [],
  href,
  isPlaceholder = false,
}) => {
  const isInternal = href?.startsWith("/");
  const content = (
    <div className="flex flex-col h-full">
      <h3 className={`text-lg font-bold mb-2 ${href ? "group-hover:text-accent" : ""}`}>
        {title}
      </h3>
      <p className="text-foreground-muted text-sm mb-4 flex-grow">
        {description}
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono uppercase tracking-wider text-foreground-faint"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {isPlaceholder && (
        <div className="mt-4">
          <span className="text-xs font-mono text-accent uppercase tracking-widest">
            [ Coming Soon ]
          </span>
        </div>
      )}
    </div>
  );

  const className = `block p-6 rounded-lg border border-border bg-surface transition-colors ${
    href ? "hover:border-accent group" : ""
  } ${isPlaceholder ? "opacity-60" : ""}`;

  if (isInternal && href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
};
