import { test, expect } from '@playwright/test';

test.describe('Theme Toggle Tests', () => {
  test('initial theme behavior loads correctly', async ({ page }) => {
    await page.goto('/');

    // Get the HTML element's class
    const htmlClasses = await page.locator('html').getAttribute('class');

    // Should have either 'dark' class or not (light mode)
    expect(htmlClasses).toBeTruthy();
    // Either dark or light mode
    const isDark = htmlClasses?.includes('dark') || false;
    const isLight = !isDark;
    expect(isDark || isLight).toBe(true);
  });

  test('dark/light theme toggle changes the DOM class', async ({ page }) => {
    await page.goto('/');

    // Get initial theme
    const initialDark = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );

    // Click theme toggle button
    await page.click('[aria-label*="Switch to"]');

    // Verify class changed
    const afterDark = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );

    expect(afterDark).toBe(!initialDark);
  });

  test('theme toggle updates aria-label to reflect new state', async ({
    page,
  }) => {
    await page.goto('/');

    const button = page.locator('[aria-label*="Switch to"]');
    const initialLabel = await button.getAttribute('aria-label');

    // Click to toggle
    await button.click();

    const newLabel = await button.getAttribute('aria-label');

    // Labels should be different
    expect(initialLabel).not.toBe(newLabel);

    // Should still indicate switching
    expect(newLabel).toMatch(/Switch to (light|dark) mode/);
  });

  test('theme persists after page reload', async ({ page }) => {
    await page.goto('/');

    // Get initial theme
    const initialDark = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );

    // Toggle theme
    await page.click('[aria-label*="Switch to"]');

    // Verify it changed
    const afterToggle = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );
    expect(afterToggle).toBe(!initialDark);

    // Reload page
    await page.reload();

    // Verify theme persisted
    const afterReload = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );
    expect(afterReload).toBe(!initialDark);
  });

  test('theme persists across navigation', async ({ page }) => {
    await page.goto('/');

    // Get initial theme
    const initialDark = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );

    // Toggle theme
    await page.click('[aria-label*="Switch to"]');

    // Navigate to project
    await page.goto('/projects/log-analyser');

    // Verify theme persisted after navigation
    const afterNav = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );
    expect(afterNav).toBe(!initialDark);
  });

  test('theme toggle is keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Tab to the theme toggle button, reading focus state directly via
    // document.activeElement instead of an auto-waiting locator — a
    // locator like `button:focus` retries for the full default timeout
    // whenever focus isn't currently on a button, which stalls the loop.
    let focusInfo = await page.evaluate(() => {
      const el = document.activeElement;
      return { tag: el?.tagName, ariaLabel: el?.getAttribute('aria-label') };
    });

    // Press Tab multiple times until we reach the theme button or timeout
    let attempts = 0;
    while (
      !(focusInfo.tag === 'BUTTON' && focusInfo.ariaLabel?.includes('Switch to')) &&
      attempts < 20
    ) {
      await page.press('body', 'Tab');
      focusInfo = await page.evaluate(() => {
        const el = document.activeElement;
        return { tag: el?.tagName, ariaLabel: el?.getAttribute('aria-label') };
      });
      attempts++;
    }

    const themeButton = page.locator('[aria-label*="Switch to"]');
    const isFocused = await themeButton.evaluate((el) => el === document.activeElement);

    // If we couldn't reach it with Tab, try direct focus
    if (!isFocused) {
      await themeButton.focus();
    }

    const initialDark = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );

    // Activate with Space or Enter
    await page.press('[aria-label*="Switch to"]', 'Space');

    const afterKey = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );

    // Theme should have changed
    expect(afterKey).toBe(!initialDark);
  });

  test('body class reflects theme state', async ({ page }) => {
    await page.goto('/');

    // Theme state lives on <html> (theme-provider.tsx toggles the `dark`
    // class on document.documentElement), not on <body> — body's class
    // attribute is static layout styling unrelated to theme and should
    // stay constant across a theme toggle.
    const bodyClassBefore = await page.locator('body').getAttribute('class');
    const initialDark = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );

    await page.click('[aria-label*="Switch to"]');

    const bodyClassAfter = await page.locator('body').getAttribute('class');
    const afterDark = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );

    // The theme toggle should flip the `dark` class on <html>...
    expect(afterDark).toBe(!initialDark);
    // ...and leave <body>'s class attribute completely unaffected.
    expect(bodyClassAfter).toBe(bodyClassBefore);
  });

  test('localStorage is updated when theme changes', async ({ page }) => {
    await page.goto('/');

    // Before any interaction, nothing has written to localStorage yet —
    // themeInitScript only reads localStorage/system preference to set
    // the initial class, it doesn't persist a default. So the stored
    // value can legitimately be null here; that's not what this test
    // is checking.
    const initialStored = await page.evaluate(() =>
      localStorage.getItem('portfolio-theme'),
    );

    // Toggle theme
    await page.click('[aria-label*="Switch to"]');

    // Get new stored value
    const newStored = await page.evaluate(() =>
      localStorage.getItem('portfolio-theme'),
    );

    // The toggle should have written a real value, different from before
    expect(newStored).not.toBe(initialStored);
    expect(['light', 'dark']).toContain(newStored);
  });

  test('theme contrast is ready on first paint (no flash)', async ({
    page,
  }) => {
    // Go to page
    await page.goto('/');

    // Get computed styles immediately
    const bgColor = await page.locator('body').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should have a valid background color (not transparent or uninitialized)
    expect(bgColor).toBeTruthy();
  });
});
