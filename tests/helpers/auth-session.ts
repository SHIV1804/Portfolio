import { randomBytes } from 'node:crypto';
import type { BrowserContext } from '@playwright/test';
import { prisma } from '../../shared/lib/prisma';
import type { DeletionFixture } from './deletion-fixtures';
import { assertSafeTestDatabase, trackSession } from './deletion-fixtures';

export async function authenticateContext(
  context: BrowserContext,
  userId: string,
  fixture: DeletionFixture,
): Promise<void> {
  assertSafeTestDatabase();

  const sessionToken = randomBytes(32).toString('hex');
  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  trackSession(fixture, session.id);

  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const secure = baseUrl.startsWith('https://');
  await context.addCookies([{
    name: secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
    value: sessionToken,
    domain: new URL(baseUrl).hostname,
    path: '/',
    httpOnly: true,
    secure,
    sameSite: 'Lax',
  }]);
}
