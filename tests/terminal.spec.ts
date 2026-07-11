import { test, expect } from '@playwright/test';

test.describe('Terminal Easter Egg', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to be fully hydrated
    await page.waitForSelector('button[aria-label*="mode"]');
  });

  test('should open terminal via footer trigger', async ({ page }) => {
    const trigger = page.getByTestId('terminal-trigger');
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').locator('input')).toBeFocused();
  });

  test('should open terminal via "/" key', async ({ page }) => {
    await page.keyboard.press('/');
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should close terminal via Escape key', async ({ page }) => {
    await page.keyboard.press('/');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should execute whoami command', async ({ page }) => {
    await page.keyboard.press('/');
    await page.keyboard.type('whoami');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Shivam - Software Engineer')).toBeVisible();
  });

  test('should handle command history with arrow keys', async ({ page }) => {
    await page.keyboard.press('/');
    await page.keyboard.type('help');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Available commands:')).toBeVisible();
    
    await page.keyboard.type('whoami');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Shivam - Software Engineer')).toBeVisible();
    
    // Press Up twice to get 'help'
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    // We expect to see 'Available commands:' again as the latest output
    const outputs = page.getByText('Available commands:');
    await expect(outputs).toHaveCount(2);
  });

  test('should handle tab completion', async ({ page }) => {
    await page.keyboard.press('/');
    await page.keyboard.type('who');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Shivam - Software Engineer')).toBeVisible();
  });

  test('should change theme via command', async ({ page }) => {
    await page.keyboard.press('/');
    
    // Test light theme
    await page.keyboard.type('theme light');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    
    // Test dark theme
    await page.keyboard.type('theme dark');
    await page.keyboard.press('Enter');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should persist history across reloads', async ({ page }) => {
    await page.keyboard.press('/');
    await page.keyboard.type('skills');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Technical Skills:')).toBeVisible();
    
    await page.reload();
    await page.waitForSelector('button[aria-label*="mode"]');
    
    await page.keyboard.press('/');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    const outputs = page.getByText('Technical Skills:');
    await expect(outputs).toBeVisible();
  });
});
