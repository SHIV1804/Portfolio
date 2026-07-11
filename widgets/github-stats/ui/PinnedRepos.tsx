import { Star, GitFork } from 'lucide-react';

interface Repo {
  name: string;
  description: string;
  url: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
}

interface PinnedReposProps {
  repos: Repo[];
}

export function PinnedRepos({ repos }: PinnedReposProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {repos.map((repo) => (
        <a
          key={repo.name}
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-surface border border-border p-5 rounded-lg hover:border-accent transition-colors flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold group-hover:text-accent transition-colors">
              {repo.name}
            </h4>
            {repo.primaryLanguage && (
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: repo.primaryLanguage.color }} 
                />
                <span className="text-[10px] font-mono text-foreground-faint uppercase">
                  {repo.primaryLanguage.name}
                </span>
              </div>
            )}
          </div>
          
          <p className="text-xs text-foreground-muted mb-6 line-clamp-2 flex-1">
            {repo.description || 'No description provided.'}
          </p>

          <div className="flex gap-4 text-[10px] font-mono text-foreground-faint">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>{repo.stargazerCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              <span>{repo.forkCount}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
