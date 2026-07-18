import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import { getDSAProblemBySlug, fetchDSAProblems } from '@/shared/lib/dsa-sync';
import { mdxComponents } from '../../../blog/MdxComponents';
import { Badge } from '@/shared/ui/Badge';
import { PatternVisualizer } from '@/widgets/dsa/ui/PatternVisualizer';

interface PageProps {
  params: Promise<{ pattern: string; slug: string }>;
}

export async function generateStaticParams() {
  const problems = await fetchDSAProblems();
  return problems.map((problem) => ({
    pattern: problem.patternSlug,
    slug: problem.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { pattern, slug } = await params;
  const problem = await getDSAProblemBySlug(pattern, slug);
  if (!problem) return {};

  return {
    title: `${problem.leetcodeNumber}. ${problem.title} | DSA Solutions`,
    description: `Detailed write-up and solution for ${problem.title} (${problem.pattern})`,
  };
}

export default async function DSAProblemPage({ params }: PageProps) {
  const { pattern, slug } = await params;
  const problem = await getDSAProblemBySlug(pattern, slug);

  if (!problem) {
    notFound();
  }

  // Map file extensions to Shiki-supported language tags
  const extensionMap: Record<string, string> = {
    'cpp': 'cpp',
    'py': 'python',
    'js': 'javascript',
    'ts': 'typescript',
    'java': 'java',
    'go': 'go',
    'rs': 'rust',
  };
  const lang = extensionMap[problem.solutionFileExtension] || problem.solutionFileExtension || 'cpp';

  // Prepare the code block for MDX
  const solutionMdx = `\`\`\`${lang}\n${problem.solution}\n\`\`\``;

  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <div className="flex justify-between items-start mb-8">
            <Link 
              href="/dsa"
              className="text-xs font-mono text-foreground-faint hover:text-accent transition-colors uppercase tracking-widest"
            >
              ← Back to DSA Solutions
            </Link>

            {slug === 'two-sum' && (
              <Link
                href="/dsa/flagship/two-sum"
                className="text-xs font-mono px-3 py-1.5 border border-accent/30 rounded bg-accent/5 text-accent hover:bg-accent/10 transition-all flex items-center gap-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                </span>
                Try the full interactive walkthrough →
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-mono text-accent">#{problem.leetcodeNumber}</span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              {problem.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-4 items-center text-xs font-mono">
            <Badge variant="outline" className={
              problem.difficulty === 'Easy' ? 'text-green-500 border-green-500/20' :
              problem.difficulty === 'Medium' ? 'text-yellow-500 border-yellow-500/20' :
              'text-red-500 border-red-500/20'
            }>
              {problem.difficulty}
            </Badge>
            <span className="text-foreground-faint uppercase tracking-wider">{problem.pattern}</span>
            <span className="text-foreground-faint">•</span>
            <time className="text-foreground-faint" dateTime={problem.dateSolved}>
              Solved: {new Date(problem.dateSolved).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {problem.leetcodeUrl && (
              <>
                <span className="text-foreground-faint">•</span>
                <a 
                  href={problem.leetcodeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  View on LeetCode ↗
                </a>
              </>
            )}
          </div>
        </header>

        {/* Visualizer Slot */}
        <section className="mb-16">
          <h2 className="text-sm font-mono text-foreground-faint uppercase tracking-widest mb-4">Visualizer</h2>
          <PatternVisualizer pattern={problem.pattern} exampleInput={problem.exampleInput} />
        </section>

        {/* Write-up Content */}
        <section className="prose prose-invert max-w-none mb-16">
          <h2 className="text-2xl font-bold mb-6">Write-up</h2>
          <MDXRemote 
            source={problem.writeup} 
            components={mdxComponents}
          />
        </section>

        {/* Solution Code */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Solution</h2>
          <div className="prose prose-invert max-w-none">
            <MDXRemote 
              source={solutionMdx} 
              components={mdxComponents}
              options={{
                mdxOptions: {
                  rehypePlugins: [
                    [
                      rehypePrettyCode,
                      {
                        theme: 'github-dark',
                        keepBackground: true,
                      },
                    ],
                  ],
                },
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
