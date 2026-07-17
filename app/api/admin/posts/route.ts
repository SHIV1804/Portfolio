import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/shared/lib/prisma";
import { authOptions } from "@/shared/lib/auth";
import { PostStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.post.findMany({
      where: {
        status: PostStatus.PENDING,
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
        createdAt: "desc",
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Admin posts fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
