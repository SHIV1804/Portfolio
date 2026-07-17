'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WritePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Client-side validation
    if (title.length < 5 || title.length > 100) {
      setError('Title must be between 5 and 100 characters');
      setIsSubmitting(false);
      return;
    }

    if (content.length < 50) {
      setError('Content must be at least 50 characters');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit post');
      }

      setIsSuccess(true);
      setTitle('');
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-foreground-muted font-mono">Loading session...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <div className="bg-surface border border-border p-12 rounded-lg text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Submission Received</h1>
          <p className="text-foreground-muted mb-8 max-w-md mx-auto">
            Your post has been submitted for review. An administrator will verify the content before it is published.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/blog"
              className="px-6 py-2 rounded-md bg-accent text-background hover:bg-accent/90 transition-colors font-medium"
            >
              Back to Blog
            </Link>
            <button
              onClick={() => setIsSuccess(false)}
              className="px-6 py-2 rounded-md border border-border hover:bg-surface transition-colors font-medium"
            >
              Write Another
            </button>
          </div>
        </div>
      </main>
    );
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

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-md flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title Field */}
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Title <span className="text-accent">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title (5-100 characters)..."
            className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Content Field */}
        <div className="space-y-2">
          <label htmlFor="content" className="block text-sm font-medium text-foreground">
            Content (Markdown) <span className="text-accent">*</span>
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your post in markdown (min 50 characters)..."
            className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent font-mono text-sm resize-vertical min-h-96"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-md bg-accent text-background hover:bg-accent/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit for Review'
            )}
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
