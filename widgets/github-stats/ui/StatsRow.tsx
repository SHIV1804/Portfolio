interface StatsRowProps {
  totalRepos: number;
  totalStars: number;
  totalContributions: number;
}

export function StatsRow({ totalRepos, totalStars, totalContributions }: StatsRowProps) {
  const stats = [
    { label: 'Public Repositories', value: totalRepos },
    { label: 'Total Stars Earned', value: totalStars },
    { label: 'Yearly Contributions', value: totalContributions },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface border border-border p-6 rounded-lg text-center sm:text-left">
          <p className="text-[10px] font-mono uppercase tracking-widest text-foreground-faint mb-1">
            {stat.label}
          </p>
          <p className="text-3xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
