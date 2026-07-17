import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/shared/lib/prisma";
import { authOptions } from "@/shared/lib/auth";
import { PostStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log('[DEBUG-BACKEND] Received id:', id, 'typeof:', typeof id);
    const body = await req.json();
    const { status } = body;

    if (![PostStatus.APPROVED, PostStatus.REJECTED].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updateData: { status: PostStatus; publishedAt?: Date } = { status };
    if (status === PostStatus.APPROVED) {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Admin post update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
