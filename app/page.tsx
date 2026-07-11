import { Header } from "@/widgets/header/ui/Header";
import { HeroSection } from "@/widgets/hero-section/ui/HeroSection";
import { AboutSection } from "@/widgets/about-section/ui/AboutSection";
import { SkillsGrid } from "@/widgets/skills-section/ui/SkillsGrid";
import { ExperienceTimeline } from "@/widgets/experience-timeline/ui/ExperienceTimeline";
import { ProjectsPreview } from "@/widgets/projects-preview/ui/ProjectsPreview";
import { GitHubStats } from "@/widgets/github-stats";
import { Footer } from "@/widgets/footer/ui/Footer";
import { ContactForm } from "@/features/contact-form/ui/ContactForm";

export const metadata = {
  title: "Shivam | Systems Engineer Portfolio",
  description: "Systems-minded software engineer building production payment terminal software and high-performance C++ tools.",
  openGraph: {
    title: "Shivam | Systems Engineer Portfolio",
    description: "Systems-minded software engineer building production payment terminal software and high-performance C++ tools.",
    url: "https://portfolio-shivam.vercel.app",
    siteName: "Shivam Portfolio",
    images: [
      {
        url: "/og-image.png", // [PLACEHOLDER: OG image]
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Shivam",
    jobTitle: "Software Engineer",
    url: "https://portfolio-shivam.vercel.app",
    sameAs: [
      "https://github.com/your-handle",
      "https://linkedin.com/in/your-handle",
    ],
  };

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-grow">
        <div className="container mx-auto px-4">
          <HeroSection />
          <AboutSection />
          <SkillsGrid />
          <ExperienceTimeline />
          <ProjectsPreview />
          
          <section id="github" className="py-24 scroll-mt-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12">GitHub Activity</h2>
            <GitHubStats />
          </section>
        </div>
        
        <section id="contact" className="py-24 bg-surface/50 border-t border-border mt-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Get in touch</h2>
              <p className="text-lg text-foreground-muted">
                Have a project in mind or just want to say hi? Feel free to reach out.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
