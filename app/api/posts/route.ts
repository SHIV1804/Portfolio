import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/shared/lib/prisma";
import { PostStatus } from "@prisma/client";
import { authOptions } from "@/shared/lib/auth";

// Simple in-memory rate limiting (resets on redeploy)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 3600000; // 1 hour
const MAX_PENDING_POSTS = 3;

// Helper to generate slug from title
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const now = Date.now();

    // 1. In-memory Rate Limiting (Cooldown/Abuse guard)
    const limit = rateLimitMap.get(userId);
    if (limit) {
      if (now - limit.lastReset < RATE_LIMIT_WINDOW) {
        if (limit.count >= MAX_PENDING_POSTS) {
          return NextResponse.json(
            { error: "Submission limit reached. Please try again in an hour." },
            { status: 429 }
          );
        }
        limit.count++;
      } else {
        rateLimitMap.set(userId, { count: 1, lastReset: now });
      }
    } else {
      rateLimitMap.set(userId, { count: 1, lastReset: now });
    }

    // 2. Database-backed check: Max PENDING posts at once
    const pendingCount = await prisma.post.count({
      where: {
        authorId: userId,
        status: PostStatus.PENDING,
      },
    });

    if (pendingCount >= MAX_PENDING_POSTS) {
      return NextResponse.json(
        { error: "You already have the maximum number of pending posts. Please wait for them to be reviewed." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content } = body;

    // Server-side validation
    if (!title || typeof title !== "string" || title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { error: "Title must be between 5 and 100 characters" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.length < 50) {
      return NextResponse.json(
        { error: "Content must be at least 50 characters" },
        { status: 400 }
      );
    }

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let slugCounter = 1;

    // Ensure slug uniqueness
    while (true) {
      const existing = await prisma.post.findUnique({
        where: { slug },
      });
      if (!existing) break;
      slug = `\${baseSlug}-\${slugCounter}`;
      slugCounter++;
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        slug,
        authorId: (session.user as { id: string }).id,
        status: PostStatus.PENDING,
      },
    });

    return NextResponse.json(
      { message: "Your post has been submitted for review", post },
      { status: 201 }
    );
  } catch (error) {
    console.error("Post submission error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
