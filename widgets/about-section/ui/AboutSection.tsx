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
            [PLACEHOLDER: I am a software engineer with a focus on embedded systems and payment terminals. My journey began with a curiosity for how hardware and software intersect to solve real-world problems.]
          </p>
          <p>
            [PLACEHOLDER: I believe in building robust, reliable systems that operate seamlessly under the hood. My engineering philosophy centers on simplicity, performance, and clear communication—both in code and with the people who use it.]
          </p>
          <p>
            [PLACEHOLDER: When I&apos;m not diving into firmware or optimizing system architecture, I enjoy exploring the intricacies of low-level programming and building tools that make complex data more accessible.]
          </p>
        </div>
      </div>
    </section>
  );
};
