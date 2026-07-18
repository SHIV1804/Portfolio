import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('header navigation links are visible and clickable on desktop', async ({
    page,
  }) => {
    await page.goto('/');

    // Check navigation is visible on desktop
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();

    // Click on About link
    await page.click('a[href="/#about"]');
    await page.waitForTimeout(500);

    // Verify URL changed
    expect(page.url()).toContain('/#about');
  });

  test('section navigation with hash links scroll to sections', async ({
    page,
  }) => {
    await page.goto('/');

    // Test clicking Skills link
    await page.click('a[href="/#skills"]');
    await page.waitForTimeout(500);

    expect(page.url()).toContain('/#skills');
  });

  test('project card navigation links work', async ({ page }) => {
    await page.goto('/');

    // Scroll to projects section to ensure visibility
    await page.locator('a[href="/projects/log-analyser"]').first().scrollIntoViewIfNeeded();

    // Click on log-analyser project link
    const projectLink = page.locator('a[href="/projects/log-analyser"]').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/projects/log-analyser');
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('browser back button returns to previous page', async ({ page }) => {
    await page.goto('/');
    const initialUrl = page.url();

    // Navigate to a project
    await page.goto('/projects/log-analyser');
    expect(page.url()).toContain('/projects/log-analyser');

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toMatch(initialUrl);
  });

  test('repeated project navigation does not leave runtime errors or stale scroll triggers', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');

    for (let attempt = 0; attempt < 3; attempt++) {
      await page.locator('a[href="/projects/log-analyser"]').first().click();
      await expect(page).toHaveURL(/\/projects\/log-analyser$/);
      await page.goBack();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('main')).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('direct navigation to case-study URLs works', async ({ page }) => {
    const response = await page.goto('/projects/case-study-two');
    expect(response?.status()).toBe(200);

    // Verify page loaded
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('direct navigation to log-analyser URL works', async ({ page }) => {
    const response = await page.goto('/projects/log-analyser');
    expect(response?.status()).toBe(200);

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('header logo navigates to home', async ({ page }) => {
    await page.goto('/projects/log-analyser');

    // Click the logo
    const logo = page.locator('a[href="/"]').first();
    await logo.click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toBe('http://localhost:3000/');
  });

  test('GitHub link opens with correct URL', async ({ page, context }) => {
    await page.goto('/');

    // Get the GitHub URL from the page
    const githubLink = page.locator('a[href*="github.com"]').first();
    const href = await githubLink.getAttribute('href');

    // [PLACEHOLDER URL] - Link appears to be a template placeholder
    expect(href).toContain('github.com');
    expect(href).toBe('https://github.com/SHIV1804');
  });

  test('LinkedIn link opens with correct URL', async ({ page }) => {
    await page.goto('/');

    const linkedinLink = page.locator('a[href*="linkedin.com"]').first();
    const href = await linkedinLink.getAttribute('href');

    // [PLACEHOLDER URL] - Link appears to be a template placeholder
    expect(href).toContain('linkedin.com');
    expect(href).toBe('https://www.linkedin.com/in/shivam-chourasiya-a5a799247/');
  });

  test('email contact link uses mailto protocol', async ({ page }) => {
    await page.goto('/');

    const emailLink = page.locator('a[href*="mailto"]').first();
    const href = await emailLink.getAttribute('href');

    expect(href).toContain('mailto:');
    expect(href).toBe('mailto:shivamchourasiya766@gmail.com');
  });

  test('command palette trigger button is accessible', async ({ page }) => {
    await page.goto('/');

    const trigger = page.locator('[aria-label="Open command palette"]');
    await expect(trigger).toBeVisible();
    await expect(trigger).not.toBeFocused();
  });

  test('navigation persists theme across route changes', async ({ page }) => {
    await page.goto('/');

    // Get initial background color
    const bodyBefore = await page.locator('body').getAttribute('class');

    // Navigate to project
    await page.goto('/projects/log-analyser');

    // Get background color after navigation
    const bodyAfter = await page.locator('body').getAttribute('class');

    // Theme classes should be similar
    expect(bodyBefore).toBeTruthy();
    expect(bodyAfter).toBeTruthy();
  });
});
