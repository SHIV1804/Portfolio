import React from "react";
import { Metadata } from "next";
import { CaseStudyLayout } from "@/widgets/case-study-layout/ui/CaseStudyLayout";
export const metadata: Metadata = {
  title: "Project Omega Case Study | Software Engineer Portfolio",
  description: "Coming soon: A detailed look at a new system architecture for distributed edge devices.",
  openGraph: {
    title: "Project Omega | Shivam Portfolio",
    description: "Coming soon: A detailed look at a new system architecture for distributed edge devices.",
    url: "https://portfolio-shivam.vercel.app/projects/case-study-two",
    images: [{ url: "/og-project-omega.png" }], // [PLACEHOLDER: OG image]
    type: "article",
  },
};

export default function CaseStudyTwoPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        <CaseStudyLayout
          title="Project Omega"
          subtitle="[TBD — project not yet selected]"
          problem={<p>[TBD — project not yet selected]</p>}
          constraints={<p>[TBD — project not yet selected]</p>}
          architecture={<p>[TBD — project not yet selected]</p>}
          decisions={<p>[TBD — project not yet selected]</p>}
          metrics={<p>[TBD — project not yet selected]</p>}
          differently={<p>[TBD — project not yet selected]</p>}
        />
      </main>
    </div>
  );
}
