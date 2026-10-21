import { expect, test } from '@playwright/test';

const postId = 'post-auth-gate-test';

test.describe('Blog moderation API authentication gates', () => {
  test('rejects an unauthenticated deletion request', async ({ request }) => {
    const response = await request.post(`/api/posts/${postId}/deletion-request`, {
      data: {},
    });

    expect(response.status()).toBe(401);
  });

  test('rejects an unauthenticated admin hard delete', async ({ request }) => {
    const response = await request.delete(`/api/admin/posts/${postId}`);

    expect(response.status()).toBe(401);
  });

  test('rejects an unauthenticated deletion decision', async ({ request }) => {
    const response = await request.post(`/api/admin/posts/${postId}/deletion`, {
      data: { decision: 'approve' },
    });

    expect(response.status()).toBe(401);
  });

  test('rejects an unauthenticated admin posts listing', async ({ request }) => {
    const response = await request.get('/api/admin/posts');

    expect(response.status()).toBe(401);
  });

  test('reports no role without a session on the deletion status endpoint', async ({ request }) => {
    const response = await request.get(`/api/posts/${postId}/deletion-request`);

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({ role: 'none', requested: false });
  });
});
