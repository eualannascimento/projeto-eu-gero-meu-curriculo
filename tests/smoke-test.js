/**
 * Smoke tests — executar com: node tests/smoke-test.js
 * Testa módulos puros sem DOM.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadScript(relativePath) {
  const filePath = path.join(__dirname, '..', relativePath);
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInThisContext(code, { filename: filePath });
}

// Carregar módulos na ordem correta
loadScript('js/utils.js');
loadScript('js/config.js');
loadScript('js/dates.js');
loadScript('js/scoring.js');
loadScript('js/validation.js');
loadScript('js/storage.js');
loadScript('js/prompts.js');
loadScript('js/router.js');
loadScript('js/sample-data.js');

// js/preview.js só usa document.createElement('div') para escapar HTML;
// shim mínimo o suficiente para carregar o módulo sem um DOM real.
global.document = {
  createElement() {
    let text = '';
    return {
      set textContent(value) { text = value == null ? '' : String(value); },
      get textContent() { return text; },
      get innerHTML() {
        return text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
    };
  }
};
loadScript('js/preview.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ ${message}`);
  }
}

console.log('\n=== Eu Gero — Smoke Tests ===\n');

// --- Scoring ---
console.log('Pontuação por campo:');

assert(
  EuGeroScoring.scoreField('', { required: true, minLength: 3 }, EuGeroConfig.ACTION_VERBS) === 'fraco',
  'Campo obrigatório vazio = Fraco'
);

assert(
  EuGeroScoring.scoreField('João Silva', { required: true, minLength: 3 }, EuGeroConfig.ACTION_VERBS) === 'bom' ||
  EuGeroScoring.scoreField('João Silva', { required: true, minLength: 3 }, EuGeroConfig.ACTION_VERBS) === 'otimo',
  'Campo obrigatório preenchido com tamanho adequado = Bom ou Ótimo'
);

assert(
  EuGeroScoring.scoreField(
    'Implementei um sistema de gestão que reduziu custos em 30% e liderei uma equipe de 5 desenvolvedores.',
    { required: true, minLength: 50, actionVerbs: true },
    EuGeroConfig.ACTION_VERBS
  ) === 'otimo',
  'Descrição com verbo de ação e extensão adequada = Ótimo'
);

assert(
  EuGeroScoring.hasQuantifiedResult('Reduzi custos em 30%'),
  'Detecao de resultado numerico'
);

assert(
  ['bom', 'otimo'].includes(EuGeroScoring.scoreField(
    'Implementei automacao que reduziu custos em 30% com equipe enxuta.',
    { required: true, minLength: 50, actionVerbs: true, key: 'description' },
    EuGeroConfig.ACTION_VERBS
  )),
  'Texto curto com verbo e numero nao e punido como fraco'
);

assert(
  EuGeroScoring.scoreField('Trabalhei na empresa.', { required: true, minLength: 50, actionVerbs: true, key: 'description' }, EuGeroConfig.ACTION_VERBS) === 'fraco',
  'Descricao curta sem verbo de acao = Fraco'
);

assert(
  EuGeroScoring.hasActionVerb('Desenvolvi APIs RESTful', EuGeroConfig.ACTION_VERBS),
  'Detecção de verbo de ação funciona'
);

// --- Prompts ---
console.log('\nGeração de prompts IA:');

const emptyState = EuGeroConfig.createEmptyState();
const filledState = {
  ...emptyState,
  personal: {
    fullName: 'Maria Teste',
    headline: 'Desenvolvedora',
    email: 'maria@test.com',
    phone: '11999999999',
    location: 'São Paulo, SP',
    linkedinUrl: 'https://linkedin.com/in/maria'
  },
  summary: 'Profissional com experiência em desenvolvimento.'
};

const promptWithData = EuGeroPrompts.buildGeneralPrompt(filledState, true);
const promptWithoutData = EuGeroPrompts.buildGeneralPrompt(filledState, false);

assert(promptWithData.includes('Maria Teste'), 'Prompt geral com dados inclui nome');
assert(!promptWithoutData.includes('maria@test.com'), 'Prompt geral sem dados não inclui e-mail');
assert(promptWithoutData.includes('Não incluí meus dados'), 'Prompt sem dados indica ausência de dados pessoais');

const sectionPrompt = EuGeroPrompts.buildSectionPrompt('experiences', filledState, true);
assert(sectionPrompt.toLowerCase().includes('experiência'), 'Prompt por seção contém contexto da seção');

const translationPrompt = EuGeroPrompts.buildTranslationPrompt(filledState, true);
assert(translationPrompt.includes('português') && translationPrompt.includes('inglês'), 'Prompt de tradução contém instrução correta');
assert(translationPrompt.includes('Maria Teste'), 'Prompt de tradução inclui dados quando marcado');

// --- JSON serialize/deserialize ---
console.log('\nExport/Import JSON:');

const stateToExport = {
  ...filledState,
  template: 'modern',
  experiences: [{ company: 'Tech Co', title: 'Dev', startDate: '2020', endDate: '2023', description: 'Implementei features.' }]
};

const serialized = EuGeroStorage.serialize(stateToExport);
assert(serialized.includes('"template": "modern"'), 'JSON contém template selecionado');
assert(serialized.includes('Tech Co'), 'JSON contém dados de experiência');

const deserialized = EuGeroStorage.deserialize(serialized);
assert(deserialized.valid === true, 'Import de JSON válido aceito');
assert(deserialized.data.template === 'modern', 'Template restaurado corretamente');
assert(deserialized.data.experiences[0].company === 'Tech Co', 'Experiências restauradas');

const invalidResult = EuGeroStorage.validateImportData({ foo: 'bar' });
assert(invalidResult.valid === false, 'JSON inválido rejeitado');

const corrupted = EuGeroStorage.validateImportData(null);
assert(corrupted.valid === false, 'Dados nulos rejeitados');

// --- Template switch (data preservation) ---
console.log('\nTroca de template:');

const beforeSwitch = EuGeroStorage.mergeWithDefaults({ ...stateToExport, template: 'classic' });
const afterSwitch = { ...beforeSwitch, template: 'modern' };
assert(beforeSwitch.personal.fullName === afterSwitch.personal.fullName, 'Troca de template preserva dados pessoais');
assert(beforeSwitch.experiences.length === afterSwitch.experiences.length, 'Troca de template preserva listas');
assert(beforeSwitch.template === 'classic' && afterSwitch.template === 'modern', 'Template alterado sem perder dados');

// --- Aggregate scoring ---
console.log('\nPontuação agregada:');

const scoreResults = EuGeroScoring.scoreState(filledState, EuGeroConfig.SECTIONS, EuGeroConfig.ACTION_VERBS);
const aggregate = EuGeroScoring.aggregateScore(scoreResults);
assert(typeof aggregate.overall === 'number', 'Pontuação geral é numérica');
assert(aggregate.overall >= 0 && aggregate.overall <= 100, 'Pontuação geral entre 0 e 100');
assert(Array.isArray(aggregate.weakFields), 'Lista de campos fracos retornada');

// --- LinkedIn guide entries ---
console.log('\nGuia LinkedIn:');

// linkedin-guide needs DOM for renderGuide, but buildEntries is testable if we load it
loadScript('js/linkedin-guide.js');
const entries = EuGeroLinkedInGuide.buildEntries(filledState);
assert(entries.length > 0, 'Guia gera entradas para dados preenchidos');
assert(entries.some(e => e.title.includes('Sobre') || e.content.includes('Profissional')), 'Guia inclui resumo');

// O guia mantém passos fixos de orientação (Foto, Título, URL, Recomendações)
// mesmo sem dados, mas omite as seções condicionais vazias.
const emptyEntries = EuGeroLinkedInGuide.buildEntries(emptyState);
assert(!emptyEntries.some(e => ['Sobre', 'Experiência', 'Competências', 'Idiomas', 'Formação'].includes(e.title)),
  'Guia omite seções vazias (mantém só passos fixos)');
assert(emptyEntries.every(e => e.path && e.tip), 'Todo passo do guia tem caminho e dica');

// --- Skills semicolon parsing ---
console.log('\nHabilidades (ponto e vírgula):');

const parsed = EuGeroConfig.parseSkillsText('JavaScript; React; Node.js');
assert(parsed.length === 3, 'Parse de habilidades separadas por ;');
assert(parsed[0].name === 'JavaScript', 'Primeira habilidade parseada corretamente');

// --- Enabled sections ---
console.log('\nSeções habilitadas:');

// personal/summary/skills sao travadas (sempre incluidas), como no modelo
const enabled = EuGeroConfig.getActiveSections(['personal', 'experiences']);
assert(enabled.length === 4, 'Sempre inclui as seções travadas (personal, summary, skills)');
assert(EuGeroConfig.isSectionMandatory('personal'), 'Dados pessoais é obrigatório');
assert(EuGeroConfig.isSectionMandatory('summary'), 'Resumo é obrigatório');
assert(EuGeroConfig.isSectionMandatory('skills'), 'Habilidades é obrigatório');
assert(!EuGeroConfig.isSectionMandatory('projects'), 'Projetos é opcional');

const normalized = EuGeroConfig.normalizeEnabledSections(['experiences']);
assert(normalized.includes('personal'), 'Sempre inclui seção obrigatória');

// --- P0.1: gate de avanço do wizard (não avança com validação falha) ---
console.log('\nGate de avanço do wizard:');

const staying = EuGeroValidation.resolveStepAdvance(false, 1, 4);
assert(staying.action === 'stay' && staying.step === 1, 'Etapa inválida não avança nem muda o step atual');

const advancing = EuGeroValidation.resolveStepAdvance(true, 1, 4);
assert(advancing.action === 'advance' && advancing.step === 2, 'Etapa válida avança para o próximo step');

const reviewing = EuGeroValidation.resolveStepAdvance(true, 3, 4);
assert(reviewing.action === 'review', 'Última etapa válida vai para a revisão em vez de avançar');

const stayingLast = EuGeroValidation.resolveStepAdvance(false, 3, 4);
assert(stayingLast.action === 'stay' && stayingLast.step === 3, 'Última etapa inválida não vai para a revisão');

// --- Page fit (one-page CV) ---
console.log('\nCurrículo de uma página:');

const lightSections = EuGeroConfig.getActiveSections(['personal', 'summary', 'experiences']);
const pageFitOk = EuGeroScoring.scorePageFit(filledState, lightSections);
assert(typeof pageFitOk.fitScore === 'number', 'Page fit retorna fitScore numérico');
assert(Array.isArray(pageFitOk.issues), 'Page fit retorna lista de issues');

const heavyState = {
  ...filledState,
  summary: 'A'.repeat(4000),
  experiences: Array.from({ length: 6 }, (_, i) => ({
    company: `Empresa ${i}`,
    title: 'Analista',
    startDate: '2020',
    endDate: '2024',
    description: 'Implementei processos e liderei equipes com resultados mensuráveis em diversos projetos. '.repeat(8)
  }))
};
const pageFitHeavy = EuGeroScoring.scorePageFit(heavyState, EuGeroConfig.SECTIONS);
assert(pageFitHeavy.level === 'overflow', 'Conteúdo excessivo marca overflow');
assert(pageFitHeavy.issues.length > 0, 'Overflow gera avisos');

const aggWithFit = EuGeroScoring.aggregateScore(
  EuGeroScoring.scoreState(filledState, lightSections, EuGeroConfig.ACTION_VERBS),
  pageFitHeavy
);
assert(aggWithFit.overall <= 45, 'Overflow penaliza pontuação geral');

// --- Validacao ---
console.log('\nValidacao de campos:');

assert(!EuGeroValidation.validateEmail('invalido').ok, 'E-mail invalido rejeitado');
assert(EuGeroValidation.validateEmail('a@b.co').ok, 'E-mail valido aceito');
assert(!EuGeroValidation.validateUrl('ftp://x').ok || EuGeroValidation.validateUrl('https://linkedin.com/in/x').ok, 'URL http(s) valida');

// --- Datas ---
console.log('\nDatas estruturadas:');

assert(EuGeroDates.serializeDate('03', '2020') === '2020-03', 'Serializa mes/ano');
assert(EuGeroDates.formatDisplayDate('2020-03', false) === 'Mar 2020', 'Formata exibicao Mar 2020');
assert(EuGeroDates.formatPeriod('2020-03', '', true) === 'Mar 2020 - Atual', 'Periodo com ate hoje');

// --- Router ---
console.log('\nRoteamento hash:');

assert(EuGeroRouter.parseHash('#/wizard/experiences').view === 'wizard', 'Hash wizard parseado');
assert(EuGeroRouter.parseHash('#/wizard/experiences').sectionId === 'experiences', 'Secao no hash');
assert(EuGeroRouter.buildHash('review', null) === '#/review', 'Build hash review');

// --- Sample data ---
console.log('\nDados de exemplo:');

const sample = EuGeroSampleData.build();
assert(sample.personal.fullName.length > 0, 'Sample tem nome');
assert(sample.experiences.length > 0, 'Sample tem experiencias');

// --- ATS templates ---
console.log('\nTemplates ATS:');

assert(EuGeroConfig.getTemplateMeta('classic').atsFriendly === true, 'Classico amigavel ATS');
assert(EuGeroConfig.getTemplateMeta('modern').atsFriendly === false, 'Moderno aviso ATS');

// --- Progresso de Preenchimento ---
console.log('\nProgresso de Preenchimento:');

const testStateEmpty = EuGeroConfig.createEmptyState();
// Seções ativas por padrão: personal (4 campos obrigatórios: fullName,
// headline, email, location), summary (1: summary), skills (0, o campo de
// texto de habilidades não é obrigatório), experiences/education/languages
// (seções de lista habilitadas e vazias contam 1 cada como pendentes - P0.5).
// Total = 4 + 1 + 1 + 1 + 1 = 8.
const progressEmpty = EuGeroScoring.calculateProgress(testStateEmpty);
assert(progressEmpty === 0, 'Estado vazio = 0% de progresso');

const testStatePartial = {
  ...testStateEmpty,
  personal: {
    ...testStateEmpty.personal,
    fullName: 'Maria Teste',
    email: 'maria@test.com'
  }
};
// 2 campos preenchidos de 8 obrigatórios. Math.round((2 / 8) * 100) = 25.
const progressPartial = EuGeroScoring.calculateProgress(testStatePartial);
assert(progressPartial === 25, 'Estado parcial (2/8, seções de lista vazias contam) = 25% de progresso');

const testStateZeroRequired = {
  ...testStateEmpty,
  personal: {
    fullName: 'Maria Teste',
    headline: 'Desenvolvedora',
    email: 'maria@test.com',
    location: 'São Paulo, SP'
  },
  summary: 'Resumo preenchido para atingir 100% das seções obrigatórias.',
  enabledSections: ['personal', 'summary', 'skills'] // Seções travadas totalmente preenchidas
};
const progressZero = EuGeroScoring.calculateProgress(testStateZeroRequired);
assert(progressZero === 100, 'Seções obrigatórias preenchidas = 100% de progresso');


// --- Personagens de exemplo ---
console.log('\nPersonagens de exemplo:');

loadScript('js/characters.js');
const characters = EuGeroCharacters.CHARACTERS;
const validSectionIds = EuGeroConfig.SECTIONS.map((s) => s.id);
// A opcao "Em branco" (state: null) e valida: comeca do zero.
const filledCharacters = characters.filter((c) => c.state);

assert(Array.isArray(characters) && filledCharacters.length >= 4, 'Ha pelo menos 4 personagens preenchidos');
assert(
  characters.some((c) => c.state === null),
  'Existe a opcao Em branco (state null) para comecar do zero'
);
assert(
  characters[0].id === 'blank' && characters[0].state === null,
  'Em branco e o primeiro ponto de partida'
);
assert(
  filledCharacters.every((c) => EuGeroConfig.TEMPLATE_IDS.includes(c.state.template)),
  'Todo personagem usa template existente'
);
assert(
  filledCharacters.every((c) => c.state.enabledSections.every((id) => validSectionIds.includes(id))),
  'Todo personagem habilita apenas secoes validas'
);
assert(
  filledCharacters.every((c) => c.state.personal.fullName && c.state.personal.headline),
  'Todo personagem tem nome e headline'
);
assert(
  filledCharacters.every((c) => c.state.personal.email.endsWith('@exemplo.com.br')),
  'Contatos usam dominio reservado @exemplo.com.br (sem PII real)'
);
assert(
  EuGeroCharacters.getById(characters[0].id) === characters[0],
  'getById retorna o personagem correto'
);

// --- Templates completos ---
console.log('\nCatalogo de templates:');

assert(EuGeroConfig.TEMPLATE_IDS.length === 20, 'Catalogo tem 20 templates');
assert(
  EuGeroConfig.TEMPLATE_IDS.every((id) => {
    const t = EuGeroConfig.TEMPLATES[id];
    return t.id === id && t.name && t.description && typeof t.atsFriendly === 'boolean'
      && ['centered', 'left', 'banner', 'sidebar', 'creative'].includes(t.layout);
  }),
  'Todo template tem id, name, description, layout valido e flag atsFriendly booleana'
);
assert(
  EuGeroConfig.TEMPLATE_IDS.filter((id) => EuGeroConfig.TEMPLATES[id].atsFriendly).length >= 12,
  'Maioria dos modelos e amigavel a ATS (uso em vaga real)'
);

// --- Feedback acionavel por secao ---
console.log('\nFeedback por secao (review):');

const weakState = {
  ...emptyState,
  personal: { fullName: 'Ana Prova', headline: 'Atendente', email: 'ana@test.com', phone: '', location: 'Recife, PE', linkedinUrl: '' },
  summary: 'Trabalhei atendendo clientes na loja do meu bairro durante dois anos seguidos sem parar.'
};
const feedback = EuGeroScoring.buildSectionFeedback(
  weakState, EuGeroConfig.getActiveSections(['personal', 'summary']), EuGeroConfig.ACTION_VERBS
);
const summaryFeedback = feedback.find((f) => f.sectionId === 'summary');
assert(!!summaryFeedback, 'Feedback inclui a secao Resumo');
assert(
  summaryFeedback.tips.some((t) => t.advice.includes('verbo de ação')),
  'Resumo sem verbo de acao recebe dica especifica citando verbo'
);
assert(
  feedback.every((f) => ['otimo', 'bom', 'fraco', 'vazio'].includes(f.status)),
  'Todo status de secao e um dos quatro conhecidos'
);
assert(
  EuGeroScoring.explainField('', { required: true, minLength: 3 }, EuGeroConfig.ACTION_VERBS) === 'preencha este campo',
  'Campo vazio: dica de preencher'
);

// --- Nivel de idioma predefinido ---
console.log('\nNivel de idioma:');

const langSection = EuGeroConfig.SECTIONS.find((s) => s.id === 'languages');
const levelField = langSection.itemFields.find((f) => f.key === 'level');
assert(levelField.type === 'select', 'Nivel de idioma e um select');
assert(
  Array.isArray(levelField.options) && levelField.options.length === 4 && levelField.options.includes('Fluente'),
  'Select de nivel tem os 4 niveis predefinidos'
);
assert(!levelField.options.includes('Nativo'), 'Nivel de idioma nao inclui Nativo (evita inferencia de nacionalidade/origem)');

// --- Sem travessao em textos de UI ---
console.log('\nTextos sem travessao:');

const uiSources = ['index.html', 'js/config.js', 'js/prompts.js', 'js/characters.js', 'js/linkedin-guide.js'];
const withDash = uiSources.filter((p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8').match(/—|–/));
assert(withDash.length === 0, `Nenhum travessao em textos de UI${withDash.length ? ' (falha: ' + withDash.join(', ') + ')' : ''}`);

// --- Exportacao apenas PDF: sem residuos de Word/DOCX no projeto ---
console.log('\nExportacao (somente PDF):');

const noWordRefs = ['js/app.js', 'index.html'].filter((p) => {
  const code = fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
  return /export\.js|libs\.js|cv-data\.js|exportDocx|EuGeroExport|EuGeroLibs|EuGeroCvData/.test(code);
});
assert(noWordRefs.length === 0, `Sem referencias a Word/export removidos${noWordRefs.length ? ' (falha: ' + noWordRefs.join(', ') + ')' : ''}`);
assert(!fs.existsSync(path.join(__dirname, '..', 'js/export.js')), 'js/export.js removido');
assert(!fs.existsSync(path.join(__dirname, '..', 'js/cv-data.js')), 'js/cv-data.js removido');

// --- P0.2: sem listener duplicado no botão "Voltar" da configuração ---
console.log('\nNavegação sem binding duplicado:');

const appJsCode = fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8');
const backStartBindings = (appJsCode.match(/getElementById\('btn-back-start'\)\?\.addEventListener/g) || []).length;
assert(backStartBindings === 1, `btn-back-start tem exatamente 1 listener de clique (encontrados: ${backStartBindings})`);

// --- P0.3: sem skeletons/placeholders no PDF exportado ---
console.log('\nExportação sem skeletons:');

const previewEmptyState = {
  template: 'classic',
  personal: { fullName: 'Maria Teste', headline: 'Engenheira de Dados' },
  summary: '',
  experiences: [],
  education: [],
  skills: [],
  skillsText: '',
  languages: []
};
const exportSections = EuGeroConfig.getActiveSections(['experiences', 'education']);

const exportHtml = EuGeroPreview.render(previewEmptyState, 'classic', exportSections, 'export');
assert(!exportHtml.includes('cv-section-skeleton'), 'Modo export não inclui skeletons de seção vazia');
assert(!exportHtml.includes('>Experiência<'), 'Modo export não inclui título de seção vazia (Experiência)');
assert(!exportHtml.includes('>Resumo<'), 'Modo export não inclui título de seção vazia (Resumo)');

const editorHtml = EuGeroPreview.render(previewEmptyState, 'classic', exportSections);
assert(editorHtml.includes('cv-section-skeleton'), 'Modo padrão (editor) preserva skeletons de seção vazia');

const printCvUsesExportMode = /EuGeroPreview\.render\(\s*state\s*,\s*state\.template\s*,\s*activeSections\(\)\s*,\s*['"]export['"]\s*\)/.test(appJsCode);
assert(printCvUsesExportMode, 'printCv() chama EuGeroPreview.render com modo "export"');

// --- P0.4: tipografia unificada entre previa e PDF, sem fator de conversão ---
console.log('\nTipografia unificada (previa = PDF):');

const cssCode = fs.readFileSync(path.join(__dirname, '..', 'css/style.css'), 'utf8');
assert(!cssCode.includes('calc(210mm *'), 'CSS não usa mais fator de conversão calc(210mm * X / 370) entre previa e impressão');
assert(!appJsCode.includes('A4_BASE_WIDTH = 370'), 'app.js não usa mais 370px arbitrário como base da página A4');

const normalFontMatch = cssCode.match(/cv-density-normal\s*\{[^}]*--doc-font-size:\s*([\d.]+)pt/);
const condensedFontMatch = cssCode.match(/cv-density-condensado\s*\{[^}]*--doc-font-size:\s*([\d.]+)pt/);
assert(normalFontMatch && parseFloat(normalFontMatch[1]) >= 10, 'Fonte normal (previa/PDF) nunca abaixo de 10pt');
assert(condensedFontMatch && parseFloat(condensedFontMatch[1]) >= 10, 'Fonte condensada (previa/PDF) nunca abaixo de 10pt');

// --- P0.5: progresso não ignora seção de lista habilitada e vazia ---
console.log('\nProgresso de preenchimento:');

const filledPersonal = {
  fullName: 'Maria Teste',
  headline: 'Engenheira de Dados',
  email: 'maria@teste.com',
  location: 'São Paulo, SP'
};
const progressStateEmptyList = {
  enabledSections: ['experiences'],
  personal: filledPersonal,
  summary: 'Resumo profissional completo com experiência relevante em dados.',
  skillsText: 'SQL; Python; Power BI',
  experiences: []
};
const progressWithEmptyExperiences = EuGeroScoring.calculateProgress(progressStateEmptyList);
assert(progressWithEmptyExperiences < 100, 'Seção "Experiência" habilitada e vazia não conta como 100% preenchida');

const progressStateFilledList = {
  ...progressStateEmptyList,
  experiences: [{ title: 'Engenheira de Dados', company: 'Empresa X', description: 'Descrição com mais de quarenta e cinco caracteres para passar na validação obrigatória.' }]
};
const progressWithFilledExperiences = EuGeroScoring.calculateProgress(progressStateFilledList);
assert(progressWithFilledExperiences > progressWithEmptyExperiences, 'Preencher a experiência aumenta o progresso em relação à seção vazia');
assert(progressWithFilledExperiences === 100, 'Todos os campos obrigatórios preenchidos resulta em 100%');

// --- Ajustes de textos ATS ---
console.log('\nTextos ATS (dicas de campos revisadas):');

const headlineField = EuGeroConfig.SECTIONS.find(s => s.id === 'personal').fields.find(f => f.key === 'headline');
assert(headlineField.tip === 'Use um cargo ou uma área clara. Quando fizer sentido, use o mesmo termo adotado nas vagas que procura.', 'Dica de cargo/área revisada');

const summarySection = EuGeroConfig.SECTIONS.find(s => s.id === 'summary');
assert(summarySection.description === 'Escreva duas ou três frases sobre sua experiência, suas principais habilidades e o tipo de oportunidade que busca.', 'Descricao do resumo revisada');
assert(summarySection.fields[0].tip === 'Inclua sua área, experiências e habilidades mais relevantes. Use termos da vaga somente quando eles representarem de verdade o seu perfil.', 'Dica do resumo revisada');

const experienceFields = EuGeroConfig.SECTIONS.find(s => s.id === 'experiences').itemFields;
assert(experienceFields.find(f => f.key === 'title').tip === 'Use um nome de função claro e conhecido. Se o título usado pela empresa for pouco comum, acrescente uma forma equivalente entre parênteses, sem alterar o sentido.', 'Dica de cargo/funcao revisada');
assert(experienceFields.find(f => f.key === 'period').tip === 'Informe o mês e o ano de início e fim. Marque “Até hoje” se ainda realiza essa atividade.', 'Dica de periodo (experiencia) revisada');
assert(experienceFields.find(f => f.key === 'description').tip === 'Descreva suas atividades, os conhecimentos ou as ferramentas usadas e os resultados relevantes. Use termos específicos e verdadeiros, sem repetir palavras apenas para aumentar a correspondência com a vaga.', 'Dica de atividades e resultados revisada');

const educationFields = EuGeroConfig.SECTIONS.find(s => s.id === 'education').itemFields;
assert(educationFields.find(f => f.key === 'degree').tip === 'Informe o nome completo do curso, da formação ou da atividade de aprendizagem. Evite abreviações pouco conhecidas.', 'Dica de curso/formacao revisada');
assert(educationFields.find(f => f.key === 'institution').tip === 'Informe o nome completo da escola, faculdade, plataforma ou instituição.', 'Dica de instituicao (formacao) revisada');

const skillsSection = EuGeroConfig.SECTIONS.find(s => s.id === 'skills');
assert(skillsSection.description === 'Liste habilidades, ferramentas, tecnologias e formas de trabalhar que sejam relevantes para a oportunidade desejada.', 'Descricao de habilidades revisada');
assert(skillsSection.fields[0].tip === 'Priorize conhecimentos relacionados à vaga. Use os nomes mais conhecidos no mercado e adicione somente habilidades que você realmente possui.', 'Dica de habilidades revisada');

const certFields = EuGeroConfig.SECTIONS.find(s => s.id === 'certifications').itemFields;
assert(certFields.find(f => f.key === 'name').tip === 'Informe o nome completo do curso, treinamento ou certificação. Evite siglas sem escrever também o nome por extenso.', 'Dica de nome de certificacao revisada');
assert(certFields.find(f => f.key === 'issuer').tip === 'Informe o nome completo da instituição ou plataforma responsável.', 'Dica de instituicao (certificacao) revisada');

const projectFields = EuGeroConfig.SECTIONS.find(s => s.id === 'projects').itemFields;
assert(projectFields.find(f => f.key === 'description').tip === 'Explique sua participação, as ferramentas ou os conhecimentos usados e os resultados, quando houver. Inclua termos da área somente quando corresponderem ao que você fez.', 'Dica de participacao em projetos revisada');

console.log('\nTextos ATS (catalogo de modelos):');

const sidebarNote = 'Este modelo divide o conteúdo em mais de uma área visual. Alguns sistemas podem misturar a ordem das informações. Para uma leitura mais segura, prefira um modelo de uma coluna.';
['petroleo', 'oliva', 'modern'].forEach((id) => {
  assert(EuGeroConfig.TEMPLATES[id].atsNote === sidebarNote, `Nota de ATS revisada para modelo com barra lateral (${id})`);
});
const creativeNote = 'Este modelo usa um elemento gráfico no topo. Alguns sistemas podem ignorar ou reorganizar essa parte do conteúdo.';
['creative', 'rosado'].forEach((id) => {
  assert(EuGeroConfig.TEMPLATES[id].atsNote === creativeNote, `Nota de ATS revisada para modelo com selo gráfico (${id})`);
});

console.log('\nTextos ATS (prompts de IA):');

assert(EuGeroPrompts.SECTION_PROMPTS.summary.includes('Se eu fornecer uma descrição de vaga'), 'Instrucao de resumo cita descricao da vaga');
assert(EuGeroPrompts.SECTION_PROMPTS.experiences.includes('Se eu fornecer uma descrição de vaga'), 'Instrucao de experiencia cita descricao da vaga');
assert(EuGeroPrompts.SECTION_PROMPTS.skills.includes('Se eu incluir uma descrição de vaga'), 'Instrucao de habilidades cita descricao da vaga');

const generalPromptNoData = EuGeroPrompts.buildGeneralPrompt({}, false);
assert(generalPromptNoData.includes('se eu fornecer uma descrição de vaga, compare o currículo com os requisitos'), 'Introducao geral inclui orientacao sobre descricao da vaga');
assert(generalPromptNoData.includes('não repita palavras-chave de forma artificial'), 'Introducao geral pede para nao repetir palavras-chave de forma artificial');
assert(generalPromptNoData.includes('não invente experiências, ferramentas, resultados ou qualificações'), 'Introducao geral reforca nao inventar informacoes');

const sectionPromptNoJob = EuGeroPrompts.buildSectionPrompt('summary', {}, false);
assert(sectionPromptNoJob.includes('Se houver uma descrição de vaga, use-a apenas como referência'), 'Frase-guia revisada aparece no prompt de secao');
assert(!sectionPromptNoJob.includes('DESCRIÇÃO DA VAGA'), 'Sem bloco de descricao da vaga quando nao informada');

const sectionPromptWithJob = EuGeroPrompts.buildSectionPrompt('summary', {}, false, 'Vaga de Analista de Dados Senior');
assert(sectionPromptWithJob.includes('Vaga de Analista de Dados Senior'), 'Descricao da vaga informada entra no prompt de secao');

console.log('\nTextos ATS (index.html):');

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(htmlContent.includes('Leitura por ATS'), 'HTML tem o rotulo "Leitura por ATS" na previa do start');
assert(htmlContent.includes('Descrição da vaga'), 'Modal de IA tem o campo "Descrição da vaga"');
assert(htmlContent.includes('Cole aqui a descrição da vaga'), 'Placeholder do campo descricao da vaga presente');
assert(htmlContent.includes('O texto permanece neste dispositivo'), 'Nota de privacidade do campo descricao da vaga presente');
assert(htmlContent.includes('Algumas plataformas usam sistemas ATS para ler e organizar currículos'), 'Paragrafo do modal trocar modelo atualizado');

console.log('\nTextos ATS (js/app.js):');

const appJsContent = fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8');
assert(appJsContent.includes('Estrutura favorável a ATS'), 'Selo "Estrutura favoravel a ATS" presente em app.js');
assert(appJsContent.includes('Pode dificultar a leitura por ATS'), 'Selo "Pode dificultar a leitura por ATS" presente em app.js');
assert(!appJsContent.includes('Favorável a ATS'), 'Selo antigo "Favorável a ATS" removido de app.js');
assert(!appJsContent.includes('Pode exigir atenção no ATS'), 'Texto antigo de selo removido de app.js');
assert(appJsContent.includes('confirme se o texto pode ser selecionado e copiado'), 'Toast de exportacao pede confirmar texto selecionavel');
assert(appJsContent.includes('revise os campos preenchidos automaticamente'), 'Orientacao pos-download pede revisar campos importados');
assert(appJsContent.includes('Esta verificação considera apenas a estrutura e a organização do currículo'), 'Texto de apoio do painel Leitura por ATS presente em app.js');
assert(appJsContent.includes('Estrutura favorável') && appJsContent.includes('Revise a estrutura'), 'Status do painel Leitura por ATS presentes em app.js');
assert(appJsContent.includes('Antes de enviar'), 'Rotulo da checklist "Antes de enviar" presente em app.js');
assert(appJsContent.includes('Confirme se o texto do PDF pode ser selecionado e copiado.'), 'Checklist inclui item sobre texto selecionavel no PDF');
assert(appJsContent.includes('Dica: leia os requisitos da vaga e confira se as habilidades'), 'Dica de habilidades x requisitos da vaga presente abaixo das sugestoes');

// --- Link do LinkedIn clicavel na previa/PDF ---
console.log('\nLink do LinkedIn clicavel:');

const linkedinState = {
  template: 'classic',
  personal: {
    fullName: 'Maria Teste',
    headline: 'Engenheira de Dados',
    linkedinUrl: 'https://linkedin.com/in/maria-teste'
  },
  summary: '',
  experiences: [],
  education: [],
  skills: [],
  skillsText: '',
  languages: []
};
const linkedinSections = EuGeroConfig.getActiveSections(['experiences', 'education']);
const linkedinHtml = EuGeroPreview.render(linkedinState, 'classic', linkedinSections, 'export');
assert(linkedinHtml.includes('href="https://linkedin.com/in/maria-teste"'), 'Link do LinkedIn vira <a href> na previa/PDF');
assert(linkedinHtml.includes('target="_blank"') && linkedinHtml.includes('rel="noopener noreferrer"'), 'Link do LinkedIn abre em nova aba sem vazar window.opener');
assert(linkedinHtml.includes('>linkedin.com/in/maria-teste<') || linkedinHtml.includes('>https://linkedin.com/in/maria-teste<'), 'Texto visivel do link do LinkedIn preservado');

// --- Utilitários compartilhados (EuGeroUtils) ---
console.log('\nUtilitários compartilhados:');

assert(
  EuGeroUtils.escapeHtml(`<b>"a" & 'b'</b>`) === '&lt;b&gt;&quot;a&quot; &amp; &#39;b&#39;&lt;/b&gt;',
  'escapeHtml escapa &, <, >, " e \''
);
assert(
  EuGeroUtils.escapeAttr('<b>"a" & b</b>') === '&lt;b&gt;&quot;a&quot; &amp; b&lt;/b&gt;',
  'escapeAttr escapa &, ", < e >'
);

let debounceCalls = 0;
const debounced = EuGeroUtils.debounce(() => { debounceCalls++; }, 10);
debounced();
debounced();
debounced();

setTimeout(() => {
  assert(debounceCalls === 1, 'debounce cancela chamadas anteriores e executa só a última');
  finishTests();
}, 30);

function finishTests() {
  // --- Summary ---
  console.log(`\n=== Resultado: ${passed} passou, ${failed} falhou ===\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

