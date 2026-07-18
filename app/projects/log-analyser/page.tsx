import React from "react";
import { Metadata } from "next";
import { CaseStudyLayout } from "@/widgets/case-study-layout/ui/CaseStudyLayout";
import { Header } from "@/widgets/header/ui/Header";
import { Footer } from "@/widgets/footer/ui/Footer";
import { ArchitectureDiagram } from "@/widgets/case-study-layout/ui/ArchitectureDiagram";

export const metadata: Metadata = {
  title: "Log Analyser Case Study | Software Engineer Portfolio",
  description: "A deep dive into the architecture and performance of a high-performance C++ tool for parsing and visualizing complex system logs.",
  openGraph: {
    title: "Log Analyser Case Study | Shivam Portfolio",
    description: "Deep dive into a high-performance C++ tool for parsing and visualizing complex system logs.",
    url: "https://portfolio-shivam.vercel.app/projects/log-analyser",
    images: [{ url: "/og-log-analyser.png" }], // [PLACEHOLDER: OG image]
    type: "article",
  },
};

export default function LogAnalyserPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <CaseStudyLayout
          title="Log Analyser"
          subtitle="A planned utility for high-performance log parsing — architecture design in progress, not yet implemented."
          problem={
            <div className="space-y-4">
              <p>
                Production log files in embedded environments are often massive, multi-threaded, and complex. Standard tools like `grep` or basic syslog parsers fail to provide a cohesive view of individual transaction flows, making it difficult to debug intermittent issues that span multiple system components.
              </p>
              <p>
                The goal was to build a tool that could ingest these large files and reconstruct the logical flow of events, allowing engineers to trace a single transaction from start to finish across asynchronous boundaries.
              </p>
            </div>
          }
          constraints={
            <ul className="list-disc list-inside space-y-2">
              <li>Must handle log files exceeding 100,000+ lines without significant memory overhead.</li>
              <li>Execution time must be sub-second for typical analysis tasks.</li>
              <li>Zero external dependencies to ensure portability across various engineering workstations.</li>
              <li>Must support custom, complex regex patterns for different log formats.</li>
            </ul>
          }
          architecture={
            <div className="space-y-4">
              <p>
                The planned utility would be built using modern C++, focusing on memory-mapped I/O for fast file access and a multi-pass parsing strategy. The design explores a first pass to index the file and identify transaction boundaries, while a second pass would build a directed acyclic graph (DAG) representing the event flow.
              </p>
              <div className="bg-surface border border-border p-4 rounded font-mono text-sm overflow-x-auto">
                [PLACEHOLDER: Architecture Diagram Description - A flow diagram showing File I/O → Indexing Engine → Transaction Reconstructor → Visualization Layer]
              </div>
              <div className="mt-6">
                <p className="mb-4">Key architectural components under consideration include:</p>
                <ul className="list-disc list-inside space-y-2">
                  <li><strong>Lock-free Ring Buffer:</strong> Planned for high-throughput event ingestion.</li>
                  <li><strong>Custom Memory Pool:</strong> Designed to minimize allocations during the parsing of millions of small log entries.</li>
                </ul>
              </div>
            </div>
          }
          architectureDiagram={<ArchitectureDiagram />}
          decisions={
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-foreground mb-2">Choice of C++ over Python</h4>
                <p>
                  While Python would allow for faster prototyping, the anticipated performance requirements for parsing 100k+ lines in sub-second time suggest a compiled language with fine-grained control over memory and CPU usage would be necessary.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-foreground mb-2">Memory-Mapped Files vs. Stream Reading</h4>
                <p>
                  The design explores using `mmap` to leverage the OS page cache, which is expected to significantly improve performance when performing multiple passes over the same log file.
                </p>
              </div>
              <div className="bg-surface border border-border p-4 rounded font-mono text-sm overflow-x-auto">
                <pre>{`// [PLACEHOLDER: code snippet showing mmap implementation or core parsing logic]`}</pre>
              </div>
            </div>
          }
          metrics={
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-border rounded bg-surface-raised">
                <div className="text-accent font-mono text-2xl mb-1">[PLACEHOLDER: 100ms]</div>
                <div className="text-sm text-foreground-faint uppercase tracking-wider">Average Parse Time (100k lines)</div>
              </div>
              <div className="p-4 border border-border rounded bg-surface-raised">
                <div className="text-accent font-mono text-2xl mb-1">[PLACEHOLDER: 15MB]</div>
                <div className="text-sm text-foreground-faint uppercase tracking-wider">Peak Memory Usage</div>
              </div>
            </div>
          }
          differently={
            <div className="space-y-4">
              <p>
                If I were to rebuild this today, I would explore using a SIMD-accelerated regex engine to further optimize the parsing pass. Additionally, I would consider a plugin-based architecture for log formatters to make it easier for other engineers to contribute patterns for new systems.
              </p>
            </div>
          }
        />
      </main>
      <Footer />
    </div>
  );
}
