import { randomBytes } from 'node:crypto';
import { PostStatus } from '../../generated/prisma/client';
import { prisma } from '../../shared/lib/prisma';

const SAFE_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);

export function assertSafeTestDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.toLowerCase().includes('neon')) {
    throw new Error('Deletion E2E tests require a local or CI PostgreSQL DATABASE_URL.');
  }

  let hostname: string;
  try {
    hostname = new URL(databaseUrl).hostname.toLowerCase();
  } catch {
    throw new Error('Deletion E2E tests require a valid local or CI PostgreSQL DATABASE_URL.');
  }

  if (!SAFE_DATABASE_HOSTS.has(hostname)) {
    throw new Error('Deletion E2E tests refuse remote or non-disposable database hosts.');
  }
}

type SeededUser = { id: string; email: string };
type SeededPost = { id: string; slug: string };

export type DeletionFixture = {
  author: SeededUser;
  otherUser: SeededUser;
  admin: SeededUser;
  approved: SeededPost;
  pending: SeededPost;
  rejected: SeededPost;
  createdUserIds: string[];
  createdPostIds: string[];
  sessionIds: string[];
};

export async function seedDeletionFixture(): Promise<DeletionFixture> {
  assertSafeTestDatabase();

  const runPrefix = `pw-delete-${Date.now()}-${randomBytes(6).toString('hex')}`;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error('Deletion E2E tests require ADMIN_EMAIL.');
  }

  const createdUserIds: string[] = [];
  const createdPostIds: string[] = [];
  const sessionIds: string[] = [];

  const createUser = async (email: string, name: string): Promise<SeededUser> => {
    const user = await prisma.user.create({ data: { email, name } });
    createdUserIds.push(user.id);
    return { id: user.id, email: user.email! };
  };

  const author = await createUser(`${runPrefix}-author@example.test`, `${runPrefix} author`);
  const otherUser = await createUser(`${runPrefix}-other@example.test`, `${runPrefix} other`);
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  const admin = existingAdmin
    ? { id: existingAdmin.id, email: existingAdmin.email! }
    : await createUser(adminEmail, `${runPrefix} admin`);

  const createPost = async (status: PostStatus, label: string): Promise<SeededPost> => {
    const post = await prisma.post.create({
      data: {
        authorId: author.id,
        title: `${runPrefix} ${label}`,
        slug: `${runPrefix}-${label.toLowerCase()}`,
        content: `Deletion E2E fixture: ${runPrefix} ${label}`,
        status,
        publishedAt: status === PostStatus.APPROVED ? new Date() : null,
      },
    });
    createdPostIds.push(post.id);
    return { id: post.id, slug: post.slug };
  };

  return {
    author,
    otherUser,
    admin,
    approved: await createPost(PostStatus.APPROVED, 'approved'),
    pending: await createPost(PostStatus.PENDING, 'pending'),
    rejected: await createPost(PostStatus.REJECTED, 'rejected'),
    createdUserIds,
    createdPostIds,
    sessionIds,
  };
}

export async function cleanupDeletionFixture(fixture: DeletionFixture): Promise<void> {
  assertSafeTestDatabase();
  await prisma.session.deleteMany({ where: { id: { in: fixture.sessionIds } } });
  await prisma.post.deleteMany({ where: { id: { in: fixture.createdPostIds } } });
  await prisma.user.deleteMany({ where: { id: { in: fixture.createdUserIds } } });
}

export function trackSession(fixture: DeletionFixture, sessionId: string): void {
  fixture.sessionIds.push(sessionId);
}
