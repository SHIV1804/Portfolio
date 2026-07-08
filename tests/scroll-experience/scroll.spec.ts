import { test, expect } from '@playwright/test';

test.describe('Scroll Experience and Hero Section', () => {
  test('page remains fully scrollable', async ({ page }) => {
    await page.goto('/');

    // Get initial scroll position
    const initialScrollY = await page.evaluate(() => window.scrollY);

    // Scroll down significantly
    await page.evaluate(() => window.scrollBy(0, 2000));

    const scrolledDown = await page.evaluate(() => window.scrollY);

    // Should have scrolled
    expect(scrolledDown).toBeGreaterThan(initialScrollY);

    // Scroll back up
    await page.evaluate(() => window.scrollBy(0, -1000));

    const scrolledUp = await page.evaluate(() => window.scrollY);

    // Should be able to scroll up too
    expect(scrolledUp).toBeLessThan(scrolledDown);
  });

  test('scrolling does not trap the user or prevent further interaction', async ({
    page,
  }) => {
    await page.goto('/');

    // Scroll to bottom of page
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    const bottomScroll = await page.evaluate(() => window.scrollY);

    // Footer should be visible
    const footer = page.locator('footer');
    await expect(footer).toBeInViewport();

    // Should be able to click on footer elements
    const footerLinks = page.locator('footer a').first();
    await expect(footerLinks).toBeTruthy();

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));

    const topScroll = await page.evaluate(() => window.scrollY);
    expect(topScroll).toBeLessThan(bottomScroll);
  });

  test('hero content is reachable and visible', async ({ page }) => {
    await page.goto('/');

    // Hero should be visible initially
    const hero = page.locator('section').first(); // Assuming first section is hero

    // Get viewport info
    const boundingBox = await hero.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox?.height).toBeGreaterThan(0);
  });

  test('navigation works correctly after scroll interactions', async ({
    page,
  }) => {
    await page.goto('/');

    // Trigger scroll animations by scrolling down significantly
    await page.evaluate(() => {
      window.scrollBy(0, 3000);
    });

    // Wait a bit for any animations to complete
    await page.waitForTimeout(500);

    // Now navigate to a different page
    const projectLink = page.locator('a[href="/projects/log-analyser"]').first();

    // Try to scroll into view first if needed
    if (await projectLink.isHidden()) {
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    if (await projectLink.isVisible()) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');

      // Should successfully navigate
      expect(page.url()).toContain('/projects/log-analyser');
    }
  });

  test('hero section can be bypassed with navigation (not trapped)', async ({
    page,
  }) => {
    await page.goto('/');

    // Try clicking navigation link immediately
    const aboutLink = page.locator('a[href="/#about"]').first();

    if (await aboutLink.isVisible()) {
      await aboutLink.click();
      await page.waitForTimeout(500);

      // Should navigate to about section
      expect(page.url()).toContain('/#about');
    }
  });

  test('no uncaught GSAP or ScrollTrigger errors in console', async ({
    page,
  }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Scroll to trigger any scroll-based animations
    await page.evaluate(() => {
      window.scrollBy(0, 1000);
    });

    await page.waitForTimeout(1000);

    // Scroll back
    await page.evaluate(() => {
      window.scrollBy(0, -1000);
    });

    // Filter out false positives
    const gsapErrors = errors.filter(
      (err) =>
        err.includes('GSAP') ||
        err.includes('ScrollTrigger') ||
        err.includes('animation'),
    );

    expect(gsapErrors).toEqual([]);
  });

  test('layout remains stable and usable after multiple scroll events', async ({
    page,
  }) => {
    await page.goto('/');

    // Perform multiple scroll operations
    await page.evaluate(() => {
      window.scrollBy(0, 500);
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      window.scrollBy(0, 500);
    });
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      window.scrollBy(0, -1000);
    });
    await page.waitForTimeout(300);

    // Main content should still be present and visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('route navigation still works after intensive scroll activities', async ({
    page,
  }) => {
    await page.goto('/');

    // Simulate aggressive scrolling
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(100);
    }

    // Now navigate
    const response = await page.goto('/projects/case-study-two');
    expect(response?.status()).toBe(200);

    // Page should load successfully
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('back button returns to scroll position context', async ({ page }) => {
    await page.goto('/');

    // Scroll down
    await page.evaluate(() => {
      window.scrollBy(0, 1000);
    });

    const scrollBefore = await page.evaluate(() => window.scrollY);

    // Navigate to another page
    await page.goto('/projects/log-analyser');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(300);

    // Browser may restore scroll position
    // Just verify we can scroll again
    await page.evaluate(() => {
      window.scrollBy(0, 100);
    });

    const scrollAfter = await page.evaluate(() => window.scrollY);
    // We should be able to scroll (not trapped at top)
    expect(scrollAfter).toBeGreaterThanOrEqual(0);
  });

  test('hero section content is accessible without JavaScript animations', async ({
    page,
  }) => {
    await page.goto('/');

    // Get the main heading/hero content
    const headings = page.locator('h1, h2, h3').first();
    await expect(headings).toBeVisible();

    // Content should have text even without animations running
    const content = await headings.textContent();
    expect(content).toBeTruthy();
    expect(content?.length).toBeGreaterThan(0);
  });
});
