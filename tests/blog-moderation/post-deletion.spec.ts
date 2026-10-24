import { expect, test, type BrowserContext } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import { prisma } from '../../shared/lib/prisma';
import {
  cleanupDeletionFixture,
  seedDeletionFixture,
  type DeletionFixture,
} from '../helpers/deletion-fixtures';
import { authenticateContext } from '../helpers/auth-session';

test.describe('Community post deletion flow', () => {
  test.describe.configure({ mode: 'serial' });
  let fixture: DeletionFixture;

  test.beforeEach(async () => {
    fixture = await seedDeletionFixture();
  });

  test.afterEach(async () => {
    await cleanupDeletionFixture(fixture);
  });

  async function withSession(
    browserContext: BrowserContext,
    userId: string,
  ): Promise<APIRequestContext> {
    await authenticateContext(browserContext, userId, fixture);
    return browserContext.request;
  }

  test('author deletion requests are authorized and idempotent', async ({ browser, request }) => {
    const authorContext = await browser.newContext();
    const authorApi = await withSession(authorContext, fixture.author.id);

    const first = await authorApi.post(`/api/posts/${fixture.approved.id}/deletion-request`, {
      data: { reason: 'Please remove this test post.' },
    });
    expect(first.status()).toBe(200);
    await expect(first.json()).resolves.toEqual({ requested: true });

    const stored = await prisma.post.findUnique({
      where: { id: fixture.approved.id },
      select: { deletionRequestedAt: true, deletionReason: true },
    });
    expect(stored?.deletionRequestedAt).not.toBeNull();
    expect(stored?.deletionReason).toBe('Please remove this test post.');

    const duplicate = await authorApi.post(`/api/posts/${fixture.approved.id}/deletion-request`, {
      data: { reason: 'A different reason must not overwrite the first request.' },
    });
    expect(duplicate.status()).toBe(200);
    await expect(duplicate.json()).resolves.toEqual({ requested: true });

    const afterDuplicate = await prisma.post.findUnique({
      where: { id: fixture.approved.id },
      select: { deletionRequestedAt: true, deletionReason: true },
    });
    expect(afterDuplicate?.deletionRequestedAt).not.toBeNull();
    expect(afterDuplicate?.deletionReason).toBe('Please remove this test post.');

    const otherContext = await browser.newContext();
    const otherApi = await withSession(otherContext, fixture.otherUser.id);
    const nonAuthor = await otherApi.post(`/api/posts/${fixture.approved.id}/deletion-request`, {
      data: {},
    });
    expect(nonAuthor.status()).toBe(403);

    const unauthenticated = await request.post(`/api/posts/${fixture.approved.id}/deletion-request`, {
      data: {},
    });
    expect(unauthenticated.status()).toBe(401);

    const pending = await authorApi.post(`/api/posts/${fixture.pending.id}/deletion-request`, {
      data: {},
    });
    expect(pending.status()).toBe(409);

    const rejected = await authorApi.post(`/api/posts/${fixture.rejected.id}/deletion-request`, {
      data: {},
    });
    expect(rejected.status()).toBe(409);

    await otherContext.close();
    await authorContext.close();
  });

  test('admin denies a request and clears its stored request state', async ({ browser }) => {
    const authorContext = await browser.newContext();
    const authorApi = await withSession(authorContext, fixture.author.id);
    await expect(
      (await authorApi.post(`/api/posts/${fixture.approved.id}/deletion-request`, { data: {} })).status(),
    ).toBe(200);

    const adminContext = await browser.newContext();
    const adminApi = await withSession(adminContext, fixture.admin.id);
    const deny = await adminApi.post(`/api/admin/posts/${fixture.approved.id}/deletion`, {
      data: { decision: 'deny' },
    });
    expect(deny.status()).toBe(200);
    await expect(deny.json()).resolves.toEqual({ denied: true });

    const post = await prisma.post.findUnique({
      where: { id: fixture.approved.id },
      select: { id: true, deletionRequestedAt: true, deletionReason: true },
    });
    expect(post?.id).toBe(fixture.approved.id);
    expect(post?.deletionRequestedAt).toBeNull();
    expect(post?.deletionReason).toBeNull();

    await adminContext.close();
    await authorContext.close();
  });

  test('authenticated non-admin cannot use admin deletion endpoints', async ({ browser }) => {
    const otherContext = await browser.newContext();
    const otherApi = await withSession(otherContext, fixture.otherUser.id);

    const decision = await otherApi.post(`/api/admin/posts/${fixture.approved.id}/deletion`, {
      data: { decision: 'approve' },
    });
    expect(decision.status()).toBe(401);

    const hardDelete = await otherApi.delete(`/api/admin/posts/${fixture.approved.id}`);
    expect(hardDelete.status()).toBe(401);

    await expect(
      prisma.post.findUnique({ where: { id: fixture.approved.id }, select: { id: true } }),
    ).resolves.toEqual({ id: fixture.approved.id });

    await otherContext.close();
  });

  test('admin approval hard-deletes the approved post', async ({ browser }) => {
    const authorContext = await browser.newContext();
    const authorApi = await withSession(authorContext, fixture.author.id);
    await expect(
      (await authorApi.post(`/api/posts/${fixture.approved.id}/deletion-request`, { data: {} })).status(),
    ).toBe(200);

    const adminContext = await browser.newContext();
    const adminApi = await withSession(adminContext, fixture.admin.id);
    const beforeApproval = await adminContext.request.get(`/blog/${fixture.approved.slug}`);
    expect(beforeApproval.status()).toBe(200);

    const approve = await adminApi.post(`/api/admin/posts/${fixture.approved.id}/deletion`, {
      data: { decision: 'approve' },
    });
    expect(approve.status()).toBe(200);
    await expect(approve.json()).resolves.toEqual({ deleted: true });

    await expect(
      prisma.post.findUnique({ where: { id: fixture.approved.id }, select: { id: true } }),
    ).resolves.toBeNull();

    // /blog is cached, while sitemap.xml and rss.xml read only local MDX posts.
    const postPage = await adminContext.request.get(`/blog/${fixture.approved.slug}`);
    expect(postPage.status()).toBe(404);

    await adminContext.close();
    await authorContext.close();
  });

  test('admin directly hard-deletes an approved post', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const adminApi = await withSession(adminContext, fixture.admin.id);

    const hardDelete = await adminApi.delete(`/api/admin/posts/${fixture.approved.id}`);
    expect(hardDelete.status()).toBe(200);
    await expect(hardDelete.json()).resolves.toEqual({ deleted: true });

    await expect(
      prisma.post.findUnique({ where: { id: fixture.approved.id }, select: { id: true } }),
    ).resolves.toBeNull();

    const postPage = await adminContext.request.get(`/blog/${fixture.approved.slug}`);
    expect(postPage.status()).toBe(404);

    await adminContext.close();
  });
});
