'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function WritePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { title, content });
    // TODO: Implement database write logic in Chunk 1b
  };

  if (status === 'loading') {
    return (
      <main className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <div className="text-center">
          <p className="text-foreground-muted">Loading...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Write a Post</h1>
        <p className="text-foreground-muted">
          Share your thoughts and insights with the community.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title Field */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            required
          />
        </div>

        {/* Content Field */}
        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium text-foreground">
            Content (Markdown)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post in markdown..."
            className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent font-mono text-sm resize-vertical min-h-96"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-md bg-accent text-background hover:bg-accent/90 transition-colors font-medium"
          >
            Publish Post
          </button>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-2 rounded-md border border-border bg-background text-foreground hover:bg-surface transition-colors font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </main>
  );
}
