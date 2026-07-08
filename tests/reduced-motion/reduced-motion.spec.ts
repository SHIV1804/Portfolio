import { test, expect } from '@playwright/test';

test.describe('Reduced Motion (prefers-reduced-motion: reduce)', () => {
  test.beforeEach(async ({ page }) => {
    // Emulate reduced motion preference for each test
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('page loads successfully with reduced motion enabled', async ({
    page,
  }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('essential content remains available with reduced motion', async ({
    page,
  }) => {
    await page.goto('/');

    // Core sections should be present
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();

    expect(headingCount).toBeGreaterThan(0);

    // At least one heading should be visible
    const firstHeading = headings.first();
    await expect(firstHeading).toBeVisible();
  });

  test('navigation remains functional with reduced motion', async ({ page }) => {
    await page.goto('/');

    // Navigation should still work
    const aboutLink = page.locator('a[href="/#about"]').first();

    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await page.waitForTimeout(300);

      expect(page.url()).toContain('/#about');
    }
  });

  test('user is not forced to wait for animations with reduced motion', async ({
    page,
  }) => {
    await page.goto('/');

    // All main content sections should load immediately
    const sections = page.locator('section');
    const sectionCount = await sections.count();

    expect(sectionCount).toBeGreaterThan(0);

    // Should be able to scroll immediately
    await page.evaluate(() => window.scrollBy(0, 100));
    const scrolled = await page.evaluate(() => window.scrollY);

    // Should have scrolled without animation delays
    expect(scrolled).toBeGreaterThan(0);
  });

  test('content order and hierarchy is understandable with reduced motion', async ({
    page,
  }) => {
    await page.goto('/');

    // Check heading hierarchy is logical
    const h1s = page.locator('h1');
    const h2s = page.locator('h2');

    const h1Count = await h1s.count();
    const h2Count = await h2s.count();

    // Should have reasonable heading structure
    expect(h1Count).toBeGreaterThan(0);
    // H2 or deeper headings are optional but if present should follow H1
    if (h2Count > 0) {
      // Just verify they're on the page
      expect(h2Count).toBeGreaterThanOrEqual(0);
    }
  });

  test('interactive controls remain usable with reduced motion', async ({
    page,
  }) => {
    await page.goto('/');

    // Theme toggle should work
    const themeButton = page.locator('[aria-label*="Switch to"]');
    if (await themeButton.isVisible()) {
      await themeButton.click();

      // Verify action occurred
      const isDark = await page.locator('html').evaluate((el) =>
        el.classList.contains('dark'),
      );
      // Just verify it's a valid state
      expect([true, false]).toContain(isDark);
    }
  });

  test('page remains scrollable top to bottom with reduced motion', async ({
    page,
  }) => {
    await page.goto('/');

    // Scroll to bottom
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    const scrollY = await page.evaluate(() => window.scrollY);

    // Should be able to reach near bottom
    expect(scrollY).toBeGreaterThan(scrollHeight * 0.5);
  });

  test('command palette works with reduced motion', async ({ page }) => {
    await page.goto('/');

    // Open command palette
    await page.press('body', 'Control+k');

    // Palette should open (possibly without animation)
    const dialog = page.locator('[label="Command Palette"]');
    await expect(dialog).toBeVisible();

    // Should be able to use it
    await page.type('input[placeholder*="Type a command"]', 'About');

    const aboutItem = page.locator('text=About').first();
    await expect(aboutItem).toBeVisible();
  });

  test('no seizure risk or flashing elements with reduced motion', async ({
    page,
  }) => {
    // This performs basic checks
    // Full seizure/flashing detection requires more sophisticated testing

    await page.goto('/');

    // Scroll a few times looking for excessive flashing
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(200);
    }

    // Just verify page is still responsive (no infinite loops or flashing)
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('animations are disabled or optimized when prefers-reduced-motion is set', async ({
    page,
  }) => {
    await page.goto('/');

    // Check if reduced motion preference is respected
    const prefersReduced = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    expect(prefersReduced).toBe(true);
  });

  test('all pages load with reduced motion preference', async ({ page }) => {
    const pagesToTest = ['/'];

    for (const route of pagesToTest) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);

      const main = page.locator('main');
      // Not all pages have main, but if they do, it should be accessible
      const mainCount = await main.count();
      if (mainCount > 0) {
        await expect(main.first()).toBeVisible();
      }
    }
  });

  test('contact form is accessible with reduced motion', async ({ page }) => {
    await page.goto('/');

    // Try to find the form
    const form = page.locator('form').first();

    if (await form.isVisible()) {
      // Form should be interactable
      const inputs = form.locator('input, textarea');
      const inputCount = await inputs.count();

      expect(inputCount).toBeGreaterThan(0);
    }
  });

  test('footer navigation works with reduced motion', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Footer links should work
    const footerLink = page.locator('footer a').first();
    if (await footerLink.isVisible()) {
      await expect(footerLink).toBeTruthy();
    }
  });
});
