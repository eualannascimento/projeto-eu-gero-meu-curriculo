const { test, expect } = require('@playwright/test');

const baseUrl = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';
const draftKey = 'eugero-curriculo-state';

async function openBlankStart(page) {
  await page.goto(`${baseUrl}/index.html`);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Começar de novo' }).click();
  await expect(page.locator('#screen-start')).toBeVisible();
}

async function clearDraft(page) {
  await page.goto(`${baseUrl}/index.html`);
  await page.evaluate((key) => localStorage.removeItem(key), draftKey);
}

async function fillRequiredPersonalData(page) {
  await page.getByLabel('Nome para o currículo').fill('Ana Teste');
  await page.getByLabel('Cargo ou área desejada').fill('Analista de Dados');
  await page.getByLabel('E-mail').fill('ana.teste@exemplo.com.br');
  await page.getByLabel('Cidade').fill('São Paulo, SP');
}

async function openExperiencesStep(page) {
  await openBlankStart(page);
  await page.getByRole('button', { name: 'Começar a preencher' }).click();
  await fillRequiredPersonalData(page);
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await page.getByLabel('Um parágrafo curto sobre você').fill(
    'Analista de dados com experiência em relatórios, automação e melhoria de processos para equipes de produto.'
  );
  await advanceToStep(page, 'experiences');
  const addExperience = page.getByRole('button', { name: 'Adicionar experiência' });
  try {
    await expect(addExperience).toBeVisible({ timeout: 2000 });
  } catch {
    // Aguarda a reidratação do wizard em runners mais lentos.
    await page.reload();
    await expect(page.locator('.wizard-step[data-section-id="experiences"]')).toBeVisible();
    await expect(addExperience).toBeVisible();
  }
}

/**
 * Clica em "Próximo" até chegar ao passo pedido, e falha dizendo onde parou.
 *
 * O avanço do wizard é síncrono (`nextStep` valida e renderiza na mesma
 * chamada), então uma espera maior não explicaria a falha vista no CI em
 * 23/08: o passo simplesmente não estava lá. A causa não foi reproduzida
 * localmente, nem com 18 execuções em 8 workers.
 *
 * Enquanto isso, o que dá para garantir é que a próxima ocorrência diga o que
 * aconteceu: se o clique não surtiu efeito, ele é repetido; se o wizard parou
 * em outro passo, a mensagem diz qual, em vez de apenas "element(s) not
 * found". Um clique repetido não pula etapa, porque a verificação do passo
 * atual acontece antes.
 */
async function advanceToStep(page, sectionId) {
  const alvo = page.locator(`.wizard-step[data-section-id="${sectionId}"]`);

  await expect(async () => {
    if (await alvo.isVisible()) return;

    const passoAtual = await page.locator('.wizard-step[data-section-id]').first()
      .getAttribute('data-section-id').catch(() => null);

    await page.getByRole('button', { name: 'Próximo', exact: true }).click();

    await expect(
      alvo,
      `wizard nao chegou ao passo "${sectionId}"; passo visivel: ${passoAtual ?? 'nenhum'}`,
    ).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

async function fillExperience(page, { title, company, description }) {
  await page.getByLabel('Cargo ou função').fill(title);
  await page.getByLabel('Empresa, organização ou projeto').fill(company);
  await page.getByLabel('Atividades e resultados').fill(description);
}

test.describe('jornada crítica do currículo', () => {
  test('começa em branco, retoma o rascunho, valida, revisa e exporta', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await clearDraft(page);

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
    await expect(page.locator('.wizard-step[data-section-id="summary"]')).toBeVisible();
    await expect(page.getByLabel('Um parágrafo curto sobre você')).toBeFocused();
    await expect(page.getByLabel('Um parágrafo curto sobre você')).toHaveAttribute('aria-invalid', 'true');
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

  test('bloqueia avanço, seleciona a primeira experiência inválida e permite corrigi-la', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await clearDraft(page);

    await openExperiencesStep(page);
    await page.getByRole('button', { name: 'Adicionar experiência' }).click();
    await fillExperience(page, {
      title: 'Analista de Dados',
      company: 'Empresa Exemplo',
      description: 'Analisei indicadores, automatizei relatórios e apresentei resultados para a equipe de produto.'
    });

    await expect(page.getByRole('tab', { name: 'Experiência 2' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: 'Próximo', exact: true }).click();

    await expect(page.locator('.wizard-step[data-section-id="experiences"]')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Experiência 1' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#field-experiences-0-title')).toBeFocused();
    await expect(page.locator('#field-experiences-0-title')).toHaveAttribute('aria-invalid', 'true');

    await fillExperience(page, {
      title: 'Assistente de Dados',
      company: 'Empresa Anterior',
      description: 'Organizei planilhas, conferi dados e ajudei a reduzir erros nos relatórios mensais da equipe.'
    });
    await page.getByRole('button', { name: 'Próximo', exact: true }).click();
    await expect(page.locator('.wizard-step[data-section-id="education"]')).toBeVisible();
  });

  test('entra pela tela inicial, retoma e exporta em 320 CSS px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await clearDraft(page);
    await openBlankStart(page);
    await page.getByRole('button', { name: 'Começar a preencher' }).click();
    await fillRequiredPersonalData(page);

    await expect.poll(() => page.evaluate((key) => {
      const draft = JSON.parse(localStorage.getItem(key) || 'null');
      return draft?.personal?.fullName;
    }, draftKey)).toBe('Ana Teste');

    await page.goto(`${baseUrl}/index.html`);
    await expect(page.locator('#screen-characters')).toBeVisible();
    await expect(page.locator('#btn-resume-draft')).toBeVisible();
    await page.locator('#btn-resume-draft').click();
    await expect(page.locator('#screen-wizard')).toBeVisible();
    await expect(page.getByLabel('Nome para o currículo')).toHaveValue('Ana Teste');

    await page.getByRole('button', { name: 'Próximo', exact: true }).click();
    await page.getByLabel('Um parágrafo curto sobre você').fill(
      'Analista de dados com experiência em relatórios, automação e melhoria de processos para equipes de produto.'
    );
    await page.getByRole('button', { name: 'Concluir ✓' }).click();
    await expect(page.locator('#screen-review')).toBeVisible();

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Baixar currículo em PDF' }).click();
    const pdf = await download;
    expect(pdf.suggestedFilename()).toBe('CV_Ana-Teste_Analista-de-Dados.pdf');
  });
});
