'use client';

import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const WritePostButton = () => {
  const { data: session } = useSession();

  const handleClick = async () => {
    if (!session) {
      await signIn('github');
    }
  };

  if (session) {
    return (
      <Link
        href="/blog/write"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-background hover:bg-accent/90 transition-colors font-medium text-sm"
      >
        <Plus className="w-4 h-4" />
        Write a Post
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-accent text-background hover:bg-accent/90 transition-colors font-medium text-sm"
    >
      <Plus className="w-4 h-4" />
      Write a Post
    </button>
  );
};
