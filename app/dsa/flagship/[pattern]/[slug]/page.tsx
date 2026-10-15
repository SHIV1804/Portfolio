import { Metadata } from 'next';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { fetchDSATrace, getDSAProblemBySlug } from '@/shared/lib/dsa-sync';
import { ArrayBox } from '@/widgets/dsa/ui/flagship/ArrayBox';
import { DiscoveryTransition } from '@/widgets/dsa/ui/flagship/DiscoveryTransition';
import { ExecutionPanel } from '@/widgets/dsa/ui/flagship/ExecutionPanel';

interface PageProps {
  params: Promise<{ pattern: string; slug: string }>;
}

function getNumericExampleArray(exampleInput: Record<string, unknown>): number[] | null {
  const preferredKeys = ['array', 'nums', 'numbers'];
  const candidates = [
    ...preferredKeys.map((key) => exampleInput[key]),
    ...Object.values(exampleInput),
  ];

  const array = candidates.find(
    (value): value is number[] =>
      Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'number'),
  );

  return array ?? null;
}

function getNumericTarget(exampleInput: Record<string, unknown>): number | null {
  const target = exampleInput.target;
  return typeof target === 'number' ? target : null;
}

function UnavailableState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="container mx-auto py-24 px-4 text-center text-foreground-faint">
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="max-w-xl mx-auto">{detail}</p>
      <Link href="/dsa" className="inline-block mt-8 text-accent hover:underline">
        ← Back to DSA Solutions
      </Link>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pattern, slug } = await params;
  const problem = await getDSAProblemBySlug(pattern, slug);

  if (!problem) return {};

  return {
    title: `${problem.title} Interactive Walkthrough | DSA Flagship`,
    description: `An interactive walkthrough of ${problem.title}, using its verified execution trace.`,
  };
}

export default async function FlagshipProblemPage({ params }: PageProps) {
  const { pattern, slug } = await params;
  const [problem, trace] = await Promise.all([
    getDSAProblemBySlug(pattern, slug),
    fetchDSATrace(pattern, slug),
  ]);

  if (!problem) {
    return <UnavailableState title="Problem Not Found" detail="This DSA problem could not be loaded from the synced repository." />;
  }

  if (!trace) {
    return (
      <UnavailableState
        title="Interactive Walkthrough Not Available"
        detail={`There is no trace.json for ${problem.title} yet. The regular solution page remains available while its trace is prepared.`}
      />
    );
  }

  const nums = getNumericExampleArray(problem.exampleInput);
  if (!nums) {
    return (
      <UnavailableState
        title="Example Input Not Supported"
        detail={`The trace for ${problem.title} is available, but its metadata does not contain a numeric example array for the walkthrough.`}
      />
    );
  }

  const target = getNumericTarget(problem.exampleInput);
  const predictionQuestions = trace.predictionQuestions ?? [];
  const bruteForce = trace.bruteForce;

  return (
    <div className="container mx-auto py-12 px-4">
      <Link href={`/dsa/${pattern}/${slug}`} className="text-xs font-mono text-foreground-faint hover:text-accent transition-colors uppercase tracking-widest">
        ← Back to problem
      </Link>
      <h1 className="text-4xl md:text-5xl font-bold text-accent mt-8 mb-6">{problem.title}</h1>
      <div className="prose prose-invert max-w-none mb-12">
        <MDXRemote source={problem.writeup} />
      </div>

      <div className="bg-surface-raised p-8 rounded-lg shadow-xl border border-border mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Example Input</h2>
        <div className="flex flex-wrap items-center gap-8">
          <div>
            <p className="text-lg text-foreground-faint mb-2">Array:</p>
            <div className="flex flex-wrap gap-4">
              {nums.map((num, index) => (
                <ArrayBox key={index} value={num} index={index} delay={index * 0.1} />
              ))}
            </div>
          </div>
          {target !== null && (
            <div>
              <p className="text-lg text-foreground-faint mb-2">Target:</p>
              <div className="p-4 border border-accent rounded-lg bg-surface-raised shadow-lg">
                <span className="font-mono text-2xl text-accent-foreground">{target}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {bruteForce ? (
        <>
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Watch the Brute-Force Attempt</h2>
            <ExecutionPanel
              phase={bruteForce}
              nums={nums}
              title="Brute-Force Walkthrough"
              phaseKey="bruteForce"
              predictionQuestions={predictionQuestions}
            />
          </div>

          {trace.discoveryQuestions && trace.discoveryQuestions.length > 0 && (
            <div className="mb-12">
              <DiscoveryTransition
                complexity={bruteForce.complexity}
                discoveryQuestions={trace.discoveryQuestions}
                exampleSize={nums.length}
              />
            </div>
          )}
        </>
      ) : (
        <div className="mb-12 rounded-xl border border-border bg-surface-raised p-6 text-foreground-muted">
          The brute-force trace is not available yet, so this walkthrough starts with the optimized approach.
        </div>
      )}

      <div id="optimized-walkthrough" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-bold text-foreground mb-6">Watch the Optimized Approach</h2>
        <ExecutionPanel
          phase={trace.optimized}
          nums={nums}
          title="Optimized Walkthrough"
          phaseKey="optimized"
          predictionQuestions={predictionQuestions}
        />
      </div>
    </div>
  );
}
