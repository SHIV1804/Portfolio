import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://portfolio-theta-ruby-31nqvqjqmc.vercel.app/sitemap.xml",
  };
}
