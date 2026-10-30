'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check, X, AlertCircle, Calendar, User } from 'lucide-react';
import { PostStatus } from '@/generated/prisma/client';

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name: string | null;
    email: string | null;
  };
}

interface DeletionRequest {
  id: string;
  title: string;
  slug: string;
  deletionReason: string | null;
  deletionRequestedAt: string;
  author: {
    name: string | null;
    email: string | null;
  };
}

export default function AdminPostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/posts');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch posts');
      setPosts(data.posts);
      setDeletionRequests(data.deletionRequests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    } else if (status === 'authenticated' && session?.user?.isAdmin) {
      const frame = requestAnimationFrame(() => fetchPosts());
      return () => cancelAnimationFrame(frame);
    }
  }, [status, session, router, fetchPosts]);

  const handleAction = async (id: string, newStatus: PostStatus) => {
    if (newStatus === PostStatus.REJECTED && !window.confirm('Are you sure you want to reject this post?')) {
      return;
    }

    try {
      setActionLoading(id);
      const url = `/api/admin/posts/${id}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Action failed');
      
      // Optimistic UI update
      setPosts(prev => prev.filter(post => post.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletionDecision = async (id: string, decision: 'approve' | 'deny') => {
    if (decision === 'approve' && !window.confirm('Permanently delete this post?')) {
      return;
    }

    try {
      setActionLoading(`deletion-${id}`);
      const response = await fetch(`/api/admin/posts/${id}/deletion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Deletion decision failed');
      await fetchPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deletion decision failed');
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && session?.user?.isAdmin && isLoading)) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
        <p className="text-foreground-muted font-mono">Loading dashboard...</p>
      </div>
    );
  }

  if (status === 'authenticated' && !session?.user?.isAdmin) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/50 p-12 rounded-lg text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-foreground-muted mb-8">
            You do not have the required permissions to access this page. This area is reserved for administrators only.
          </p>
          <Link
            href="/blog"
            className="px-6 py-2 rounded-md bg-accent text-background hover:bg-accent/90 transition-colors font-medium"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Moderation Dashboard</h1>
          <p className="text-foreground-muted">
            Review and manage pending blog post submissions.
          </p>
        </div>
        <div className="bg-surface border border-border px-4 py-2 rounded-md text-sm font-mono">
          <span className="text-accent">{posts.length}</span> Pending Posts
        </div>
      </header>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-md flex items-center gap-3 text-red-500">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-lg">
          <p className="text-foreground-muted italic">No pending posts to review.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-mono text-foreground-muted">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {post.author.name || post.author.email}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-3">{post.title}</h2>
                <div className="text-foreground-muted text-sm line-clamp-3 font-mono whitespace-pre-wrap">
                  {post.content}
                </div>
              </div>
              
              <div className="border-t border-border bg-background/50 p-4 flex justify-end gap-3">
                <button
                  onClick={() => handleAction(post.id, PostStatus.REJECTED)}
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleAction(post.id, PostStatus.APPROVED)}
                  disabled={!!actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading === post.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="mt-16" aria-labelledby="deletion-requests-heading">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 id="deletion-requests-heading" className="text-2xl font-bold">Deletion requests</h2>
          <span className="text-sm font-mono text-foreground-muted">
            {deletionRequests.length} Requested
          </span>
        </div>
        {deletionRequests.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <p className="text-foreground-muted italic">No deletion requests to review.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {deletionRequests.map((request) => (
              <article key={request.id} className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-foreground-muted">
                    <span>{request.author.name || request.author.email || 'Anonymous'}</span>
                    <span>{new Date(request.deletionRequestedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-xl font-bold">
                    <Link href={`/blog/${request.slug}`} className="hover:text-accent transition-colors">
                      {request.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-foreground-muted whitespace-pre-wrap">
                    {request.deletionReason || 'No reason provided.'}
                  </p>
                </div>
                <div className="border-t border-border bg-background/50 p-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => handleDeletionDecision(request.id, 'deny')}
                    disabled={!!actionLoading}
                    className="px-4 py-1.5 rounded-md border border-border hover:border-accent transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Deny
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletionDecision(request.id, 'approve')}
                    disabled={!!actionLoading}
                    className="px-4 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {actionLoading === `deletion-${request.id}` ? 'Deleting…' : 'Approve deletion'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
