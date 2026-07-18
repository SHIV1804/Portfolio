import React from "react";

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 md:py-32">
      <div className="max-w-3xl">
        <h2 className="text-sm font-mono text-accent uppercase tracking-widest mb-4">
          01. About Me
        </h2>
        <div className="space-y-6 text-lg leading-relaxed text-foreground-muted">
          <p>
            I&apos;m a software engineer focused on full-stack web development and algorithmic problem-solving. My background is in computer science fundamentals — data structures, database systems, and object-oriented design — and I&apos;ve solved over 120 problems on LeetCode across Java, C++, and C, with particular depth in arrays, hash tables, and two-pointer techniques.
          </p>
          <p>
            I care about building things that actually work end-to-end, not just things that look finished. This site itself is an example: it syncs solved problems from GitHub through a signature-verified webhook, handles real user authentication and a moderated content-submission queue backed by a real database, and includes interactive algorithm visualizers built from hand-verified execution traces.
          </p>
          <p>
            [PERSONAL VOICE — OWNER SHOULD REVIEW/ADJUST THIS PARAGRAPH, IT IS A DRAFT: I&apos;m early in my career and still building — currently working through coursework in database systems and Java, and using projects like this portfolio to practice building real, production-shaped systems rather than isolated exercises.]
          </p>
        </div>
      </div>
    </section>
  );
};
