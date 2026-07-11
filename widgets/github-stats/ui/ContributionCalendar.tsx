interface ContributionDay {
  contributionCount: number;
  date: string;
  color: string;
}

interface ContributionCalendarProps {
  weeks: {
    contributionDays: ContributionDay[];
  }[];
  totalContributions: number;
}

export function ContributionCalendar({ weeks, totalContributions }: ContributionCalendarProps) {
  // Get the last 52 weeks
  const displayWeeks = weeks.slice(-52);

  return (
    <div className="bg-surface border border-border p-6 rounded-lg">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-sm font-mono uppercase tracking-widest text-foreground-faint mb-1">
            Contribution Activity
          </h3>
          <p className="text-2xl font-bold">{totalContributions}</p>
        </div>
        <div className="flex gap-1 items-center text-[10px] font-mono text-foreground-faint">
          <span>Less</span>
          <div className="w-3 h-3 bg-surface-raised border border-border rounded-sm" />
          <div className="w-3 h-3 bg-accent-soft border border-border rounded-sm" />
          <div className="w-3 h-3 bg-accent/40 border border-border rounded-sm" />
          <div className="w-3 h-3 bg-accent/70 border border-border rounded-sm" />
          <div className="w-3 h-3 bg-accent border border-border rounded-sm" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">
          {displayWeeks.map((week, i) => (
            <div key={i} className="flex flex-col gap-1">
              {week.contributionDays.map((day) => {
                // Map GitHub contribution count to our amber accent intensity
                let bgColor = 'var(--surface-raised)';
                if (day.contributionCount > 0 && day.contributionCount < 3) bgColor = 'rgba(148, 93, 11, 0.2)';
                else if (day.contributionCount >= 3 && day.contributionCount < 6) bgColor = 'rgba(148, 93, 11, 0.4)';
                else if (day.contributionCount >= 6 && day.contributionCount < 10) bgColor = 'rgba(148, 93, 11, 0.7)';
                else if (day.contributionCount >= 10) bgColor = 'var(--accent)';

                return (
                  <div
                    key={day.date}
                    title={`${day.contributionCount} contributions on ${day.date}`}
                    className="w-3 h-3 rounded-sm border border-border/10 transition-colors hover:border-accent"
                    style={{ backgroundColor: bgColor }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between mt-4 text-[10px] font-mono text-foreground-faint uppercase tracking-tighter">
        <span>Last 12 Months</span>
        <div className="flex gap-4">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>
      </div>
    </div>
  );
}
