import React from 'react';

interface PatternVisualizerProps {
  pattern: string;
  exampleInput: Record<string, unknown> | null;
}

export const PatternVisualizer: React.FC<PatternVisualizerProps> = ({ pattern, exampleInput }) => {
  return (
    <div className="w-full aspect-video bg-accent-soft/20 rounded-xl border border-dashed border-accent/30 flex items-center justify-center flex-col gap-4 my-8">
      <div className="text-accent font-mono text-sm animate-pulse">
        [Visualizer coming in Chunk 4]
      </div>
      <div className="text-foreground-faint text-xs font-mono">
        Pattern: {pattern}
      </div>
      {exampleInput && (
        <pre className="text-[10px] text-foreground-faint bg-background/50 p-2 rounded max-w-[80%] overflow-hidden text-ellipsis">
          {JSON.stringify(exampleInput, null, 2)}
        </pre>
      )}
    </div>
  );
};
