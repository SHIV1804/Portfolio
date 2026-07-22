import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import { getPostBySlug, getAllPosts, BlogPost, calculateReadingTime } from '@/shared/lib/blog';
import { renderSafeMarkdown } from '@/shared/lib/safe-markdown';
import { TableOfContents, PostCard } from '@/widgets/blog';
import { mdxComponents } from '../MdxComponents';
import { prisma } from '@/shared/lib/prisma';
import { PostStatus } from '@prisma/client';
import { Badge } from '@/shared/ui/Badge';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Try MDX first
  let post = await getPostBySlug(slug);
  
  // Try DB fallback
  if (!post) {
    const dbPost = await prisma.post.findUnique({
      where: { slug, status: PostStatus.APPROVED },
      include: { author: true }
    });
    if (dbPost) {
      post = {
        title: dbPost.title,
        date: dbPost.publishedAt?.toISOString() || dbPost.createdAt.toISOString(),
        excerpt: dbPost.content.slice(0, 160).replace(/\n/g, ' ') + '...',
        tags: ['Community'],
        slug: dbPost.slug,
        draft: false,
        content: dbPost.content,
        readingTime: calculateReadingTime(dbPost.content),
        source: 'database',
        authorName: dbPost.author.name || dbPost.author.email || 'Anonymous',
      };
    }
  }

  if (!post) return {};

  return {
    title: `${post.title} | Shivam`,
    description: post.excerpt,
    alternates: {
      canonical: `https://portfolio-theta-ruby-31nqvqjqmc.vercel.app/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://portfolio-theta-ruby-31nqvqjqmc.vercel.app/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: [post.authorName || 'Shivam'],
    },
  };
}

async function getRelatedPosts(currentPost: BlogPost) {
  // 1. Fetch MDX posts
  const mdxPosts = await getAllPosts();

  // 2. Fetch approved DB posts
  const dbPostsRaw = await prisma.post.findMany({
    where: {
      status: PostStatus.APPROVED,
      NOT: { slug: currentPost.slug }
    },
    include: {
      author: { select: { name: true, email: true } }
    },
    take: 10
  });

  const dbPosts: BlogPost[] = dbPostsRaw.map((post) => ({
    title: post.title,
    date: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    excerpt: post.content.slice(0, 160).replace(/\n/g, ' ') + '...',
    tags: ['Community'],
    slug: post.slug,
    draft: false,
    content: post.content,
    readingTime: calculateReadingTime(post.content),
    source: 'database',
    authorName: post.author.name || post.author.email || 'Anonymous',
  }));

  const allPosts = [...mdxPosts, ...dbPosts];

  return allPosts
    .filter((post) => post.slug !== currentPost.slug)
    .map((post) => ({
      post,
      score: post.tags.filter((tag) => currentPost.tags.includes(tag)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.post);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Try MDX first
  let post = await getPostBySlug(slug);
  
  // Try DB fallback
  if (!post) {
    const dbPost = await prisma.post.findUnique({
      where: { slug, status: PostStatus.APPROVED },
      include: { author: true }
    });
    if (dbPost) {
      post = {
        title: dbPost.title,
        date: dbPost.publishedAt?.toISOString() || dbPost.createdAt.toISOString(),
        excerpt: dbPost.content.slice(0, 160).replace(/\n/g, ' ') + '...',
        tags: ['Community'],
        slug: dbPost.slug,
        draft: false,
        content: dbPost.content,
        readingTime: calculateReadingTime(dbPost.content),
        source: 'database',
        authorName: dbPost.author.name || dbPost.author.email || 'Anonymous',
      };
    }
  }

  if (!post) {
    notFound();
  }

  const relatedPosts = await getRelatedPosts(post);

  return (
    <main className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-16">
        <article className="max-w-3xl">
          <header className="mb-12">
            <Link 
              href="/blog"
              className="text-xs font-mono text-foreground-faint hover:text-accent transition-colors mb-8 inline-block uppercase tracking-widest"
            >
              ← Back to Blog
            </Link>
            <div className="flex items-center gap-4 text-xs font-mono text-foreground-faint mb-4">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span>•</span>
              <span>{post.readingTime}</span>
              {post.source === 'database' && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <span>By {post.authorName}</span>
                    <Badge variant="default" className="text-[10px] py-0">Community</Badge>
                  </div>
                </>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tags/${tag}`}
                  className="text-[10px] font-mono px-2 py-0.5 bg-accent-soft text-accent rounded uppercase tracking-wider hover:bg-accent hover:text-white transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </header>

          <div className="prose prose-invert max-w-none">
            {post.source === 'database' ? (
              // SECURITY: untrusted, visitor-submitted content — rendered through
              // the sanitized markdown pipeline, never through the MDX compiler.
              // See shared/lib/safe-markdown.ts for why this distinction matters.
              <div
                dangerouslySetInnerHTML={{
                  __html: await renderSafeMarkdown(post.content),
                }}
              />
            ) : (
              // Trusted first-party content authored directly in content/blog/*.mdx
              <MDXRemote
                source={post.content}
                components={mdxComponents}
                options={{
                  mdxOptions: {
                    rehypePlugins: [
                      [
                        rehypePrettyCode,
                        {
                          theme: 'github-dark',
                          keepBackground: true,
                        },
                      ],
                    ],
                  },
                }}
              />
            )}
          </div>

          {relatedPosts.length > 0 && (
            <footer className="mt-20 pt-12 border-t border-border">
              <h2 className="text-xl font-bold mb-8">Related Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {relatedPosts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
            </footer>
          )}
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <TableOfContents />
          </div>
        </aside>
      </div>
    </main>
  );
}
