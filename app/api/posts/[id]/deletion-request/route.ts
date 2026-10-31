import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PostStatus } from "@/shared/lib/post-status";
import { authOptions } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";

const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 5;
const requestRateLimit = new Map<string, { count: number; windowStartedAt: number }>();

interface RouteContext {
  params: Promise<{ id: string }>;
}

function isAdmin(session: { user?: { isAdmin?: boolean } } | null) {
  return session?.user?.isAdmin === true;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ role: "none", requested: false });
  }

  if (isAdmin(session)) {
    return NextResponse.json({ role: "admin", requested: false });
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      authorId: true,
      status: true,
      deletionRequestedAt: true,
    },
  });

  if (
    !post ||
    post.authorId !== session.user.id ||
    post.status !== PostStatus.APPROVED
  ) {
    return NextResponse.json({ role: "none" });
  }

  return NextResponse.json({
    role: "author",
    requested: post.deletionRequestedAt !== null,
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      authorId: true,
      status: true,
      deletionRequestedAt: true,
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (isAdmin(session) || post.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (post.status !== PostStatus.APPROVED) {
    return NextResponse.json(
      { error: "Only approved posts can be deleted" },
      { status: 409 },
    );
  }

  if (post.deletionRequestedAt !== null) {
    return NextResponse.json({ requested: true });
  }

  let body: { reason?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // An omitted body is equivalent to an omitted optional reason.
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.reason !== undefined && typeof body.reason !== "string") {
    return NextResponse.json({ error: "Reason must be plain text" }, { status: 400 });
  }

  const reason = typeof body.reason === "string" ? body.reason.trim() : null;
  if (reason !== null && reason.length > 500) {
    return NextResponse.json(
      { error: "Reason must be 500 characters or fewer" },
      { status: 400 },
    );
  }

  const now = Date.now();
  const currentLimit = requestRateLimit.get(session.user.id);
  if (currentLimit && now - currentLimit.windowStartedAt < RATE_LIMIT_WINDOW) {
    if (currentLimit.count >= MAX_REQUESTS_PER_HOUR) {
      return NextResponse.json(
        { error: "Too many deletion requests. Please try again later." },
        { status: 429 },
      );
    }
    currentLimit.count += 1;
  } else {
    requestRateLimit.set(session.user.id, { count: 1, windowStartedAt: now });
  }

  await prisma.post.update({
    where: { id },
    data: {
      deletionRequestedAt: new Date(),
      deletionReason: reason,
    },
  });

  return NextResponse.json({ requested: true });
}
