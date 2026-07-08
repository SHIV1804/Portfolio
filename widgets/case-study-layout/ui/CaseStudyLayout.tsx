"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";

interface CaseStudyLayoutProps {
  title: string;
  subtitle: string;
  problem: React.ReactNode;
  constraints: React.ReactNode;
  architecture: React.ReactNode;
  architectureDiagram?: React.ReactNode;
  decisions: React.ReactNode;
  metrics: React.ReactNode;
  differently: React.ReactNode;
}

export const CaseStudyLayout: React.FC<CaseStudyLayoutProps> = ({
  title,
  subtitle,
  problem,
  constraints,
  architecture,
  architectureDiagram,
  decisions,
  metrics,
  differently,
}) => {
  useEffect(() => {
    track("case_study_viewed", { title });
  }, [title]);

  return (
    <article className="max-w-4xl mx-auto py-20 px-4">
      <Link
        href="/#projects"
        className="text-sm font-mono text-accent hover:underline mb-8 inline-block"
      >
        ← Back to Projects
      </Link>

      <header className="mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
        <p className="text-xl text-foreground-muted">{subtitle}</p>
      </header>

      <div className="space-y-24">
        <section className="space-y-4">
          <h2 className="text-sm font-mono text-accent uppercase tracking-widest border-b border-border pb-2">
            01. Problem
          </h2>
          <div className="text-lg leading-relaxed text-foreground-muted">
            {problem}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-mono text-accent uppercase tracking-widest border-b border-border pb-2">
            02. Constraints
          </h2>
          <div className="text-lg leading-relaxed text-foreground-muted">
            {constraints}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-mono text-accent uppercase tracking-widest border-b border-border pb-2">
            03. Architecture
          </h2>
          <div className="text-lg leading-relaxed text-foreground-muted mb-8">
            {architecture}
          </div>
          {architectureDiagram && (
            <div className="bg-surface-raised border border-border rounded-lg p-8 flex items-center justify-center min-h-[300px]">
              {architectureDiagram}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-mono text-accent uppercase tracking-widest border-b border-border pb-2">
            04. Key Decisions & Trade-offs
          </h2>
          <div className="text-lg leading-relaxed text-foreground-muted">
            {decisions}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-mono text-accent uppercase tracking-widest border-b border-border pb-2">
            05. Metrics
          </h2>
          <div className="text-lg leading-relaxed text-foreground-muted">
            {metrics}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-mono text-accent uppercase tracking-widest border-b border-border pb-2">
            06. What I&apos;d Do Differently
          </h2>
          <div className="text-lg leading-relaxed text-foreground-muted">
            {differently}
          </div>
        </section>
      </div>
    </article>
  );
};
