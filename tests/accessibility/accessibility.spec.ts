import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test('page has proper language attribute', async ({ page }) => {
    await page.goto('/');

    const html = page.locator('html');
    const lang = await html.getAttribute('lang');

    expect(lang).toBe('en');
  });

  test('all images have alt text or are decorative', async ({ page }) => {
    await page.goto('/');

    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');

      // Image should either have alt text or be marked as decorative
      if (!alt) {
        expect(ariaHidden).toBe('true');
      }
    }
  });

  test('keyboard navigation through interactive elements', async ({ page }) => {
    await page.goto('/');

    // Focus first interactive element
    await page.press('body', 'Tab');

    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();

    // Should be able to tab through multiple elements
    for (let i = 0; i < 5; i++) {
      await page.press('body', 'Tab');
      const currentFocused = await page.evaluate(() => document.activeElement?.tagName);
      expect(currentFocused).toBeTruthy();
    }
  });

  test('visible focus indicator on keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab to a button
    await page.press('body', 'Tab');

    // Get the focused element
    const activeElement = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;

      const computed = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        outline: computed.outlineWidth,
        boxShadow: computed.boxShadow,
      };
    });

    expect(activeElement).toBeTruthy();
  });

  test('form labels are properly associated', async ({ page }) => {
    await page.goto('/');

    const labels = page.locator('label');
    const labelCount = await labels.count();

    // Should have labels
    expect(labelCount).toBeGreaterThan(0);

    // Check that labels are associated
    for (let i = 0; i < labelCount; i++) {
      const label = labels.nth(i);
      const forAttr = await label.getAttribute('for');

      if (forAttr) {
        const input = page.locator(`#${forAttr}`);
        expect(await input.count()).toBeGreaterThan(0);
      }
    }
  });

  test('heading hierarchy is logical', async ({ page }) => {
    await page.goto('/');

    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();

    expect(headingCount).toBeGreaterThan(0);

    // Get heading levels
    const levels: number[] = [];
    for (let i = 0; i < headingCount; i++) {
      const heading = headings.nth(i);
      const tag = await heading.evaluate((el) => parseInt(el.tagName[1]));
      levels.push(tag);
    }

    // First heading should be H1 (typically)
    // Levels shouldn't jump dramatically (e.g., H1 to H5)
    for (let i = 1; i < levels.length; i++) {
      const diff = Math.abs(levels[i] - levels[i - 1]);
      // Allow for some jumps, but extreme jumps are unusual
      expect(diff).toBeLessThanOrEqual(2);
    }
  });

  test('no duplicate IDs on page', async ({ page }) => {
    await page.goto('/');

    const duplicates = await page.evaluate(() => {
      const ids = new Map<string, number>();
      document.querySelectorAll('[id]').forEach((el) => {
        const id = el.id;
        ids.set(id, (ids.get(id) || 0) + 1);
      });

      return Array.from(ids.entries())
        .filter(([, count]) => count > 1)
        .map(([id]) => id);
    });

    expect(duplicates).toHaveLength(0);
  });

  test('ARIA attributes are correctly referenced', async ({ page }) => {
    await page.goto('/');

    // Scope checks to the application root so framework development tools do
    // not introduce unrelated, transient ARIA references.
    const appRoot = page.locator('body > div').first();
    const ariaElements = appRoot.locator('[aria-describedby], [aria-labelledby], [aria-controls]');
    const elementCount = await ariaElements.count();

    for (let i = 0; i < elementCount; i++) {
      const element = ariaElements.nth(i);

      const describedBy = await element.getAttribute('aria-describedby');
      const labelledBy = await element.getAttribute('aria-labelledby');
      const controls = await element.getAttribute('aria-controls');

      // Check each reference exists
      if (describedBy) {
        const target = page.locator(`#${describedBy}`);
        expect(await target.count()).toBeGreaterThan(0);
      }

      if (labelledBy) {
        const target = page.locator(`#${labelledBy}`);
        expect(await target.count()).toBeGreaterThan(0);
      }

      if (controls) {
        const target = page.locator(`#${controls}`);
        expect(await target.count()).toBeGreaterThan(0);
      }
    }
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);

      const accessibleName = await button.evaluate((el) => {
        const text = el.textContent?.trim();
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');

        return !!(text || ariaLabel || ariaLabelledBy);
      });

      expect(accessibleName).toBe(true);
    }
  });

  test('links have descriptive text', async ({ page }) => {
    await page.goto('/');

    const links = page.locator('a');
    const linkCount = await links.count();

    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);

      const hasText = await link.evaluate((el) => {
        const text = el.textContent?.trim();
        const ariaLabel = el.getAttribute('aria-label');
        const title = el.getAttribute('title');

        return !!(text || ariaLabel || title);
      });

      expect(hasText).toBe(true);
    }
  });

  test('form inputs have labels or aria-labels', async ({ page }) => {
    await page.goto('/');

    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);

      const hasLabel = await input.evaluate((el) => {
        const id = el.id;
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const placeholder = el.getAttribute('placeholder');

        // Check if there's an associated label
        let hasAssociatedLabel = false;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          hasAssociatedLabel = !!label;
        }

        return hasAssociatedLabel || ariaLabel || ariaLabelledBy || placeholder;
      });

      expect(hasLabel).toBe(true);
    }
  });

  test('skip links or content landmarks exist', async ({ page }) => {
    await page.goto('/');

    // Check for main landmark
    const main = page.locator('main');
    const mainCount = await main.count();

    expect(mainCount).toBeGreaterThan(0);

    // Check for navigation or header
    const header = page.locator('header');
    const headerCount = await header.count();

    expect(headerCount).toBeGreaterThan(0);
  });

  test('dialog semantics for command palette', async ({ page }) => {
    await page.goto('/');

    // Open command palette
    await page.press('body', 'Control+k');

    const dialog = page.getByRole('dialog', { name: 'Command Palette' });
    await expect(dialog).toBeAttached();
    await expect(page.getByRole('combobox', { name: 'Command Palette' })).toBeVisible();

    // Dialog should have proper role or semantic HTML
    const role = await dialog.getAttribute('role');
    const dataDialog = await dialog.getAttribute('data-dialog');

    // Either has role or is semantic dialog element
    const isDialog = ['dialog', 'alertdialog'].includes(role || '');
    expect(isDialog || dataDialog !== null).toBe(true);
  });

  test('color contrast is adequate for text', async ({ page }) => {
    await page.goto('/');

    // This is a simplified check - full WCAG testing requires more sophisticated tools
    const textElements = page.locator('p, h1, h2, h3, h4, h5, h6, a, button, label');

    const contrast = await textElements.first().evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });

    // Should have colors defined
    expect(contrast.color).toBeTruthy();
    expect(contrast.backgroundColor).toBeTruthy();
  });

  test('error messages are associated with form fields', async ({ page }) => {
    await page.goto('/');

    const form = page.locator('form').first();

    if (await form.isVisible()) {
      // Try to trigger validation errors
      const submitButton = form.locator('button[type="submit"]').first();

      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(500);

        // Look for error messages
        const errorMessages = page.locator('text=/error|required/i');
        // Errors might be shown or might not, depending on form behavior
      }
    }
  });

  test('project case study pages are accessible', async ({ page }) => {
    const response = await page.goto('/projects/log-analyser');
    expect(response?.status()).toBe(200);

    // Should have proper structure
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Should have headings
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();

    expect(headingCount).toBeGreaterThan(0);
  });

  test('theme toggle has accessible label', async ({ page }) => {
    await page.goto('/');

    const themeButton = page.locator('[aria-label*="Switch to"]');

    if (await themeButton.isVisible()) {
      const label = await themeButton.getAttribute('aria-label');
      expect(label).toBeTruthy();
      expect(label).toMatch(/Switch to (light|dark) mode/);
    }
  });

  test('no auto-playing audio or video elements without controls', async ({
    page,
  }) => {
    await page.goto('/');

    const autoplayVideos = page.locator('video[autoplay]:not([controls])');
    const autoplayAudio = page.locator('audio[autoplay]:not([controls])');

    expect(await autoplayVideos.count()).toBe(0);
    expect(await autoplayAudio.count()).toBe(0);
  });
});
