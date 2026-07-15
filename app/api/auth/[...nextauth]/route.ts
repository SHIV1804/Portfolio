import NextAuth, { DefaultSession } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { Adapter } from "next-auth/adapters";

import { prisma } from "@/shared/lib/prisma";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: { params: { scope: "read:user user:email" } },
      profile: async (profile, tokens) => {
        // Fallback for private emails
        if (!profile.email && tokens.access_token) {
          const res = await fetch("https://api.github.com/user/emails", {
            headers: { Authorization: `token \${tokens.access_token}` },
          });
          if (res.ok) {
            const emails = (await res.json()) as Array<{
              email: string;
              primary: boolean;
              verified: boolean;
              visibility: string | null;
            }>;
            profile.email = (emails.find((e) => e.primary) ?? emails[0])?.email;
          }
        }

        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.isAdmin = user.email === process.env.ADMIN_EMAIL;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
