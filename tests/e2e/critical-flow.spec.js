const { test, expect } = require('@playwright/test');

const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';
const draftKey = 'eugero-curriculo-state';

async function openBlankStart(page) {
  await page.goto(`${baseUrl}/index.html`);
  await page.getByRole('button', { name: 'Começar de novo' }).click();
  await expect(page.locator('#screen-start')).toBeVisible();
}

async function fillRequiredPersonalData(page) {
  await page.getByLabel('Nome para o currículo').fill('Ana Teste');
  await page.getByLabel('Cargo ou área desejada').fill('Analista de Dados');
  await page.getByLabel('E-mail').fill('ana.teste@exemplo.com.br');
  await page.getByLabel('Cidade').fill('São Paulo, SP');
}

test.describe('jornada crítica do currículo', () => {
  test('começa em branco, retoma o rascunho, valida, revisa e exporta', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript((key) => localStorage.removeItem(key), draftKey);

    await openBlankStart(page);
    await page.getByRole('button', { name: 'Começar a preencher' }).click();
    await expect(page.locator('#screen-wizard')).toBeVisible();

    await fillRequiredPersonalData(page);
    await expect.poll(() => page.evaluate((key) => {
      const draft = JSON.parse(localStorage.getItem(key) || 'null');
      return draft?.personal?.fullName;
    }, draftKey)).toBe('Ana Teste');

    await page.reload();
    await expect(page.locator('#screen-wizard')).toBeVisible();
    await expect(page.getByLabel('Nome para o currículo')).toHaveValue('Ana Teste');

    await page.getByRole('button', { name: 'Concluir ✓' }).click();
    await expect(page.locator('#screen-review')).toBeVisible();
    await expect(page.getByText('Há campos obrigatórios para revisar')).toBeVisible();

    await page.getByRole('link', { name: /Resumo:/ }).click();
    await page.getByLabel('Um parágrafo curto sobre você').fill(
      'Analista de dados com experiência em relatórios, automação e melhoria de processos para equipes de produto.'
    );
    await page.getByRole('button', { name: 'Concluir ✓' }).click();
    await expect(page.locator('#screen-review')).toBeVisible();
    await expect(page.getByText('Há campos obrigatórios para revisar')).toBeHidden();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Baixar currículo em PDF' }).click();
    const pdf = await download;
    expect(pdf.suggestedFilename()).toMatch(/^CV_Ana-Teste_Analista-de-Dados\.pdf$/);
  });
});
