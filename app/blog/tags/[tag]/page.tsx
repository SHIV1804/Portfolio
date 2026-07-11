import { Metadata } from 'next';
import Link from 'next/link';
import { getPostsByTag, getAllTags } from '@/shared/lib/blog';
import { PostCard } from '@/widgets/blog';

interface PageProps {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({
    tag: tag,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `Posts tagged with "${tag}" | Shivam`,
    description: `Browse all blog posts tagged with ${tag}.`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const posts = await getPostsByTag(tag);

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <header className="mb-12">
        <Link 
          href="/blog"
          className="text-xs font-mono text-foreground-faint hover:text-accent transition-colors mb-8 inline-block uppercase tracking-widest"
        >
          ← Back to all posts
        </Link>
        <h1 className="text-4xl font-bold mb-4">
          Tagged: <span className="text-accent">#{tag}</span>
        </h1>
        <p className="text-foreground-muted">
          Showing {posts.length} {posts.length === 1 ? 'post' : 'posts'} tagged with &quot;{tag}&quot;.
        </p>
      </header>

      <div className="grid gap-6">
        {posts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </div>
    </main>
  );
}
