import { getAllPosts } from '@/shared/lib/blog';

import { BlogSearch } from './BlogSearch';

export const metadata = {
  title: 'Blog | Shivam',
  description: 'Thoughts on systems engineering, learning, and software development.',
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Blog</h1>
        <p className="text-foreground-muted max-w-2xl">
          A collection of thoughts, technical deep-dives, and reflections on engineering.
        </p>
      </header>

      <BlogSearch initialPosts={posts} />
    </main>
  );
}
