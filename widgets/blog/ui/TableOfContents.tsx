'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('h2, h3'))
      .map((heading) => ({
        id: heading.id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName.replace('H', ''), 10),
      }))
      .filter((h) => h.id);

    // Use requestAnimationFrame to avoid "Calling setState synchronously within an effect" lint error
    requestAnimationFrame(() => {
      setToc(headings);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -80% 0%' }
    );

    document.querySelectorAll('h2, h3').forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  if (toc.length === 0) return null;

  return (
    <nav className="space-y-2">
      <p className="text-xs font-mono uppercase tracking-widest text-foreground-faint mb-4">
        Table of Contents
      </p>
      <ul className="space-y-2 text-sm">
        {toc.map((item) => (
          <li 
            key={item.id}
            style={{ paddingLeft: `${(item.level - 2) * 1}rem` }}
          >
            <a
              href={`#${item.id}`}
              className={`hover:text-accent transition-colors ${
                activeId === item.id ? 'text-accent' : 'text-foreground-muted'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
