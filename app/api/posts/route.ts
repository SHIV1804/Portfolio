import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/shared/lib/prisma";
import { PostStatus } from "@prisma/client";

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
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    console.log(`Generated slug: \${slug}`);

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
