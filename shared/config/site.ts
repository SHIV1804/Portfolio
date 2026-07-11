export const siteConfig = {
  name: "Shivam",
  role: "Software Engineer",
  description:
    "Systems-minded software engineer building production payment terminal software.",
  links: {
    email: "mailto:you@example.com",
    linkedin: "https://linkedin.com/in/your-handle",
    github: "https://github.com/SHIV1804",
  },
  nav: [
    { label: "About", href: "/#about" },
    { label: "Skills", href: "/#skills" },
    { label: "Experience", href: "/#experience" },
    { label: "Projects", href: "/#projects" },
    { label: "GitHub", href: "/#github" },
    { label: "Blog", href: "/blog" },
    { label: "DSA", href: "/dsa" },
    { label: "Contact", href: "/#contact" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
