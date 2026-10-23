import { randomUUID } from 'node:crypto';
import { BrowserContext } from '@playwright/test';
import { PrismaClient, PostStatus } from '@prisma/client';

export const SESSION_COOKIE_NAME = 'next-auth.session-token';

export type SeededRole = 'admin' | 'author' | 'other';

type SeededUser = {
  id: string;
  email: string;
  sessionToken: string;
};

type SeededPost = {
  id: string;
  slug: string;
  title: string;
};

export type DeletionWorkflowSeed = {
  admin: SeededUser;
  author: SeededUser;
  other: SeededUser;
  post: SeededPost;
  secondPost: SeededPost;
  attachSession: (context: BrowserContext, role: SeededRole) => Promise<void>;
  cleanup: () => Promise<void>;
};

const allowedDatabaseHosts = new Set(['localhost', '127.0.0.1', 'postgres']);

export function hasSafeDatabaseUrl(): boolean {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return false;

  try {
    return allowedDatabaseHosts.has(new URL(databaseUrl).hostname);
  } catch {
    return false;
  }
}

function assertSafeDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Deletion workflow tests require DATABASE_URL');
  }

  let hostname: string;
  try {
    hostname = new URL(databaseUrl).hostname;
  } catch {
    throw new Error('Deletion workflow tests require a valid DATABASE_URL');
  }

  if (!hasSafeDatabaseUrl() || !allowedDatabaseHosts.has(hostname)) {
    throw new Error(
      `Refusing to seed database at ${hostname}; only localhost, 127.0.0.1, and postgres are allowed`,
    );
  }

  return databaseUrl;
}

function futureExpiry(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

export async function seedDeletionWorkflow(): Promise<DeletionWorkflowSeed> {
  assertSafeDatabaseUrl();

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error('Deletion workflow tests require ADMIN_EMAIL');
  }

  const prisma = new PrismaClient();
  const createdUserIds: string[] = [];
  const createdPostIds: string[] = [];
  const users: Record<SeededRole, SeededUser> = {} as Record<SeededRole, SeededUser>;

  try {
    const userSpecs: Array<[SeededRole, string, string]> = [
      ['admin', adminEmail, 'Seeded Admin'],
      ['author', `deletion-author-${randomUUID()}@example.test`, 'Seeded Author'],
      ['other', `deletion-other-${randomUUID()}@example.test`, 'Seeded Other'],
    ];

    for (const [role, email, name] of userSpecs) {
      const user = await prisma.user.create({ data: { email, name } });
      const sessionToken = randomUUID();
      await prisma.session.create({
        data: {
          sessionToken,
          userId: user.id,
          expires: futureExpiry(),
        },
      });
      createdUserIds.push(user.id);
      users[role] = { id: user.id, email, sessionToken };
    }

    const postSpecs = [
      ['Seeded deletion workflow post', `deletion-workflow-${randomUUID()}`],
      ['Seeded direct deletion post', `direct-deletion-${randomUUID()}`],
    ] as const;

    const posts: SeededPost[] = [];
    for (const [title, slug] of postSpecs) {
      const post = await prisma.post.create({
        data: {
          title,
          slug,
          content: `Seeded content for ${title}`,
          status: PostStatus.APPROVED,
          publishedAt: new Date(),
          authorId: users.author.id,
        },
        select: { id: true, slug: true, title: true },
      });
      createdPostIds.push(post.id);
      posts.push(post);
    }

    return {
      admin: users.admin,
      author: users.author,
      other: users.other,
      post: posts[0],
      secondPost: posts[1],
      attachSession: async (context, role) => {
        await context.addCookies([
          {
            name: SESSION_COOKIE_NAME,
            value: users[role].sessionToken,
            domain: 'localhost',
            path: '/',
          },
        ]);
      },
      cleanup: async () => {
        await prisma.post.deleteMany({ where: { id: { in: createdPostIds } } });
        await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
        await prisma.$disconnect();
      },
    };
  } catch (error) {
    await prisma.post.deleteMany({ where: { id: { in: createdPostIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.$disconnect();
    throw error;
  }
}
