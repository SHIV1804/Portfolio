import Link from 'next/link';
import { BlogPost } from '@/shared/lib/blog';

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link 
      href={`/blog/${post.slug}`}
      className="group block p-6 bg-surface border border-border hover:border-accent transition-colors rounded-lg"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-foreground-faint font-mono">
          {new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
        <span className="text-xs text-foreground-faint font-mono">
          {post.readingTime}
        </span>
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">
        {post.title}
      </h3>
      <p className="text-foreground-muted text-sm mb-4 line-clamp-2">
        {post.excerpt}
      </p>
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span 
            key={tag}
            className="text-[10px] font-mono px-2 py-0.5 bg-accent-soft text-accent rounded uppercase tracking-wider"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
