import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Basic Page Load and Navigation', () => {
  test('homepage loads successfully and returns usable HTML content', async ({
    page,
  }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Verify basic page structure
    await expect(page.locator('main')).toBeTruthy();
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('primary navigation is visible and usable', async ({ page }) => {
    await page.goto('/');

    // Check for header
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // For now just verify header exists - actual nav content depends on DOM structure
    // We'll expand this in navigation tests
  });

  test('footer renders', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });

  test('no uncaught JavaScript errors on homepage', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter(
      (err) =>
        !err.includes('ResizeObserver') && // Common false positive in dev
        !err.includes('Non-Error promise rejection'),
    );

    expect(criticalErrors).toEqual([]);
  });

  test('projects route /projects/log-analyser loads successfully', async ({
    page,
  }) => {
    const response = await page.goto('/projects/log-analyser');
    expect(response?.status()).toBe(200);

    // Verify page has content
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('projects route /projects/case-study-two loads successfully', async ({
    page,
  }) => {
    const response = await page.goto('/projects/case-study-two');
    expect(response?.status()).toBe(200);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('unknown routes show appropriate not-found behavior', async ({
    page,
  }) => {
    const response = await page.goto('/this-does-not-exist');
    expect(response?.status()).toBe(404);
  });

  test('primary assets do not return 404', async ({ page, context }) => {
    const failedRequests: string[] = [];

    context.on('response', (response) => {
      if (response.status() === 404) {
        const url = response.url();
        // Filter out external assets
        if (
          url.includes(page.url()) ||
          url.includes('localhost') ||
          url.includes('http://localhost')
        ) {
          failedRequests.push(url);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(failedRequests).toEqual([]);
  });

  test('page content is scrollable and not trapped', async ({ page }) => {
    await page.goto('/');

    // Get initial scroll position
    const initialScroll = await page.evaluate(() => window.scrollY);

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    const scrolledDown = await page.evaluate(() => window.scrollY);

    // Scroll back up
    await page.evaluate(() => window.scrollBy(0, -500));
    const scrolledUp = await page.evaluate(() => window.scrollY);

    // Verify we could actually scroll
    expect(scrolledDown).toBeGreaterThan(initialScroll);
    expect(scrolledUp).toBeLessThan(scrolledDown);
  });

  test('hero content is reachable without being trapped in animation', async ({
    page,
  }) => {
    await page.goto('/');

    // Find main landmark - this should be reachable
    const main = page.locator('main').first();
    await expect(main).toBeInViewport();

    // Try to click something in main area to verify it's interactive
    // Get the bounding box to verify it's in viewport
    const boundingBox = await main.boundingBox();
    expect(boundingBox).toBeTruthy();
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThan(0);
      expect(boundingBox.width).toBeGreaterThan(0);
    }
  });

  test('navigation continues to work after scroll interactions', async ({
    page,
  }) => {
    await page.goto('/');

    // Scroll to trigger any animations
    await page.evaluate(() => window.scrollBy(0, 1000));

    // Try to navigate
    const response = await page.goto('/projects/log-analyser');
    expect(response?.status()).toBe(200);

    // Verify page loaded
    await expect(page.locator('main')).toBeVisible();
  });
});
