import { expect, test } from '@playwright/test';

const visualizerPages = [
  {
    route: '/dsa/two-pointers/two-sum-ii-input-array-is-sorted',
    visualizer: 'Two Pointers Visualizer',
  },
  {
    route: '/dsa/sliding-window/longest-substring-without-repeating',
    visualizer: 'Sliding Window Visualizer',
  },
  {
    route: '/dsa/binary-search/binary-search',
    visualizer: 'Binary Search Visualizer',
  },
];

test.describe('Framer Motion DSA consumers', () => {
  test('each pattern visualizer renders on its real problem page', async ({ page }) => {
    for (const { route, visualizer } of visualizerPages) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should load`).toBe(200);
      await expect(page.getByText(visualizer, { exact: true })).toBeVisible();
    }
  });

  test('the flagship walkthrough renders its animated array boxes', async ({ page }) => {
    const response = await page.goto('/dsa/flagship/hash-map/two-sum');
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: 'Two Sum' })).toBeVisible();
    await expect(page.getByText('[0]', { exact: true }).first()).toBeVisible();
  });
});
