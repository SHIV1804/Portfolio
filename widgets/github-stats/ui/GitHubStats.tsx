import { getGitHubData, processGitHubStats } from '../lib/github';
import { ContributionCalendar } from './ContributionCalendar';
import { LanguageChart } from './LanguageChart';
import { PinnedRepos } from './PinnedRepos';
import { StatsRow } from './StatsRow';

export async function GitHubStats() {
  const data = await getGitHubData();

  if (!data) {
    return (
      <div className="bg-surface-raised border border-border p-12 rounded-lg text-center">
        <p className="text-foreground-muted font-mono text-sm">
          [!] GitHub activity data temporarily unavailable
        </p>
        <p className="text-xs text-foreground-faint mt-2">
          Please verify GITHUB_TOKEN environment variable.
        </p>
      </div>
    );
  }

  const stats = processGitHubStats(data);

  return (
    <div className="space-y-8">
      <StatsRow 
        totalRepos={stats.totalRepos} 
        totalStars={stats.totalStars} 
        totalContributions={stats.totalContributions} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <ContributionCalendar 
          weeks={stats.calendar.weeks} 
          totalContributions={stats.totalContributions} 
        />
        <LanguageChart data={stats.languageStats} />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-mono uppercase tracking-widest text-foreground-faint px-1">
          Featured Repositories
        </h3>
        <PinnedRepos repos={stats.pinnedRepos} />
      </div>
    </div>
  );
}
