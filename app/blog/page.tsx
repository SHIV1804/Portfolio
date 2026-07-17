import { getAllPosts, BlogPost, calculateReadingTime } from '@/shared/lib/blog';
import { WritePostButton } from './WritePostButton';
import { BlogSearch } from './BlogSearch';
import { prisma } from '@/shared/lib/prisma';
import { PostStatus } from '@prisma/client';

export const metadata = {
  title: 'Blog | Shivam',
  description: 'Thoughts on systems engineering, learning, and software development.',
};

export default async function BlogPage() {
  // 1. Fetch MDX posts
  const mdxPosts = await getAllPosts();

  // 2. Fetch approved DB posts
  const dbPostsRaw = await prisma.post.findMany({
    where: {
      status: PostStatus.APPROVED,
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
  });

  const dbPosts: BlogPost[] = dbPostsRaw.map((post) => ({
    title: post.title,
    date: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    excerpt: post.content.slice(0, 160).replace(/\n/g, ' ') + '...',
    tags: ['Community'], // Default tag for DB posts for now
    slug: post.slug,
    draft: false,
    content: post.content,
    readingTime: calculateReadingTime(post.content),
    source: 'database',
    authorName: post.author.name || post.author.email || 'Anonymous',
  }));

  // 3. Merge and sort
  const allPosts = [...mdxPosts, ...dbPosts].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-4xl font-bold">Blog</h1>
          <WritePostButton />
        </div>
        <p className="text-foreground-muted max-w-2xl">
          A collection of thoughts, technical deep-dives, and reflections on engineering.
        </p>
      </header>

      <BlogSearch initialPosts={allPosts} />
    </main>
  );
}
