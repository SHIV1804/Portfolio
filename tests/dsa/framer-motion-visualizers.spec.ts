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
    route: '/dsa/sliding-window/maximum-sum-subarray-of-size-k',
    visualizer: 'Sliding Window Visualizer',
  },
  {
    route: '/dsa/binary-search/binary-search',
    visualizer: 'Binary Search Visualizer',
  },
  {
    route: '/dsa/binary-search/first-bad-version',
    visualizer: 'Binary Search Visualizer',
  },
];

const flagshipPages = [
  '/dsa/flagship/hash-map/two-sum',
  '/dsa/flagship/sliding-window/maximum-sum-subarray-of-size-k',
];

test.describe('Framer Motion DSA consumers', () => {
  test('each pattern visualizer renders on every live problem page', async ({ page }) => {
    for (const { route, visualizer } of visualizerPages) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should load`).toBe(200);
      await expect(page.getByText(visualizer, { exact: true })).toBeVisible();
    }
  });

  test('both flagship walkthroughs render their animated array boxes', async ({ page }) => {
    for (const route of flagshipPages) {
      const response = await page.goto(route);
      expect(response?.status(), `${route} should load`).toBe(200);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.getByText('[0]', { exact: true }).first()).toBeVisible();
    }
  });
});
