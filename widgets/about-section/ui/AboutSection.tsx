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
            I am an Associate Software Developer with a strong interest in C++, problem-solving, and software engineering.
          </p>
          <p>
            My professional experience has helped me strengthen my C++ skills, understand existing codebases, and work on software development and testing across different projects. I enjoy analyzing technical issues, debugging problems, and finding practical solutions.
          </p>
          <p>
            I care about building things that actually work end-to-end, not just things that look finished. This site itself is an example: it syncs solved problems from GitHub through a signature-verified webhook, handles real user authentication and a moderated content-submission queue backed by a real database, and includes interactive algorithm visualizers built from hand-verified execution traces.
          </p>
          <p>
            I am continuously working to improve my programming fundamentals, data structures and algorithms, and overall software engineering skills. I am also interested in Java and C, alongside C++.
          </p>
          <p>
            My goal is to build reliable, efficient software, take ownership of challenging technical problems, and grow as a software engineer through continuous learning and hands-on experience.
          </p>
        </div>
      </div>
    </section>
  );
};
