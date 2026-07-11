import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrettyCode from 'rehype-pretty-code';
import { getPostBySlug, getAllPosts, BlogPost } from '@/shared/lib/blog';
import { TableOfContents, PostCard } from '@/widgets/blog';
import { mdxComponents } from '../MdxComponents';

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
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Shivam`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: ['Shivam'],
    },
  };
}

async function getRelatedPosts(currentPost: BlogPost) {
  const allPosts = await getAllPosts();
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
  const post = await getPostBySlug(slug);

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
            <div className="flex gap-4 text-xs font-mono text-foreground-faint mb-4">
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              <span>•</span>
              <span>{post.readingTime}</span>
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
