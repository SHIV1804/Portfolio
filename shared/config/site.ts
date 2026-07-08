export const siteConfig = {
  name: "Shivam",
  role: "Software Engineer",
  description:
    "Systems-minded software engineer building production payment terminal software.",
  links: {
    email: "mailto:you@example.com",
    linkedin: "https://linkedin.com/in/your-handle",
    github: "https://github.com/your-handle",
  },
  nav: [
    { label: "About", href: "/#about" },
    { label: "Skills", href: "/#skills" },
    { label: "Experience", href: "/#experience" },
    { label: "Projects", href: "/#projects" },
    { label: "Contact", href: "/#contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
