'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState } from 'react';
import { Play, Send, Loader2, CheckCircle2 } from 'lucide-react';

interface ProblemIDEProps {
  enabled: boolean;
  initialCode: string;
  problemTitle: string;
}

export const ProblemIDE: React.FC<ProblemIDEProps> = ({ enabled, initialCode, problemTitle }) => {
  const { data: session, status } = useSession();
  const [code, setCode] = useState(initialCode);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-5 text-sm text-foreground-muted">
        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-foreground-faint">IDE preview</div>
        <div className="mt-3 font-medium text-foreground">Online IDE is disabled.</div>
        <p className="mt-2">
          Set <span className="font-mono text-accent">IDE_ENABLED=true</span> to enable the placeholder editor when a judge backend is ready.
        </p>
      </div>
    );
  }

  const handleAction = async (action: 'run' | 'submit') => {
    if (status === 'loading') {
      return;
    }

    if (!session) {
      await signIn('github', { callbackUrl: window.location.href });
      return;
    }

    if (action === 'run') {
      setIsRunning(true);
      setFeedback('Running your solution...');
      window.setTimeout(() => {
        setIsRunning(false);
        setFeedback('Run complete. The result is ready in the secure judge flow once the backend is connected.');
      }, 800);
      return;
    }

    setIsSubmitting(true);
    setFeedback('Submitting your solution...');
    window.setTimeout(() => {
      setIsSubmitting(false);
      setFeedback('Submission queued. A judge result will be reported once the backend is available.');
    }, 800);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-accent">Online IDE</div>
          <h3 className="mt-2 text-xl font-semibold text-foreground">{problemTitle}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleAction('run')}
            disabled={status === 'loading' || isRunning || isSubmitting}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Running…' : 'Run'}
          </button>

          <button
            type="button"
            onClick={() => handleAction('submit')}
            disabled={status === 'loading' || isRunning || isSubmitting}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-3 py-2 text-xs font-mono uppercase tracking-[0.2em] text-foreground-faint">
        <span>Code</span>
        {!session && (
          <span className="text-accent">Sign in on Run / Submit</span>
        )}
        {session && (
          <span className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Signed in
          </span>
        )}
      </div>

      <textarea
        value={code}
        onChange={(event) => setCode(event.target.value)}
        spellCheck={false}
        className="min-h-[260px] w-full resize-y rounded-xl border border-border bg-background px-4 py-3 font-mono text-sm text-foreground shadow-inner outline-none transition-colors focus:border-accent/70"
        aria-label={`${problemTitle} editor`}
      />

      {feedback && (
        <p className="mt-4 rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground-muted">
          {feedback}
        </p>
      )}
    </div>
  );
};
