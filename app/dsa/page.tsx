import React from 'react';
import { fetchDSAProblems } from '@/shared/lib/dsa-sync';
import { ProblemCard } from '@/widgets/dsa/ui/ProblemCard';

export const metadata = {
  title: 'DSA Solutions | Portfolio',
  description: 'A collection of Data Structures and Algorithms solutions synced from GitHub.',
};

export default async function DSAPage() {
  const problems = await fetchDSAProblems();

  return (
    <main className="min-h-screen py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            DSA <span className="text-amber-500">Solutions</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl">
            A curated collection of algorithmic challenges, solved with a focus on 
            mechanical sympathy and performance.
          </p>
        </header>

        {problems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-white/10 bg-white/5">
            <p className="text-white/40 text-lg">No problems synced yet.</p>
            <p className="text-white/20 text-sm mt-2">Check back later for updates from the repository.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem) => (
              <ProblemCard key={`${problem.patternSlug}-${problem.slug}`} problem={problem} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
