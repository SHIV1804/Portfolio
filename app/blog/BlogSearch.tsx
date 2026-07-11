'use client';

import { useState, useMemo } from 'react';
import { BlogPost } from '@/shared/lib/blog';
import { PostCard } from '@/widgets/blog';
import { Search } from 'lucide-react';

interface BlogSearchProps {
  initialPosts: BlogPost[];
}

const POSTS_PER_PAGE = 10;

export function BlogSearch({ initialPosts }: BlogSearchProps) {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) =>
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }, [initialPosts, query]);

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  return (
    <div className="space-y-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint w-4 h-4" />
        <input
          type="text"
          placeholder="Search posts by title, excerpt, or tags..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full bg-surface border border-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="grid gap-6">
        {paginatedPosts.length > 0 ? (
          paginatedPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))
        ) : (
          <p className="text-center py-20 text-foreground-muted">
            No posts found matching your search.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex justify-center gap-2 mt-12">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-lg border transition-colors ${
                currentPage === page
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface border-border hover:border-accent text-foreground-muted'
              }`}
            >
              {page}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
