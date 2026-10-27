import { getServerSession } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { authOptions } from "@/shared/lib/auth";

export async function AuthProvider({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
}
