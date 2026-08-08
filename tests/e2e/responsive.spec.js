const { test, expect } = require('@playwright/test');

const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';

async function openStart(page) {
  await page.goto(`${baseUrl}/index.html`);
  await page.getByRole('button', { name: 'Começar de novo' }).click();
  await expect(page.locator('#screen-start')).toBeVisible();
}

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  )).toBe(true);
}

async function expectVisibleFocus(page, selector) {
  await page.locator(selector).focus();
  await expect.poll(() => page.evaluate((target) => {
    const element = document.querySelector(target);
    const style = getComputedStyle(element);
    return document.activeElement === element
      && (style.outlineStyle !== 'none' || style.boxShadow !== 'none');
  }, selector)).toBe(true);
}

async function expectTouchTarget(page, selector) {
  const box = await page.locator(selector).boundingBox();
  expect(box, `${selector} está visível para toque`).not.toBeNull();
  expect(box.width, `${selector} tem largura mínima de 44 px`).toBeGreaterThanOrEqual(44);
  expect(box.height, `${selector} tem altura mínima de 44 px`).toBeGreaterThanOrEqual(44);
}

async function colorContrast(page) {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const rgb = (value) => {
      const swatch = document.createElement('span');
      swatch.style.color = value.trim();
      document.body.appendChild(swatch);
      const channels = getComputedStyle(swatch).color.match(/\d+/g).map(Number);
      swatch.remove();
      return channels.slice(0, 3).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
    };
    const ratio = (foreground, background) => {
      const luminance = (channels) => 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      const [a, b] = [luminance(rgb(foreground)), luminance(rgb(background))];
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    const token = (name) => root.getPropertyValue(name);
    return {
      normal: ratio(token('--color-text'), token('--color-bg')),
      primaryButton: ratio(token('--color-accent'), '#fff'),
      success: ratio(token('--color-success'), token('--color-bg')),
      warning: ratio(token('--color-warning'), token('--color-bg')),
      danger: ratio(token('--color-danger'), token('--color-bg')),
      disabled: ratio(token('--color-disabled-text'), token('--color-disabled-bg'))
    };
  });
}

test.describe('jornada responsiva acessível', () => {
  test('desktop mantém prévia, galeria e foco utilizáveis em 1440 x 900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openStart(page);

    await expect(page.locator('#screen-start [data-preview]')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectVisibleFocus(page, '#btn-start-wizard');
    const contrast = await colorContrast(page);
    for (const [state, ratio] of Object.entries(contrast)) {
      expect(ratio, `${state} mantém contraste AA`).toBeGreaterThanOrEqual(4.5);
    }

    const label = page.locator('#start-gallery-label');
    const templateBefore = await label.textContent();
    await page.locator('#btn-next-template-start').click();
    await expect(label).not.toHaveText(templateBefore || '');
  });

  test('mobile abre o modal e o drawer pelos gatilhos visíveis em 320 x 800', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openStart(page);

    await expectNoHorizontalOverflow(page);
    await expectTouchTarget(page, '#btn-change-template-start');
    await expectTouchTarget(page, '#btn-toggle-preview-start');

    await page.locator('#btn-change-template-start').click();
    await expect(page.locator('#modal-template')).toBeVisible();
    await expectTouchTarget(page, '#modal-template .modal-close');
    await expectVisibleFocus(page, '#modal-template .modal-close');
    await page.keyboard.press('Escape');
    await expect(page.locator('#modal-template')).toBeHidden();
    await expect(page.locator('#btn-change-template-start')).toBeFocused();

    await page.locator('#btn-toggle-preview-start').click();
    await expect(page.locator('#preview-overlay')).toBeVisible();
    await expect(page.locator('.preview-overlay-inner')).toHaveCSS('overflow', 'hidden');
    await expectTouchTarget(page, '#btn-close-preview');
    await expectVisibleFocus(page, '#btn-close-preview');
    await page.keyboard.press('Escape');
    await expect(page.locator('#preview-overlay')).toBeHidden();
    await expect(page.locator('#btn-toggle-preview-start')).toBeFocused();
  });
});
