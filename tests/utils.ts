import { Page, BrowserContext } from '@playwright/test';

export async function getConsoleLogs(page: Page): Promise<string[]> {
  const logs: string[] = [];
  page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
  return logs;
}

export async function collectConsoleErrors(
  page: Page,
): Promise<{ errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
    if (msg.type() === 'warning') warnings.push(msg.text());
  });

  return { errors, warnings };
}

export async function getFailedRequests(page: Page): Promise<string[]> {
  const failed: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) {
      failed.push(`${response.status()} ${response.url()}`);
    }
  });
  return failed;
}

export async function waitForAnimationFrame(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

export async function getAccessibilityTree(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const getTree = (element: Element, depth = 0): string => {
      const indent = '  '.repeat(depth);
      const role = element.getAttribute('role') || 'unknown';
      const ariaLabel = element.getAttribute('aria-label') || '';
      const accessible = ariaLabel ? ` [${ariaLabel}]` : '';

      let result = `${indent}${element.tagName}(${role})${accessible}\n`;

      for (const child of element.children) {
        result += getTree(child, depth + 1);
      }

      return result;
    };

    return getTree(document.documentElement);
  });
}

export async function checkForDuplicateIds(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const ids = new Map<string, number>();
    document.querySelectorAll('[id]').forEach((el) => {
      const id = el.id;
      ids.set(id, (ids.get(id) || 0) + 1);
    });

    return Array.from(ids.entries())
      .filter(([, count]) => count > 1)
      .map(([id, count]) => `ID "${id}" appears ${count} times`);
  });
}

export async function getHeadingHierarchy(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    const headings: string[] = [];
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      const level = parseInt(heading.tagName[1]);
      headings.push(`${'  '.repeat(level - 1)}H${level}: ${heading.textContent}`);
    });
    return headings;
  });
}

export async function takeScreenshots(
  page: Page,
  screenshotName: string,
  baseDir = 'screenshots',
): Promise<void> {
  await page.screenshot({
    path: `${baseDir}/${screenshotName}.png`,
    fullPage: true,
  });
}

export async function mockContactAPI(
  context: BrowserContext,
  statusCode = 200,
  responseBody = { success: true, id: 'test-id' },
): Promise<void> {
  await context.route('**/api/contact', (route) => {
    route.abort('blockedbyclient');
  });

  await context.route('**/api/contact', (route) => {
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });
}
