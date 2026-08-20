import { test, expect } from '@playwright/test';

const PAGE_URL = '/dsa/flagship/two-sum';

// The brute-force phase has a prediction-question gate on steps 0, 1, and 2
// (only the last step, 3, is ungated). ExecutionPanel.tsx blocks both the
// forward button and the stepForward() handler while a step's question is
// unanswered, so any test advancing past a gated step must answer it first.
// Answering with any option lifts the gate: isAnswered is `stepIndex in
// answers`, independent of which option index was picked.
const answerCurrentQuestion = async (panel: import('@playwright/test').Locator) => {
  const question = panel.getByTestId('prediction-question');
  const firstOption = question.getByRole('button').first();
  await firstOption.click();
  await expect(
    panel.getByText('Answer the question above to reveal this step.')
  ).not.toBeVisible();
};

test.describe('DSA Flagship — Two Sum Execution Panel', () => {
  test('page loads and the brute-force execution panel is visible', async ({ page }) => {
    const response = await page.goto(PAGE_URL);
    expect(response?.status()).toBe(200);

    const panel = page.getByRole('group', { name: /Brute-Force Walkthrough/i });
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/Step 1 of/i)).toBeVisible();
  });

  test('steps through the brute-force panel via the step-forward button', async ({ page }) => {
    await page.goto(PAGE_URL);

    const panel = page.getByRole('group', { name: /Brute-Force Walkthrough/i });
    const forwardBtn = panel.getByRole('button', { name: 'Step forward' });

    await expect(panel.getByText('Step 1 of 4')).toBeVisible();
    // Step 1 (index 0) is gated — answer before stepping forward.
    await answerCurrentQuestion(panel);
    await expect(forwardBtn).toBeEnabled();
    await forwardBtn.click();
    await expect(panel.getByText('Step 2 of 4')).toBeVisible();
    // Step 2 (index 1) is gated — answer before stepping forward.
    await answerCurrentQuestion(panel);
    await expect(forwardBtn).toBeEnabled();
    await forwardBtn.click();
    await expect(panel.getByText('Step 3 of 4')).toBeVisible();
  });

  test('steps through the brute-force panel via keyboard', async ({ page }) => {
    await page.goto(PAGE_URL);

    const panel = page.getByRole('group', { name: /Brute-Force Walkthrough/i });
    await panel.focus();

    await expect(panel.getByText('Step 1 of 4')).toBeVisible();
    // Step 1 (index 0) is gated — answer before crossing it with ArrowRight.
    await answerCurrentQuestion(panel);
    await page.keyboard.press('ArrowRight');
    await expect(panel.getByText('Step 2 of 4')).toBeVisible();
    // stepBack() is not gated, so ArrowLeft back to step 1 needs no answer.
    await page.keyboard.press('ArrowLeft');
    await expect(panel.getByText('Step 1 of 4')).toBeVisible();
  });

  test('prefers-reduced-motion disables autoplay but manual stepping still works', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(PAGE_URL);

    const panel = page.getByRole('group', { name: /Brute-Force Walkthrough/i });
    const playBtn = panel.getByRole('button', { name: /^(Play|Pause)$/ });
    await expect(playBtn).toBeDisabled();

    const forwardBtn = panel.getByRole('button', { name: 'Step forward' });
    // Step 1 (index 0) is gated — answer before stepping forward.
    await answerCurrentQuestion(panel);
    await expect(forwardBtn).toBeEnabled();
    await forwardBtn.click();
    await expect(panel.getByText('Step 2 of 4')).toBeVisible();
  });

  test('a prediction question renders and can be answered', async ({ page }) => {
    await page.goto(PAGE_URL);

    const panel = page.getByRole('group', { name: /Brute-Force Walkthrough/i });
    const question = panel.getByTestId('prediction-question');
    await expect(question).toBeVisible();

    // The real step content should be gated behind the question until answered.
    await expect(panel.getByText('Answer the question above to reveal this step.')).toBeVisible();
    const forwardBtn = panel.getByRole('button', { name: 'Step forward' });
    await expect(forwardBtn).toBeDisabled();

    // Answer the first option.
    const firstOption = question.getByRole('button').first();
    await firstOption.click();

    // Gate should lift: either a correct/incorrect indicator appears, or the
    // gated placeholder text is gone — whichever the panel currently renders.
    await expect(
      panel.getByText('Answer the question above to reveal this step.')
    ).not.toBeVisible();
    await expect(forwardBtn).toBeEnabled();
  });
});
