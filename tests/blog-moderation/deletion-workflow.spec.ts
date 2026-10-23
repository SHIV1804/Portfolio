import { expect, test } from '@playwright/test';
import {
  hasSafeDatabaseUrl,
  seedDeletionWorkflow,
  type DeletionWorkflowSeed,
} from '../helpers/seed';

test.describe('Post deletion workflow with seeded sessions', () => {
  test.skip(
    !hasSafeDatabaseUrl(),
    'Requires DATABASE_URL on localhost, 127.0.0.1, or postgres; refusing to seed any other database',
  );
  test.describe.configure({ mode: 'serial' });

  let seed: DeletionWorkflowSeed | undefined;
  const reason = 'The seeded author no longer wants this post published.';

  test.beforeAll(async () => {
    seed = await seedDeletionWorkflow();
  });

  test.afterAll(async () => {
    try {
      await seed?.cleanup();
    } finally {
      seed = undefined;
    }
  });

  test('signed-out visitors see no deletion controls or deletion-request calls', async ({ page }) => {
    if (!seed) throw new Error('Seed fixture was not initialized');
    let deletionRequestCalls = 0;
    page.on('request', (request) => {
      if (request.url().includes(`/api/posts/${seed?.post.id}/deletion-request`)) {
        deletionRequestCalls += 1;
      }
    });

    await page.goto(`/blog/${seed.post.slug}`);
    await expect(page.getByRole('heading', { name: seed.post.title })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Request deletion' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Delete post' })).toHaveCount(0);
    expect(deletionRequestCalls).toBe(0);
  });

  test('another authenticated user sees no deletion controls', async ({ browser }) => {
    if (!seed) throw new Error('Seed fixture was not initialized');
    const context = await browser.newContext();
    try {
      await seed.attachSession(context, 'other');
      const page = await context.newPage();
      await page.goto(`/blog/${seed.post.slug}`);
      await expect(page.getByRole('heading', { name: seed.post.title })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Request deletion' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Delete post' })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test('API authorization rejects non-author and admin deletion actions', async ({ browser }) => {
    if (!seed) throw new Error('Seed fixture was not initialized');
    const authorContext = await browser.newContext();
    const otherContext = await browser.newContext();
    const adminContext = await browser.newContext();
    try {
      await seed.attachSession(authorContext, 'author');
      await seed.attachSession(otherContext, 'other');
      await seed.attachSession(adminContext, 'admin');

      const authorDelete = await authorContext.request.delete(`/api/admin/posts/${seed.post.id}`);
      expect([401, 403]).toContain(authorDelete.status());

      const otherRequest = await otherContext.request.post(
        `/api/posts/${seed.post.id}/deletion-request`,
        { data: { reason: 'Not the author' } },
      );
      expect(otherRequest.status()).toBe(403);

      const adminRequest = await adminContext.request.post(
        `/api/posts/${seed.post.id}/deletion-request`,
        { data: { reason: 'Admins cannot request deletion' } },
      );
      expect(adminRequest.status()).toBe(403);

      const longReason = await authorContext.request.post(
        `/api/posts/${seed.post.id}/deletion-request`,
        { data: { reason: 'x'.repeat(501) } },
      );
      expect(longReason.status()).toBe(400);
    } finally {
      await Promise.all([authorContext.close(), otherContext.close(), adminContext.close()]);
    }
  });

  test('author requests deletion, an admin denies it, then approves a second request', async ({ browser }) => {
    if (!seed) throw new Error('Seed fixture was not initialized');
    const authorContext = await browser.newContext();
    const adminContext = await browser.newContext();
    try {
      await seed.attachSession(authorContext, 'author');
      await seed.attachSession(adminContext, 'admin');
      const authorPage = await authorContext.newPage();
      const adminPage = await adminContext.newPage();

      await authorPage.goto(`/blog/${seed.post.slug}`);
      await expect(authorPage.getByRole('button', { name: 'Request deletion' })).toBeVisible();
      await authorPage.getByRole('button', { name: 'Request deletion' }).click();
      await authorPage.getByLabel('Optional reason').fill(reason);
      await authorPage.getByRole('button', { name: 'Submit request' }).click();
      await expect(authorPage.getByText('Deletion requested. An admin will review it.')).toBeVisible();
      await expect(authorPage.getByRole('button', { name: 'Request deletion' })).toHaveCount(0);
      await authorPage.reload();
      await expect(authorPage.getByText('Deletion requested. An admin will review it.')).toBeVisible();
      await expect(authorPage.getByRole('button', { name: 'Request deletion' })).toHaveCount(0);

      await adminPage.goto('/admin/posts');
      await expect(adminPage.getByRole('heading', { name: 'Moderation Dashboard' })).toBeVisible();
      await expect(adminPage.getByText(reason)).toBeVisible();
      await adminPage.getByRole('button', { name: 'Deny' }).click();
      await expect(adminPage.getByText('No deletion requests to review.')).toBeVisible();

      await authorPage.goto(`/blog/${seed.post.slug}`);
      await expect(authorPage.getByRole('button', { name: 'Request deletion' })).toBeVisible();
      await authorPage.getByRole('button', { name: 'Request deletion' }).click();
      await authorPage.getByLabel('Optional reason').fill(reason);
      await authorPage.getByRole('button', { name: 'Submit request' }).click();
      await expect(authorPage.getByText('Deletion requested. An admin will review it.')).toBeVisible();

      await adminPage.goto('/admin/posts');
      await expect(adminPage.getByText(reason)).toBeVisible();
      adminPage.once('dialog', (dialog) => dialog.accept());
      await adminPage.getByRole('button', { name: 'Approve deletion' }).click();
      await expect(adminPage.getByText('No deletion requests to review.')).toBeVisible();

      const deletedPost = await authorPage.request.get(`/blog/${seed.post.slug}`);
      expect(deletedPost.status()).toBe(404);
      const adminPostsResponse = await adminPage.request.get('/api/admin/posts');
      expect(adminPostsResponse.ok()).toBeTruthy();
      const adminPosts = (await adminPostsResponse.json()) as {
        posts: Array<{ id: string }>;
        deletionRequests: Array<{ id: string }>;
      };
      expect(adminPosts.posts.some((post) => post.id === seed?.post.id)).toBe(false);
      expect(adminPosts.deletionRequests.some((post) => post.id === seed?.post.id)).toBe(false);
    } finally {
      await Promise.all([authorContext.close(), adminContext.close()]);
    }
  });

  test('admin direct Delete post removes a second seeded post', async ({ browser }) => {
    if (!seed) throw new Error('Seed fixture was not initialized');
    const context = await browser.newContext();
    try {
      await seed.attachSession(context, 'admin');
      const page = await context.newPage();
      await page.goto(`/blog/${seed.secondPost.slug}`);
      await expect(page.getByRole('button', { name: 'Delete post' })).toBeVisible();
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Delete post' }).click();
      await expect(page).toHaveURL(/\/blog$/);

      const deletedPost = await page.request.get(`/blog/${seed.secondPost.slug}`);
      expect(deletedPost.status()).toBe(404);
    } finally {
      await context.close();
    }
  });
});
