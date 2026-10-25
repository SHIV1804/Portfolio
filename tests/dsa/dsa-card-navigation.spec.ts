import { expect, test } from '@playwright/test';

test.describe('DSA problem card navigation', () => {
  test('blank card area and title link navigate to the problem page', async ({ page }) => {
    await page.goto('/dsa');

    const titleLink = page.locator('a[aria-label^="View solution for "]').first();
    await expect(titleLink).toBeVisible();
    const href = await titleLink.getAttribute('href');
    expect(href).toBeTruthy();

    const card = titleLink.locator('xpath=ancestor::div[contains(@class, "group")][1]');
    await expect(card).toBeVisible();
    const cardBox = await card.boundingBox();
    expect(cardBox).toBeTruthy();

    await card.click({
      position: {
        x: Math.max(8, (cardBox?.width ?? 0) - 24),
        y: Math.max(8, (cardBox?.height ?? 0) / 2),
      },
    });
    await expect(page).toHaveURL(new URL(href!, page.url()).toString());

    await page.goto('/dsa');
    await page.locator('a[aria-label^="View solution for "]').first().click();
    await expect(page).toHaveURL(new URL(href!, page.url()).toString());
  });
});
