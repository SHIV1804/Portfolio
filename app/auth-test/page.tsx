"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function AuthTestPage() {
  const { data: session, status } = useSession();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "loading") {
      timer = setTimeout(() => {
        setShowError(true);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [status]);

  if (status === "loading") {
    return (
      <div className="p-8 space-y-4">
        <div className="animate-pulse">Loading session...</div>
        {showError && (
          <div className="p-4 bg-amber-900/20 border border-amber-500/50 rounded text-amber-200 text-sm">
            Something went wrong loading your session. Check the browser console for details or verify your environment variables.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">Auth Test Page</h1>
      {session ? (
        <>
          <p>
            Signed in as <span className="font-mono">{session.user?.email}</span>
          </p>
          <p>
            Admin Status:{" "}
            <span className="font-bold">
              {session.user.isAdmin ? "ADMIN" : "USER"}
            </span>
          </p>
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
