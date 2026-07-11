import React from 'react';
import Link from 'next/link';
import { DSAProblem } from '@/shared/lib/dsa-sync';
import { Badge } from '@/shared/ui/Badge';

interface ProblemCardProps {
  problem: DSAProblem;
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ problem }) => {
  const difficultyColor = {
    Easy: 'bg-green-500/10 text-green-500 border-green-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    Hard: 'bg-red-500/10 text-red-500 border-red-500/20',
  }[problem.difficulty];

  const detailUrl = `/dsa/${problem.patternSlug}/${problem.slug}`;

  return (
    <div className="group relative p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300">
      <Link href={detailUrl} className="absolute inset-0 z-0" aria-label={`View solution for ${problem.title}`} />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
              {problem.title}
            </h3>
            <p className="text-sm text-white/40 mt-1">
              Solved on {new Date(problem.dateSolved).toLocaleDateString()}
            </p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium border ${difficultyColor}`}>
            {problem.difficulty}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-500/80">
            {problem.pattern}
          </Badge>
          {problem.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs bg-white/5 text-white/60">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <a 
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/40 hover:text-white transition-colors relative z-20"
            onClick={(e) => e.stopPropagation()}
          >
            LeetCode #{problem.leetcodeNumber}
          </a>
          <span className="text-sm font-medium text-amber-500 group-hover:text-amber-400 transition-colors">
            View Solution →
          </span>
        </div>
      </div>
    </div>
  );
};
