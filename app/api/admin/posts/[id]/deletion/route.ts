import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import { deleteCommunityPost } from "@/shared/lib/delete-community-post";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    let body: { decision?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (body.decision !== "approve" && body.decision !== "deny") {
      return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
      select: { deletionRequestedAt: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.deletionRequestedAt) {
      return NextResponse.json(
        { error: "No deletion request exists for this post" },
        { status: 409 },
      );
    }

    if (body.decision === "approve") {
      await deleteCommunityPost(id);
      return NextResponse.json({ deleted: true });
    }

    await prisma.post.update({
      where: { id },
      data: {
        deletionRequestedAt: null,
        deletionReason: null,
      },
    });

    return NextResponse.json({ denied: true });
  } catch (error) {
    console.error("Admin deletion decision error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
