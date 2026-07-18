"use client";

import React, { useEffect, useRef, useState } from "react";

export const HeroSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const beatsRef = useRef<(HTMLDivElement | null)[]>([]);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
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
        if (containerRef.current && parallaxRef.current) {
          const validBeats = beatsRef.current.filter((b): b is HTMLDivElement => b !== null);
          initHeroAnimations(containerRef.current, validBeats, parallaxRef.current);
        }
      };
      loadAnimations();
    }

    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const storyBeats = [
    {
      id: 1,
      title: "Precision at the Edge",
      content: "A software engineer building real systems from the ground up — from solving 120+ algorithmic problems on LeetCode to shipping full-stack features with real infrastructure behind them."
    },
    {
      id: 2,
      title: "Scale and Reliability",
      content: "This site's own DSA sync runs on a GitHub webhook with HMAC-SHA256 signature verification — rejecting any unverified request before it touches the database — plus rate limiting and graceful fallback states when external calls fail."
    },
    {
      id: 3,
      title: "The Human Element",
      content: "The blog isn't just static writing — visitors can sign in with GitHub and submit posts through a real moderation queue, with every submission reviewed before it goes live. Real auth, real database, real human review."
    },
    {
      id: 4,
      title: "Building the Future",
      content: "[PLACEHOLDER: bio content pending owner review]"
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

      <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center py-20 md:py-0">
        <div className="w-full max-w-4xl relative md:min-h-[400px] space-y-32 md:space-y-0">
          {storyBeats.map((beat, index) => (
            <div
              key={beat.id}
              ref={(el) => { beatsRef.current[index] = el; }}
              className={`flex flex-col justify-center space-y-6 md:absolute md:inset-0 ${
                index === 0 ? "relative opacity-100" : "opacity-0 md:pointer-events-auto"
              }`}
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
