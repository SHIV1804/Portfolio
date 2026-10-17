import { test, expect } from '@playwright/test';

// TEMPORARY DIAGNOSTIC (do not merge). Replays the flow of
// "navigation does not create console errors" with instrumentation, to find
// out WHY /api/auth/session fails with "Failed to fetch".
test('DIAG: instrumented navigation sequence', async ({ page }, testInfo) => {
  const t0 = Date.now();
  const log: string[] = [];
  let step = 'init';
  const stamp = (msg: string) =>
    log.push(`+${String(Date.now() - t0).padStart(6)}ms [${step}] ${msg}`);
  const isSession = (url: string) => url.includes('/api/auth/session');

  page.on('request', (r) => {
    if (isSession(r.url())) stamp(`REQUEST   ${r.method()} ${r.url()}`);
  });
  page.on('response', (r) => {
    if (isSession(r.url())) stamp(`RESPONSE  ${r.status()} ${r.url()}`);
  });
  page.on('requestfailed', (r) => {
    if (isSession(r.url()))
      stamp(`REQFAILED ${r.failure()?.errorText ?? 'unknown'} ${r.url()}`);
  });
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) stamp(`NAVIGATED ${f.url()}`);
  });
  page.on('load', () => stamp('LOAD'));
  page.on('crash', () => stamp('PAGE CRASH'));
  page.on('websocket', (ws) => {
    stamp(`WS OPEN  ${ws.url()}`);
    ws.on('close', () => stamp(`WS CLOSE ${ws.url()}`));
  });
  page.on('console', (m) => {
    const text = m.text();
    if (m.type() === 'error') {
      stamp(`CONSOLE.ERROR ${text.replace(/\s+/g, ' ').slice(0, 200)}`);
    } else if (/\[diag\]|Fast Refresh|\[HMR\]|reload/i.test(text)) {
      stamp(`CONSOLE.${m.type()} ${text.slice(0, 200)}`);
    }
  });
  await page.addInitScript(() => {
    document.addEventListener('visibilitychange', () =>
      console.log(`[diag] visibilitychange -> ${document.visibilityState}`),
    );
    window.addEventListener('pageshow', (e) =>
      console.log(`[diag] pageshow persisted=${(e as PageTransitionEvent).persisted}`),
    );
    window.addEventListener('pagehide', () => console.log('[diag] pagehide'));
  });

  const settle = async (name: string, action: () => Promise<unknown>) => {
    step = name;
    stamp('begin');
    await action();
    stamp('navigation call returned');
    await page.waitForLoadState('networkidle');
    stamp('networkidle reached');
  };

  await settle('1 goto /', () => page.goto('/'));
  await settle('2 goto /projects/log-analyser', () => page.goto('/projects/log-analyser'));
  await settle('3 goBack', () => page.goBack());
  await settle('4 goto /projects/case-study-two', () => page.goto('/projects/case-study-two'));
  await settle('5 goBack', () => page.goBack());

  step = '6 tail wait';
  await page.waitForTimeout(2000); // lets any late session fetch land
  stamp('end');

  const bad = log.some((l) => /CONSOLE\.ERROR|REQFAILED|PAGE CRASH/.test(l));
  const report = log.join('\n');
  await testInfo.attach('diag-log', { body: report, contentType: 'text/plain' });
  expect(bad, `\n--- DIAG LOG ---\n${report}\n`).toBe(false);
});
