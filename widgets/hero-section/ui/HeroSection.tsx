"use client";

import React, { useEffect, useRef, useState } from "react";

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const beatsRef = useRef<(HTMLDivElement | null)[]>([]);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanupAnimations: (() => void) | undefined;
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);

    if (!mediaQuery.matches) {
      // Lazy load GSAP
      const loadAnimations = async () => {
        const { initHeroAnimations } = await import("../lib/scrollAnimations");
        if (!disposed && containerRef.current && parallaxRef.current) {
          const validBeats = beatsRef.current.filter((b): b is HTMLDivElement => b !== null);
          cleanupAnimations = initHeroAnimations(
            containerRef.current,
            validBeats,
            parallaxRef.current,
          );
        }
      };
      loadAnimations();
    }

    return () => {
      disposed = true;
      mediaQuery.removeEventListener("change", handler);
      cleanupAnimations?.();
    };
  }, []);

  const storyBeats = [
    {
      id: 1,
      title: "Precision at the Edge",
      content: "[PLACEHOLDER: story beat 1 - focus on embedded systems and payment terminals]",
    },
    {
      id: 2,
      title: "Scale and Reliability",
      content: "[PLACEHOLDER: story beat 2 - processing millions of transactions daily]",
    },
    {
      id: 3,
      title: "The Human Element",
      content: "[PLACEHOLDER: story beat 3 - solving real-world problems for enterprise retail]",
    },
    {
      id: 4,
      title: "Building the Future",
      content: "[PLACEHOLDER: story beat 4 - your engineering philosophy and vision]",
    },
  ];

  if (prefersReducedMotion) {
    return (
      <section className="relative w-full py-24 px-4 overflow-hidden bg-background">
        <div className="container mx-auto max-w-4xl space-y-32">
          {storyBeats.map((beat) => (
            <div key={beat.id} className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-accent">
                {beat.title}
              </h2>
              <p className="text-xl md:text-2xl text-foreground-muted leading-relaxed max-w-2xl">
                {beat.content}
              </p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen overflow-hidden bg-background"
    >
      {/* Parallax Background Layer */}
      <div
        ref={parallaxRef}
        className="absolute inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, var(--accent) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
        <div className="w-full max-w-4xl relative min-h-[400px]">
          {storyBeats.map((beat, index) => (
            <div
              key={beat.id}
              ref={(el) => { beatsRef.current[index] = el; }}
              className={`absolute inset-0 flex flex-col justify-center space-y-6 ${
                index === 0 ? "relative" : "opacity-0 pointer-events-none md:pointer-events-auto"
              } md:opacity-100`}
            >
              <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-accent leading-none">
                {beat.title}
              </h1>
              <p className="text-xl md:text-3xl text-foreground-muted leading-relaxed max-w-2xl font-sans">
                {beat.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-50">
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground-faint">Scroll</span>
        <div className="w-px h-8 bg-accent/50" />
      </div>
    </section>
  );
};
