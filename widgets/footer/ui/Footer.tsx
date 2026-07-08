import React from "react";
import { siteConfig } from "@/shared/config/site";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-surface-raised py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h3 className="font-bold text-foreground">{siteConfig.name}</h3>
            <p className="text-sm text-foreground-muted max-w-xs">
              {siteConfig.description}
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex gap-6">
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground-muted hover:text-accent transition-colors"
              >
                GitHub
              </a>
              <a
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground-muted hover:text-accent transition-colors"
              >
                LinkedIn
              </a>
              <a
                href={siteConfig.links.email}
                className="text-sm font-medium text-foreground-muted hover:text-accent transition-colors"
              >
                Email
              </a>
            </div>
            <p className="text-xs text-foreground-faint font-mono">
              &copy; {currentYear} {siteConfig.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
