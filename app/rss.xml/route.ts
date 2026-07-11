import RSS from 'rss';
import { getAllPosts } from '@/shared/lib/blog';
import { siteConfig } from '@/shared/config/site';

export async function GET() {
  const posts = await getAllPosts();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shivam.dev'; // Fallback if env not set

  const feed = new RSS({
    title: `${siteConfig.name}'s Blog`,
    description: siteConfig.description,
    feed_url: `${siteUrl}/rss.xml`,
    site_url: siteUrl,
    managingEditor: siteConfig.name,
    webMaster: siteConfig.name,
    language: 'en',
    pubDate: new Date().toUTCString(),
    ttl: 60,
  });

  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.excerpt,
      url: `${siteUrl}/blog/${post.slug}`,
      categories: post.tags,
      author: siteConfig.name,
      date: post.date,
    });
  });

  return new Response(feed.xml({ indent: true }), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
