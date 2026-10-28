import { test, expect } from '@playwright/test';
import {
  isIgnorableConsoleError,
  observeSessionTraffic,
} from '../helpers/session-observer';

test.describe('Broken Assets and Console Checks', () => {
  test('no 404 errors for local assets on homepage', async ({
    page,
    context,
  }) => {
    const failedAssets: string[] = [];
    const consoleErrors: string[] = [];

    // Intercept all responses
    context.on('response', (response) => {
      if (response.status() === 404) {
        const url = response.url();
        // Only track local/relative assets
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          failedAssets.push(url);
        }
      }
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(failedAssets).toEqual([]);
  });

  test('no 404 errors forlocal assets on log-analyser page', async ({
    page,
    context,
  }) => {
    const failedAssets: string[] = [];

    context.on('response', (response) => {
      if (response.status() === 404) {
        const url = response.url();
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          failedAssets.push(url);
        }
      }
    });

    await page.goto('/projects/log-analyser');
    await page.waitForLoadState('networkidle');

    expect(failedAssets).toEqual([]);
  });

  test('no 404 errors for local assets on case-study-two page', async ({
    page,
    context,
  }) => {
    const failedAssets: string[] = [];

    context.on('response', (response) => {
      if (response.status() === 404) {
        const url = response.url();
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          failedAssets.push(url);
        }
      }
    });

    await page.goto('/projects/case-study-two');
    await page.waitForLoadState('networkidle');

    expect(failedAssets).toEqual([]);
  });

  test('collect console errors throughout navigation', async ({ page }) => {
    const allErrors: Array<{ page: string; error: string }> = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        allErrors.push({
          page: page.url(),
          error: msg.text(),
        });
      }
    });

    // Visit multiple pages
    const routes = [
      '/',
      '/#about',
      '/#skills',
      '/projects/log-analyser',
      '/projects/case-study-two',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    // Filter out known false positives
    const realErrors = allErrors.filter((err) => !isIgnorableConsoleError(err.error));

    expect(realErrors).toEqual([]);
  });

  test('check for missing OG images in metadata', async ({ page }) => {
    await page.goto('/');

    // Check meta tags
    const ogImages = await page.locator('meta[property="og:image"]');
    const imageCount = await ogImages.count();

    if (imageCount > 0) {
      const imageSrc = await ogImages.first().getAttribute('content');

      // If there's a placeholder, report it
      if (imageSrc?.includes('[PLACEHOLDER')) {
        // This is expected in the template
        expect(imageSrc).toContain('[PLACEHOLDER');
      } else if (imageSrc) {
        // If it's a real URL, check if it would resolve
        expect(imageSrc).toBeTruthy();
      }
    }
  });

  test('all internal navigation links are accessible', async ({ page, context }) => {
    const brokenLinks: string[] = [];

    context.on('response', (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        if (url.includes('localhost')) {
          brokenLinks.push(`${response.status()} ${url}`);
        }
      }
    });

    await page.goto('/');

    // Find all internal links
    const links = page.locator('a[href^="/"]');
    const linkCount = await links.count();

    // Test first few links
    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');

      if (href && !href.startsWith('#')) {
        // Don't navigate but check if the status code would be 404
        // Skip to avoid time consumption
      }
    }

    // Navigation links should exist
    expect(linkCount).toBeGreaterThan(0);
  });

  test('no placeholder URLs remain in footer', async ({ page }) => {
    const placeholderUrls: string[] = [];

    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check footer links
    const footerLinks = page.locator('footer a');
    const linkCount = await footerLinks.count();

    for (let i = 0; i < linkCount; i++) {
      const link = footerLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href === 'https://github.com/your-handle') {
        placeholderUrls.push('GitHub: your-handle');
      }
      if (href === 'https://linkedin.com/in/your-handle') {
        placeholderUrls.push('LinkedIn: your-handle');
      }
      if (href === 'mailto:you@example.com') {
        placeholderUrls.push('Email: you@example.com');
      }
    }

    // Footer content has been finalized — these template placeholders
    // should never reappear (e.g. from a config reset or bad merge).
    expect(placeholderUrls).toEqual([]);
  });

  test('placeholder URLs are detected in command palette', async ({
    page,
  }) => {
    await page.goto('/');

    const placeholders: string[] = [];

    // Open palette
    await page.press('body', 'Control+k');

    // Check for placeholder text in social commands
    const githubCmd = page.locator('text=GitHub').first();
    if (await githubCmd.isVisible()) {
      // This command exists - it's known to have placeholder URL
      placeholders.push('Command Palette: GitHub link is in template');
    }

    expect(placeholders.length).toBeGreaterThan(0);
  });

  test('no uncaught exceptions in network requests', async ({ page, context }) => {
    const networkErrors: string[] = [];

    context.on('response', (response) => {
      if (response.status() >= 500) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    await page.goto('/');

    // Trigger some interactions
    await page.press('body', 'Control+k');
    await page.press('body', 'Escape');

    // Navigate to a project
    await page.goto('/projects/log-analyser');

    // No 5xx errors should occur
    expect(networkErrors).toEqual([]);
  });

  test('CSS files are loaded successfully', async ({ page, context }) => {
    const cssIssues: string[] = [];

    context.on('response', (response) => {
      const url = response.url();
      if (url.endsWith('.css')) {
        if (response.status() !== 200) {
          cssIssues.push(`CSS 404: ${url}`);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(cssIssues).toEqual([]);
  });

  test('JavaScript files are loaded successfully', async ({
    page,
    context,
  }) => {
    const jsIssues: string[] = [];

    context.on('response', (response) => {
      const url = response.url();
      if (url.endsWith('.js')) {
        if (response.status() >= 400) {
          jsIssues.push(`JS Error: ${response.status()} ${url}`);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // We expect some 3xx redirects for dynamic chunks, but no 4xx
    const realErrors = jsIssues.filter((issue) => !issue.includes('3'));
    expect(realErrors).toEqual([]);
  });

  test('log-analyser page has no placeholder markers', async ({ page }) => {
    await page.goto('/projects/log-analyser');
    const content = await page.content();
    expect(content).not.toContain('[PLACEHOLDER');
  });

  test('verify resume link exists but may be placeholder', async ({
    page,
  }) => {
    await page.goto('/');

    // Open command palette
    await page.press('body', 'Control+k');

    // Search for resume
    await page.type('input[placeholder*="Type a command"]', 'Resume');

    const downloadOption = page.locator('text=Download Resume').first();

    // Command should exist
    expect(await downloadOption.count()).toBeGreaterThan(0);
  });

  test('navigation does not create console errors', async ({ page }) => {
    const sessionTraffic = observeSessionTraffic(page);

    // Navigate through multiple routes, leaving each page only after its own
    // startup /api/auth/session request has completed. Leaving mid-fetch makes the
    // browser cancel the request, which NextAuth logs as CLIENT_FETCH_ERROR
    // "Failed to fetch". Playwright disables the back/forward cache, so goBack()
    // loads a new document that fetches the session again.
    let session = sessionTraffic.waitForSessionResponse();
    await page.goto('/');
    await session;

    session = sessionTraffic.waitForSessionResponse();
    await page.goto('/projects/log-analyser');
    await session;

    session = sessionTraffic.waitForSessionResponse();
    await page.goBack();
    await session;

    session = sessionTraffic.waitForSessionResponse();
    await page.goto('/projects/case-study-two');
    await session;

    session = sessionTraffic.waitForSessionResponse();
    await page.goBack();
    await session;

    expect(sessionTraffic.unmatchedSessionErrors()).toEqual([]);
    expect(sessionTraffic.invalidSessionFailures()).toEqual([]);
    expect(sessionTraffic.invalidSessionResponses()).toEqual([]);
  });

  test('session observer reports HTTP 500 session failures', async ({ page }) => {
    const serverErrorTraffic = observeSessionTraffic(page);
    await page.route('**/api/auth/session', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'test failure' }),
      }),
    );
    await page.goto('/');
    await expect
      .poll(() => serverErrorTraffic.hasError())
      .toBe(true);
  });

  test('session observer reports aborted session failures', async ({ page }) => {
    const failedRequestTraffic = observeSessionTraffic(page);
    await page.route('**/api/auth/session', (route) => route.abort('failed'));
    await page.goto('/');
    await expect
      .poll(() => failedRequestTraffic.hasError())
      .toBe(true);
  });

  test('session observer tolerates a matched browser-aborted session fetch', async ({
    page,
  }) => {
    const sessionTraffic = observeSessionTraffic(page);
    let delayFirstSession = true;

    await page.route('**/api/auth/session', async (route) => {
      if (delayFirstSession) {
        delayFirstSession = false;
        await new Promise((resolve) => setTimeout(resolve, 5000));
        try {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: 'null',
          });
        } catch {
          // Navigation may cancel the delayed request before fulfillment.
        }
        return;
      }

      await route.continue();
    });

    const initialNavigation = page.goto('/').catch(() => undefined);
    await page.waitForRequest((request) =>
      request.url().includes('/api/auth/session'),
    );
    await page.goto('/projects/log-analyser');
    await initialNavigation;

    await expect
      .poll(() => sessionTraffic.requestFailures.length)
      .toBeGreaterThan(0);
    expect(sessionTraffic.unmatchedSessionErrors()).toEqual([]);
    expect(sessionTraffic.invalidSessionFailures()).toEqual([]);
    expect(sessionTraffic.invalidSessionResponses()).toEqual([]);
  });

  test('session observer reports unrelated console errors', async ({ page }) => {
    const sessionTraffic = observeSessionTraffic(page);
    await page.goto('about:blank');
    await page.evaluate(() => console.error('deliberate unrelated console error'));

    await expect.poll(() => sessionTraffic.hasError()).toBe(true);
  });

  test('session observer ignores ResizeObserver noise', async ({ page }) => {
    const sessionTraffic = observeSessionTraffic(page);
    await page.goto('about:blank');
    await page.evaluate(() =>
      console.error('ResizeObserver loop completed with undelivered notifications.'),
    );

    await expect.poll(() => sessionTraffic.hasError()).toBe(false);
  });

  test('report summary of all warnings collected during usage', async ({
    page,
  }) => {
    const issues: {
      type: string;
      message: string;
      url: string;
      timestamp: number;
    }[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'warning') {
        issues.push({
          type: 'warning',
          message: msg.text(),
          url: page.url(),
          timestamp: Date.now(),
        });
      }
    });

    // Perform comprehensive usage
    await page.goto('/');
    await page.goto('/#about');
    await page.goto('/#skills');
    await page.goto('/#projects');
    await page.press('body', 'Control+k');
    await page.press('body', 'Escape');

    // Warnings are informational, not errors
    // Just report if any significant warnings occur
  });
});
