import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/features/theme-toggle";
import { siteConfig } from "@/shared/config/site";
import { Analytics } from "@vercel/analytics/react";
import { Header } from "@/widgets/header/ui/Header";
import { Footer } from "@/widgets/footer/ui/Footer";
import { AuthProvider } from "@/shared/lib/auth-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://portfolio-theta-ruby-31nqvqjqmc.vercel.app"),
  title: `${siteConfig.name} — ${siteConfig.role}`,
  description: siteConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Runs before paint to set the correct theme class — avoids flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <ThemeProvider>
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
            <Analytics />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
