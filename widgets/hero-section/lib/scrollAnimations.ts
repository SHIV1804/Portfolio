import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const initHeroAnimations = (
  container: HTMLElement,
  beats: HTMLElement[],
  parallaxLayer: HTMLElement
) => {
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  // Desktop animation (pinned sequence)
  mm.add("(min-width: 768px)", () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "+=300%", // 300% of viewport height for the sequence
        pin: true,
        scrub: 1,
        anticipatePin: 1,
      },
    });

    // Initial state: first beat visible, others hidden
    gsap.set(beats.slice(1), { opacity: 0, y: 50 });

    // Animate through beats
    beats.forEach((beat, index) => {
      if (index === 0) {
        // First beat fades out
        tl.to(beat, { opacity: 0, y: -50, duration: 1 }, "+=0.5");
      } else if (index === beats.length - 1) {
        // Last beat fades in and stays
        tl.to(beat, { opacity: 1, y: 0, duration: 1 });
      } else {
        // Middle beats fade in then out
        tl.to(beat, { opacity: 1, y: 0, duration: 1 })
          .to(beat, { opacity: 0, y: -50, duration: 1 }, "+=0.5");
      }
    });

    // Parallax effect
    gsap.to(parallaxLayer, {
      yPercent: -20,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  });

  // Mobile animation (simple reveals)
  mm.add("(max-width: 767px)", () => {
    beats.forEach((beat, index) => {
      // Skip animation for first beat on mobile as it's already visible
      if (index === 0) return;

      gsap.fromTo(beat, 
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: beat,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  });
};
