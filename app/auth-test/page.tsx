"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthTestPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Auth Test Page</h1>
      {session ? (
        <>
          <p>Signed in as <span className="font-mono">{session.user?.email}</span></p>
          <p>Admin Status: <span className="font-bold">{ session.user.isAdmin ? "ADMIN" : "USER" }</span></p>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </>
      ) : (
        <>
          <p>Not signed in</p>
          <button
            onClick={() => signIn("github")}
            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
          >
            Sign In with GitHub
          </button>
        </>
      )}
    </div>
  );
}
