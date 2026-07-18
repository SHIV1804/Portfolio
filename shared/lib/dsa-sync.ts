import matter from 'gray-matter';

const GITHUB_API_BASE = 'https://api.github.com';

export interface DSAProblem {
  title: string;
  leetcodeNumber: number;
  leetcodeUrl: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  pattern: 'two-pointers' | 'sliding-window' | 'binary-search';
  tags: string[];
  dateSolved: string;
  exampleInput: Record<string, unknown>;
  slug: string;
  patternSlug: string;
  solution: string;
  solutionFileExtension: string;
  writeup: string;
}

export interface DSATraceStep {
  line: number;
  variables: Record<string, unknown>;
  highlightIndices?: number[];
  explanation: string;
}

export interface DSATracePhase {
  code: string[];
  complexity: string;
  steps: DSATraceStep[];
}

export interface DSAPredictionQuestion {
  stepIndex: number;
  phase: 'bruteForce' | 'optimized';
  question: string;
  options: string[];
  correctOptionIndex: number;
}

export interface DSATrace {
  bruteForce: DSATracePhase;
  optimized: DSATracePhase;
  discoveryQuestions: string[];
  predictionQuestions: DSAPredictionQuestion[];
}

interface GitHubContent {
  name: string;
  path: string;
  type: 'dir' | 'file';
  download_url: string | null;
}

export async function fetchDSAProblems(): Promise<DSAProblem[]> {
  const repo = process.env.DSA_GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !token) {
    console.error('Missing DSA_GITHUB_REPO or GITHUB_TOKEN');
    return [];
  }

  try {
    // 1. Fetch patterns (directories in /problems)
    const patternsResponse = await fetch(`${GITHUB_API_BASE}/repos/${repo}/contents/problems`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!patternsResponse.ok) return [];
    const patterns: GitHubContent[] = await patternsResponse.json();
    const problemDirs: { pattern: string; path: string }[] = [];

    // 2. Fetch problems within each pattern
    for (const pattern of patterns) {
      if (pattern.type === 'dir') {
        const problemsResponse = await fetch(`${GITHUB_API_BASE}/repos/${repo}/contents/${pattern.path}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (problemsResponse.ok) {
          const problems: GitHubContent[] = await problemsResponse.json();
          problems.forEach(p => {
            if (p.type === 'dir') {
              problemDirs.push({ pattern: pattern.name, path: p.path });
            }
          });
        }
      }
    }

    const allProblems: DSAProblem[] = [];

    // 3. Fetch files for each problem
    for (const problemDir of problemDirs) {
      const filesResponse = await fetch(`${GITHUB_API_BASE}/repos/${repo}/contents/${problemDir.path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (filesResponse.ok) {
        const files: GitHubContent[] = await filesResponse.json();
        
        const metaFile = files.find(f => f.name === 'meta.md');
        const writeupFile = files.find(f => f.name === 'writeup.md');
        const solutionFile = files.find(f => f.name.startsWith('solution.'));

        if (metaFile && writeupFile && solutionFile) {
          const [metaContent, writeupContent, solutionContent] = await Promise.all([
            fetch(metaFile.download_url!).then(r => r.text()),
            fetch(writeupFile.download_url!).then(r => r.text()),
            fetch(solutionFile.download_url!).then(r => r.text()),
          ]);

          const { data } = matter(metaContent);
          
          allProblems.push({
            ...data,
            slug: problemDir.path.split('/').pop()!,
            patternSlug: problemDir.pattern,
            solution: solutionContent,
            solutionFileExtension: solutionFile.name.split('.').pop() || 'cpp',
            writeup: writeupContent,
          } as DSAProblem);
        }
      }
    }

    return allProblems.sort((a, b) => new Date(b.dateSolved).getTime() - new Date(a.dateSolved).getTime());
  } catch (error) {
    console.error('Error syncing DSA problems:', error);
    return [];
  }
}

export async function getDSAProblemBySlug(pattern: string, slug: string): Promise<DSAProblem | null> {
  const problems = await fetchDSAProblems();
  return problems.find(p => p.patternSlug === pattern && p.slug === slug) || null;
}

export async function fetchDSATrace(pattern: string, slug: string): Promise<DSATrace | null> {
  const repo = process.env.DSA_GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !token) {
    console.error('Missing DSA_GITHUB_REPO or GITHUB_TOKEN');
    return null;
  }

  try {
    const tracePath = `problems/${pattern}/${slug}/trace.json`;
    const response = await fetch(`${GITHUB_API_BASE}/repos/${repo}/contents/${tracePath}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!response.ok) return null;
    const content: GitHubContent = await response.json();
    
    if (content.download_url) {
      const traceResponse = await fetch(content.download_url);
      if (traceResponse.ok) {
        return await traceResponse.json();
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching DSA trace:', error);
    return null;
  }
}
