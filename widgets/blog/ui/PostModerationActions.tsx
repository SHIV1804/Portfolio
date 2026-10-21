'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

interface PostModerationActionsProps {
  postId: string;
}

type DeletionRole = 'none' | 'admin' | 'author';

export const PostModerationActions = ({ postId }: PostModerationActionsProps) => {
  const { status } = useSession();
  const router = useRouter();
  const [role, setRole] = useState<DeletionRole>('none');
  const [requested, setRequested] = useState(false);
  const [reason, setReason] = useState('');
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    let cancelled = false;
    const loadStatus = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/deletion-request`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Unable to load deletion status');
        }
        if (!cancelled) {
          setRole(data.role || 'none');
          setRequested(data.requested === true);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load deletion status');
        }
      }
    };

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [postId, status]);

  useEffect(() => {
    if (isConfirmingDelete) {
      confirmButtonRef.current?.focus();
    }
  }, [isConfirmingDelete]);

  useEffect(() => {
    if (isRequestFormOpen) {
      reasonRef.current?.focus();
    }
  }, [isRequestFormOpen]);

  if (status !== 'authenticated' || role === 'none') {
    return null;
  }

  const handleDelete = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to delete post');
      }
      router.push('/blog');
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete post');
      setIsLoading(false);
    }
  };

  const handleRequestDeletion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}/deletion-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to request deletion');
      }
      setRequested(true);
      setIsRequestFormOpen(false);
      setMessage('Deletion requested. An admin will review it.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to request deletion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mt-10 p-5 bg-surface border border-border rounded-lg" aria-label="Post moderation actions">
      {message && (
        <p className="mb-4 text-sm text-accent" aria-live="polite">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 text-sm text-red-500" role="alert" aria-live="assertive">
          {error}
        </p>
      )}

      {role === 'admin' && (
        isConfirmingDelete ? (
          <div className="space-y-3" role="alertdialog" aria-labelledby="delete-confirmation-title" aria-describedby="delete-confirmation-description">
            <h2 id="delete-confirmation-title" className="font-semibold">Delete this post?</h2>
            <p id="delete-confirmation-description" className="text-sm text-foreground-muted">
              This permanently removes the community post and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-md border border-border hover:border-accent disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            className="px-4 py-2 rounded-md border border-red-500/60 text-red-500 hover:bg-red-500/10"
          >
            Delete post
          </button>
        )
      )}

      {role === 'author' && !requested && (
        isRequestFormOpen ? (
          <form onSubmit={handleRequestDeletion} className="space-y-3">
            <label htmlFor={`deletion-reason-${postId}`} className="block text-sm font-medium">
              Optional reason
            </label>
            <textarea
              ref={reasonRef}
              id={`deletion-reason-${postId}`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
            <p className="text-xs text-foreground-faint">{reason.length}/500</p>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-md bg-accent text-background hover:bg-accent-strong disabled:opacity-50"
              >
                {isLoading ? 'Submitting…' : 'Submit request'}
              </button>
              <button
                type="button"
                onClick={() => setIsRequestFormOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-md border border-border hover:border-accent disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsRequestFormOpen(true)}
            className="px-4 py-2 rounded-md border border-accent text-accent hover:bg-accent-soft"
          >
            Request deletion
          </button>
        )
      )}

      {role === 'author' && requested && !message && (
        <p className="text-sm text-accent" aria-live="polite">
          Deletion requested. An admin will review it.
        </p>
      )}
    </section>
  );
};
