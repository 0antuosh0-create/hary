import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium, expect } from '@playwright/test';

const baseURL = process.env.TEST_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const errors = [];
fs.mkdirSync('artifacts', { recursive: true });

async function openPage(options) {
  const page = await browser.newPage(options);
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  // With SINGLE_FILE=1 the page must be fully self-contained: no request except the document itself.
  page.on('request', request => {
    const url = request.url();
    if (process.env.SINGLE_FILE && !url.startsWith('data:') && !url.startsWith('blob:') && url.replace(/\/$/, '') !== baseURL) {
      errors.push(`unexpected request: ${url}`);
    }
  });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function noOverflow(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Page must not overflow horizontally');
}

try {
  const page = await openPage({ viewport: { width: 1440, height: 900 } });
  await page.waitForTimeout(1300);
  await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('aria-label', '\u06af\u0631\u06af\u060c \u062a\u0648\u0644\u062f\u062a \u0645\u0628\u0627\u0631\u06a9! \u{1fa84}');
  await noOverflow(page);
  await page.screenshot({ path: 'artifacts/desktop-hero.png' });
  await page.locator('.open-letter').screenshot({ path: 'artifacts/envelope.png' });
  assert(await page.locator('.envelope-photo').evaluate(img => img.complete && img.naturalWidth > 0), 'Envelope photo must load');
  assert(await page.evaluate(() => document.fonts.check('16px "Vazirmatn"') && document.fonts.check('16px "Cinzel"')), 'Embedded fonts must load');

  const candle = page.getByRole('button', { name: 'Blow out floating candle 1', exact: true });
  await candle.click({ force: true });
  await expect(page.getByRole('button', { name: 'Relight floating candle 1', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Relight floating candle 1', exact: true }).click({ force: true });
  await expect(candle).toBeVisible();

  await page.getByRole('button', { name: 'Turn enchanted sound on' }).click();
  await expect(page.getByRole('button', { name: 'Turn enchanted sound off' })).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Turn enchanted sound off' }).click();
  await expect(page.getByRole('button', { name: 'Turn enchanted sound on' })).toHaveAttribute('aria-pressed', 'false');

  const letterTrigger = page.getByRole('button', { name: 'Open your birthday letter' });
  await letterTrigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.waitForTimeout(550);
  await page.screenshot({ path: 'artifacts/desktop-letter.png' });
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    assert(await page.evaluate(() => !!document.activeElement?.closest('dialog')), 'Dialog must retain keyboard focus');
  }
  await page.getByRole('button', { name: 'One more little surprise' }).click();
  await expect(page.getByRole('heading', { name: 'Hagrid made you something.' })).toBeVisible();
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'artifacts/desktop-cake.png' });
  await page.getByRole('button', { name: 'Make a wish & blow' }).click();
  await expect(page.getByRole('heading', { name: 'Wish, officially delivered.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Blow out the birthday candle' })).toBeDisabled();
  await page.getByRole('button', { name: "One more wish? We won't tell." }).click();
  await expect(page.getByRole('button', { name: 'Blow out the birthday candle' })).toBeEnabled();
  await page.getByRole('button', { name: 'Blow out the birthday candle' }).click();
  await expect(page.getByRole('heading', { name: 'Wish, officially delivered.' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep the magic' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(letterTrigger).toBeFocused();

  await letterTrigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Your letter', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close the magical surprise' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.locator('#mischief').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  await page.waitForFunction(() => document.querySelector('video')?.readyState >= 2);
  assert(await page.locator('video').evaluate(video => !video.paused), 'Visible portrait should be moving');
  const frame = await page.locator('video').evaluate(video => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  fs.writeFileSync('artifacts/portrait-video-frame.png', Buffer.from(frame, 'base64'));
  await page.screenshot({ path: 'artifacts/desktop-mischief.png' });
  assert(await page.locator('.np-photo img').evaluate(img => img.complete && img.naturalWidth > 0), 'Cat photograph must load');
  await page.locator('.newspaper').screenshot({ path: 'artifacts/newspaper.png' });
  await page.getByRole('button', { name: 'Question the suspicious birthday wizard in the moving portrait' }).click();
  await expect(page.locator('.portrait-remark')).toHaveText('"I solemnly swear... I ate the cake."');
  await page.getByRole('button', { name: 'Cast Lumos', exact: true }).click();
  await expect(page.locator('.birthday-world')).toHaveClass(/is-luminous/);
  await expect(page.getByRole('button', { name: 'Cast Riddikulus', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cast Riddikulus', exact: true }).click();
  await expect(page.locator('.wizard-disguise')).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'artifacts/desktop-disguise.png' });
  await page.getByRole('button', { name: 'Cast Accio cake', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cast Nox', exact: true }).click();
  await expect(page.locator('.birthday-world')).not.toHaveClass(/is-luminous/);
  await page.getByRole('button', { name: 'Catch the golden snitch', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Release the golden snitch', exact: true })).toBeVisible();
  await expect(page.locator('.magic-toast')).toContainText('150 points');
  await page.getByRole('button', { name: 'Release the golden snitch', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Catch the golden snitch', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Mischief managed.' }).click();
  await expect(page.locator('.magic-toast')).toContainText('Birthday magic?');
  console.log('PASS: desktop greeting, candles, sound, letter, focus trap, wishes, portrait, spells, Snitch, footer.');
  await page.close();

  for (const [name, width, height] of [['mobile', 390, 844], ['iphone-se', 375, 667], ['small-mobile', 320, 640], ['tablet', 768, 1024]]) {
    const responsive = await openPage({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768 });
    await responsive.waitForTimeout(1200);
    await noOverflow(responsive);
    await responsive.getByRole('button', { name: 'Open your birthday letter' }).click();
    await expect(responsive.getByRole('dialog')).toBeVisible();
    await responsive.waitForTimeout(450);
    await responsive.screenshot({ path: `artifacts/${name}-letter.png` });
    assert(await responsive.locator('dialog').evaluate(dialog => dialog.getBoundingClientRect().width <= innerWidth), 'Dialog must fit the viewport');
    await responsive.getByRole('button', { name: 'One more little surprise' }).click();
    await expect(responsive.getByRole('heading', { name: 'Hagrid made you something.' })).toBeVisible();
    await responsive.getByRole('button', { name: 'Make a wish & blow' }).click();
    await expect(responsive.getByRole('heading', { name: 'Wish, officially delivered.' })).toBeVisible();
    await responsive.getByRole('button', { name: 'Keep the magic' }).click();
    await responsive.locator('#mischief').scrollIntoViewIfNeeded();
    await responsive.waitForTimeout(1000);
    await noOverflow(responsive);
    await responsive.getByRole('button', { name: 'Cast Lumos', exact: true }).click();
    await expect(responsive.locator('.birthday-world')).toHaveClass(/is-luminous/);
    console.log(`PASS: ${name} (${width}x${height}) layout, letter, cake, wish, and spells.`);
    await responsive.close();
  }

  const reduced = await openPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  await expect(reduced.locator('video')).toHaveCount(0);
  await expect(reduced.locator('.magic-canvas')).toBeHidden();
  await reduced.getByRole('button', { name: 'Open your birthday letter' }).click();
  await expect(reduced.getByRole('dialog')).toBeVisible();
  await reduced.keyboard.press('Escape');
  await expect(reduced.getByRole('dialog')).toHaveCount(0);
  console.log('PASS: reduced-motion mode and Escape dismissal.');
  await reduced.close();

  assert.deepEqual(errors, [], 'No runtime or network errors');
  console.log('PASS: no browser errors or missing assets.');
} finally {
  await browser.close();
}