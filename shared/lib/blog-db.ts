import { prisma } from "./prisma";
import { PostStatus } from "@prisma/client";

/**
 * Fetches all community blog posts that have been APPROVED by an admin.
 * Uses a graceful fallback pattern to return an empty array if the database
 * is unavailable or the query fails.
 */
export async function getApprovedCommunityPosts() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: PostStatus.APPROVED,
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });
    return posts;
  } catch (error) {
    console.warn("Failed to fetch community posts from database:", error);
    return [];
  }
}

/**
 * Fetches a single community blog post by its slug, ensuring it is APPROVED.
 * Uses a graceful fallback pattern to return null if the database is
 * unavailable or the post is not found.
 */
export async function getApprovedCommunityPostBySlug(slug: string) {
  try {
    const post = await prisma.post.findFirst({
      where: {
        slug,
        status: PostStatus.APPROVED,
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });
    return post;
  } catch (error) {
    console.warn(`Failed to fetch community post with slug "${slug}" from database:`, error);
    return null;
  }
}
