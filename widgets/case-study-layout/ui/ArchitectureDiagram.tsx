"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface DiagramNode {
  id: string;
  name: string;
  description: string;
}

const nodes: DiagramNode[] = [
  {
    id: "stage-1",
    name: "[PLACEHOLDER: Parsing Stage 1]",
    description: "[PLACEHOLDER: Description for stage 1 - e.g., File I/O and memory mapping strategy]",
  },
  {
    id: "stage-2",
    name: "[PLACEHOLDER: Parsing Stage 2]",
    description: "[PLACEHOLDER: Description for stage 2 - e.g., Regex engine or state machine for line parsing]",
  },
  {
    id: "stage-3",
    name: "[PLACEHOLDER: Parsing Stage 3]",
    description: "[PLACEHOLDER: Description for stage 3 - e.g., Transaction reconstruction and state tracking]",
  },
  {
    id: "output",
    name: "[PLACEHOLDER: Output Layer]",
    description: "[PLACEHOLDER: Description for output layer - e.g., Metric generation and reporting]",
  },
];

export const ArchitectureDiagram: React.FC = () => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const toggleNode = (id: string) => {
    setActiveNodeId(activeNodeId === id ? null : id);
  };

  return (
    <div className="w-full space-y-8 bg-surface-raised p-6 rounded-xl border border-border">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
        {nodes.map((node, index) => (
          <React.Fragment key={node.id}>
            <button
              onClick={() => toggleNode(node.id)}
              className={`relative z-10 flex flex-col items-center justify-center p-4 min-w-[160px] rounded-lg border-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent outline-none ${
                activeNodeId === node.id
                  ? "border-accent bg-accent/10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]"
                  : "border-border bg-surface hover:border-accent/50"
              }`}
              aria-expanded={activeNodeId === node.id}
              aria-controls={`desc-${node.id}`}
            >
              <span className="text-xs font-mono text-accent uppercase tracking-wider mb-1">Node {index + 1}</span>
              <span className="text-sm font-bold text-foreground text-center">{node.name}</span>
              {activeNodeId === node.id ? (
                <ChevronDown className="w-4 h-4 mt-2 text-accent" />
              ) : (
                <ChevronRight className="w-4 h-4 mt-2 text-foreground-faint" />
              )}
            </button>
            {index < nodes.length - 1 && (
              <div className="hidden md:block flex-1 h-px bg-border relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[4px] border-y-transparent border-l-[6px] border-l-border" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="min-h-[100px] relative">
        {nodes.map((node) => (
          <div
            key={node.id}
            id={`desc-${node.id}`}
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              activeNodeId === node.id ? "max-h-[200px] opacity-100 mt-4" : "max-h-0 opacity-0"
            } motion-reduce:transition-none`}
          >
            <div className="p-4 rounded-lg bg-surface border border-accent/20">
              <h4 className="text-sm font-mono text-accent uppercase tracking-widest mb-2">
                {node.name} Details
              </h4>
              <p className="text-foreground-muted leading-relaxed">
                {node.description}
              </p>
            </div>
          </div>
        ))}
        {!activeNodeId && (
          <div className="flex items-center justify-center h-full text-foreground-faint text-sm italic py-8">
            Click a node above to explore the architecture details.
          </div>
        )}
      </div>
    </div>
  );
};
