import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/lib/prisma";

/**
 * Deletes a database-backed community post and invalidates every cache entry
 * that can expose its content or its presence in the blog indexes.
 */
export async function deleteCommunityPost(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!post) {
    return null;
  }

  await prisma.post.delete({ where: { id } });

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/blog/tags/[tag]", "page");
  revalidatePath("/blog/tags/Community");
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");

  return post;
}
