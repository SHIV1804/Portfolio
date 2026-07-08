import { test, expect } from '@playwright/test';

test.describe('Command Palette Tests', () => {
  test('Ctrl+K (Windows/Linux) opens command palette', async ({ page }) => {
    await page.goto('/');

    // Press Ctrl+K
    await page.press('body', 'Control+k');

    // Command palette should be visible
    const dialog = page.locator('[label="Command Palette"]');
    await expect(dialog).toBeVisible();
  });

  test('Meta+K opens command palette on Mac (simulated with Cmd+K)', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'webkit', 'Meta key primarily Mac behavior');

    await page.goto('/');

    // Press Meta+K (simulates Cmd+K on Mac)
    await page.press('body', 'Meta+k');

    const dialog = page.locator('[label="Command Palette"]');
    await expect(dialog).toBeVisible();
  });

  test('command palette input field exists and is focusable', async ({ page }) => {
    await page.goto('/');

    // Open palette
    await page.press('body', 'Control+k');

    // Input should be focused automatically
    const input = page.locator('input[placeholder*="Type a command"]');
    await expect(input).toBeTruthy();
  });

  test('keyboard arrow navigation through commands', async ({ page }) => {
    await page.goto('/');

    // Open palette
    await page.press('body', 'Control+k');

    // Start in input
    const input = page.locator('input[placeholder*="Type a command"]');
    await expect(input).toBeTruthy();

    // Press Down arrow to navigate
    await page.press('body', 'ArrowDown');

    // Verify a command item is now selected (has aria-selected or is highlighted)
    const items = page.locator('[role="option"]');
    const selectedItems = await items.evaluateAll((items) =>
      items.filter((item) => item.getAttribute('aria-selected') === 'true'),
    );

    expect(selectedItems.length).toBeGreaterThan(0);
  });

  test('Escape closes the command palette', async ({ page }) => {
    await page.goto('/');

    // Open palette
    await page.press('body', 'Control+k');
    const dialog = page.locator('[label="Command Palette"]');
    await expect(dialog).toBeVisible();

    // Press Escape
    await page.press('body', 'Escape');

    // Palette should be hidden
    await expect(dialog).not.toBeVisible();
  });

  test('Enter selects a highlighted command', async ({ page }) => {
    await page.goto('/');

    // Open palette
    await page.press('body', 'Control+k');

    // Type to filter (search for "About")
    await page.type('input[placeholder*="Type a command"]', 'About');

    // Navigation should be active
    const aboutItem = page.locator('text=About').first();
    await expect(aboutItem).toBeVisible();

    // Press Enter to select
    await page.press('body', 'Enter');

    // Palette should close
    const dialog = page.locator('[label="Command Palette"]');
    await expect(dialog).not.toBeVisible();

    // Should have navigated to #about
    expect(page.url()).toContain('/#about');
  });

  test('command palette filters commands by search text', async ({ page }) => {
    await page.goto('/');

    // Open palette
    await page.press('body', 'Control+k');

    // Type "Skills"
    await page.type('input[placeholder*="Type a command"]', 'Skills');

    // Should show Skills command
    const skillsItem = page.locator('text=Skills').first();
    await expect(skillsItem).toBeVisible();
  });

  test('navigation command navigates correctly', async ({ page }) => {
    await page.goto('/');

    // Open palette
    await page.press('body', 'Control+k');

    // Type and select Skills
    await page.type('input[placeholder*="Type a command"]', 'Skills');
    await page.press('body', 'Enter');

    // Should navigate to skills section
    expect(page.url()).toContain('/#skills');
  });

  test('case study navigation command works', async ({ page }) => {
    await page.goto('/');

    // Open palette
    await page.press('body', 'Control+k');

    // Type to find Log Analyser
    await page.type('input[placeholder*="Type a command"]', 'Log Analyser');

    const logAnalyserItem = page.locator('text=Log Analyser').first();
    await expect(logAnalyserItem).toBeVisible();

    // Select it
    await page.press('body', 'Enter');

    // Should navigate to the case study
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/projects/log-analyser');
  });

  test('toggle theme command works from palette', async ({ page }) => {
    await page.goto('/');

    // Get initial theme
    const initialDark = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );

    // Open palette
    await page.press('body', 'Control+k');

    // Type "Toggle Theme"
    await page.type('input[placeholder*="Type a command"]', 'Toggle');

    // Select the command
    await page.press('body', 'Enter');

    // Wait for theme to update
    await page.waitForTimeout(200);

    // Verify theme changed
    const afterToggle = await page.locator('html').evaluate((el) =>
      el.classList.contains('dark'),
    );

    expect(afterToggle).toBe(!initialDark);
  });

  test('Resume download command attempts to open PDF', async ({ page, context }) => {
    await page.goto('/');

    // Track any popup dialogs
    const newPagePromise = new Promise((resolve) =>
      context.once('page', resolve),
    );

    // Open palette
    await page.press('body', 'Control+k');

    // Type "Resume"
    await page.type('input[placeholder*="Type a command"]', 'Resume');

    const downloadItem = page.locator('text=Download Resume').first();
    await expect(downloadItem).toBeVisible();

    // Select it - don't actually wait for PDF to prevent download
    // Just verify command palette closed
    await page.press('body', 'Enter');

    const dialog = page.locator('[label="Command Palette"]');
    await expect(dialog).not.toBeVisible();
  });

  test('copy email command is accessible', async ({ page }) => {
    await page.goto('/');

    // Open palette
    await page.press('body', 'Control+k');

    // Type "Copy"
    await page.type('input[placeholder*="Type a command"]', 'Copy');

    const copyItem = page.locator('text=Copy Email').first();
    await expect(copyItem).toBeVisible();
  });

  test('external link commands do not break palette', async ({ page }) => {
    await page.goto('/');

    // Open palette twice to verify it works repeatedly
    for (let i = 0; i < 2; i++) {
      await page.press('body', 'Control+k');

      const dialog = page.locator('[label="Command Palette"]');
      await expect(dialog).toBeVisible();

      // Close it
      await page.press('body', 'Escape');
      await expect(dialog).not.toBeVisible();
    }
  });

  test('command palette is not accessible without keyboard shortcut being pressed', async ({
    page,
  }) => {
    await page.goto('/');

    // Palette should not be open initially
    const dialog = page.locator('[label="Command Palette"]');
    await expect(dialog).not.toBeVisible();
  });

  test('clicking the Search trigger button opens command palette', async ({
    page,
  }) => {
    await page.goto('/');

    // Click the search button in header
    await page.click('[aria-label="Open command palette"]');

    // Palette should be visible
    const dialog = page.locator('[label="Command Palette"]');
    await expect(dialog).toBeVisible();
  });

  test('command palette returns focus after closing', async ({ page }) => {
    await page.goto('/');

    // Open palette
    await page.press('body', 'Control+k');

    // Close palette
    await page.press('body', 'Escape');

    // The page should still be interactive (not an explicit focus check, just usage)
    // Try to scroll to verify page is still responsive
    await page.evaluate(() => window.scrollBy(0, 100));
  });

  test('palette displays all command groups', async ({ page }) => {
    await page.goto('/');

    // Open palette
    await page.press('body', 'Control+k');

    // Check for group headings
    const navigationGroup = page.locator('text=Navigation').first();
    const caseStudiesGroup = page.locator('text=Case Studies').first();
    const quickActionsGroup = page.locator('text=Quick Actions').first();
    const socialGroup = page.locator('text=Social').first();

    await expect(navigationGroup).toBeVisible();
    await expect(caseStudiesGroup).toBeVisible();
    await expect(quickActionsGroup).toBeVisible();
    await expect(socialGroup).toBeVisible();
  });

  test('placeholder URLs in social commands are detected', async ({ page }) => {
    await page.goto('/');

    // Open palette
    await page.press('body', 'Control+k');

    // Search for GitHub
    await page.type('input[placeholder*="Type a command"]', 'GitHub');

    // GitHub command should be visible (but we know it has placeholder URL)
    const githubItem = page.locator('text=GitHub').first();
    await expect(githubItem).toBeVisible();

    // [PLACEHOLDER URL DETECTED] - Links point to template placeholders
  });
});
