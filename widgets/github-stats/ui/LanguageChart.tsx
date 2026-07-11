'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface LanguageStat {
  name: string;
  percentage: number;
}

interface LanguageChartProps {
  data: LanguageStat[];
}

export function LanguageChart({ data }: LanguageChartProps) {
  // Use existing design tokens for the chart colors
  const COLORS = [
    'var(--accent)',
    'rgba(148, 93, 11, 0.8)',
    'rgba(148, 93, 11, 0.6)',
    'rgba(148, 93, 11, 0.4)',
    'rgba(148, 93, 11, 0.2)',
  ];

  return (
    <div className="bg-surface border border-border p-6 rounded-lg h-full flex flex-col">
      <h3 className="text-sm font-mono uppercase tracking-widest text-foreground-faint mb-6">
        Language Distribution
      </h3>
      
      <div className="flex-1 min-h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="percentage"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)'
              }}
              itemStyle={{ color: 'var(--accent)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-xs font-mono text-foreground-faint uppercase block">Top</span>
            <span className="text-lg font-bold">{data[0]?.name}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {data.map((lang, i) => (
          <div key={lang.name} className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: COLORS[i % COLORS.length] }} 
              />
              <span className="text-foreground-muted">{lang.name}</span>
            </div>
            <span className="font-bold">{lang.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
