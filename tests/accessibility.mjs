import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const reports = {};

try {
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  await page.locator('#mischief').scrollIntoViewIfNeeded();
  await expect(page.locator('.mischief-copy')).toHaveCSS('opacity', '1');

  for (const stage of ['page', 'letter', 'cake', 'wish']) {
    if (stage === 'letter') {
      await page.getByRole('button', { name: 'Your letter', exact: true }).click();
      await expect(page.locator('.modal-paper')).toHaveCSS('opacity', '1');
      await expect(page.locator('.letter-content')).toHaveCSS('opacity', '1');
    }
    if (stage === 'cake') {
      await page.getByRole('button', { name: 'One more little surprise' }).click();
      await expect(page.locator('.cake-content')).toHaveCSS('opacity', '1');
    }
    if (stage === 'wish') {
      await page.getByRole('button', { name: 'Make a wish & blow' }).click();
      await expect(page.getByRole('heading', { name: 'Wish, officially delivered.' })).toBeVisible();
    }

    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze();
    reports[stage] = result.violations;
    console.log(`${stage}: ${result.violations.length} accessibility violations`);
  }

  fs.mkdirSync('artifacts', { recursive: true });
  fs.writeFileSync('artifacts/accessibility.json', JSON.stringify(reports, null, 2));
  for (const [stage, violations] of Object.entries(reports)) {
    assert.deepEqual(violations, [], `${stage} must have no automated accessibility violations`);
  }
} finally {
  await browser.close();
}