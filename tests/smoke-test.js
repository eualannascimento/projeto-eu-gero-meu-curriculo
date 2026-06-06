/**
 * Smoke tests - executar com: node tests/smoke-test.js
 * Testa modulos puros sem DOM.
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
loadScript('js/config.js');
loadScript('js/dates.js');
loadScript('js/scoring.js');
loadScript('js/validation.js');
loadScript('js/storage.js');
loadScript('js/prompts.js');
loadScript('js/cv-data.js');
loadScript('js/router.js');
loadScript('js/sample-data.js');

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

console.log('\n=== Eu Gero - Smoke Tests ===\n');

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
assert(sectionPrompt.includes('Experiências'), 'Prompt por seção contém contexto da seção');

const translationPrompt = EuGeroPrompts.buildTranslationPrompt(filledState, true);
assert(translationPrompt.includes('português para inglês'), 'Prompt de tradução contém instrução correta');
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

const emptyEntries = EuGeroLinkedInGuide.buildEntries(emptyState);
assert(emptyEntries.length === 0, 'Guia omite seções vazias');

// --- Skills semicolon parsing ---
console.log('\nHabilidades (ponto e vírgula):');

const parsed = EuGeroConfig.parseSkillsText('JavaScript; React; Node.js');
assert(parsed.length === 3, 'Parse de habilidades separadas por ;');
assert(parsed[0].name === 'JavaScript', 'Primeira habilidade parseada corretamente');

// --- Enabled sections ---
console.log('\nSeções habilitadas:');

const enabled = EuGeroConfig.getActiveSections(['personal', 'experiences']);
assert(enabled.length === 2, 'Filtra seções habilitadas');
assert(EuGeroConfig.isSectionMandatory('personal'), 'Dados pessoais é obrigatório');
assert(!EuGeroConfig.isSectionMandatory('projects'), 'Projetos é opcional');

const normalized = EuGeroConfig.normalizeEnabledSections(['experiences']);
assert(normalized.includes('personal'), 'Sempre inclui seção obrigatória');

// --- CV data model (preview + export) ---
console.log('\nModelo CV (export fiel):');

const cvDoc = EuGeroCvData.build(filledState);
assert(cvDoc.personal.fullName === 'Maria Teste', 'CvData inclui dados pessoais');
assert(cvDoc.sections.some(s => s.id === 'summary'), 'CvData inclui resumo');
const mainModern = EuGeroCvData.getMainSections(cvDoc, 'modern');
assert(!mainModern.some(s => s.id === 'skills'), 'Template moderno: skills só na sidebar');
assert(cvDoc.sidebar.skills.length >= 0, 'Sidebar moderna estruturada');

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

const activeSections = EuGeroConfig.getActiveSections(filledState.enabledSections);
const exportReadyState = {
  ...filledState,
  summary: 'Profissional com experiencia em desenvolvimento de software, foco em entregar valor e resultados mensuraveis para equipes multidisciplinares.',
  skillsText: 'JavaScript; React; Node.js',
  skills: [{ name: 'JavaScript' }, { name: 'React' }, { name: 'Node.js' }],
  experiences: [{
    company: 'Tech Co',
    title: 'Desenvolvedora',
    startDate: '2020',
    endDate: '2023',
    endCurrent: false,
    description: 'Implementei features web e liderei melhorias de performance com impacto mensuravel na operacao.'
  }],
  education: [{
    institution: 'Universidade Exemplo',
    degree: 'Ciencia da Computacao',
    startDate: '2016',
    endDate: '2020',
    endCurrent: false
  }]
};
const exportValidation = EuGeroValidation.validateActiveSections(exportReadyState, activeSections);
assert(exportValidation.valid, 'Estado preenchido passa validacao de export');

const invalidExportState = {
  ...filledState,
  personal: { ...filledState.personal, email: 'email-invalido' }
};
const invalidExport = EuGeroValidation.validateActiveSections(invalidExportState, activeSections);
assert(!invalidExport.valid, 'E-mail invalido bloqueia export');
assert(invalidExport.issues.some((i) => i.fieldKey === 'email'), 'Issue aponta campo de e-mail');

assert(
  !EuGeroValidation.validateField('email-invalido', { type: 'email', label: 'E-mail', required: true }).ok,
  'Validacao blur de e-mail (validateField)'
);
assert(
  !EuGeroValidation.validateField('ftp://site.com', { type: 'url', label: 'URL', required: false }).ok,
  'Validacao blur de URL (validateField)'
);

// --- Datas ---
console.log('\nDatas estruturadas:');

assert(EuGeroDates.serializeDate('03', '2020') === '2020-03', 'Serializa mes/ano');
assert(EuGeroDates.serializeDate('', '2020') === '2020', 'Ano sem mes nao forca janeiro');
assert(EuGeroDates.formatDisplayDate('2020', false) === '2020', 'Exibe apenas ano quando mes ausente');
assert(EuGeroDates.formatDisplayDate('2020-03', false) === 'Mar 2020', 'Formata exibicao Mar 2020');
assert(EuGeroDates.formatPeriod('2020-03', '', true) === 'Mar 2020 - Atual', 'Periodo com ate hoje');
assert(EuGeroDates.parseStoredDate('2020').month === '', 'Parse ano isolado sem mes');

// --- Separadores (hifen, nao travessao) ---
console.log('\nSeparadores de texto:');

const langState = {
  ...filledState,
  enabledSections: EuGeroConfig.normalizeEnabledSections([...filledState.enabledSections, 'languages']),
  languages: [{ language: 'Ingles', level: 'Avancado' }]
};
const langSections = EuGeroConfig.getActiveSections(langState.enabledSections);
const langDoc = EuGeroCvData.build(langState, langSections);
const langLine = langDoc.sections.find((s) => s.id === 'languages')?.blocks[0]?.text || '';
assert(langLine.includes(' - '), 'Idiomas usa hifen como separador');
assert(!langLine.includes('\u2014'), 'Idiomas nao usa travessao');

const exportSrc = fs.readFileSync(path.join(__dirname, '..', 'js/export.js'), 'utf8');
const previewSrc = fs.readFileSync(path.join(__dirname, '..', 'js/preview.js'), 'utf8');
assert(!exportSrc.includes('\u2014'), 'export.js sem travessao');
assert(!previewSrc.includes('\u2014'), 'preview.js sem travessao');

const promptNoData = EuGeroPrompts.buildGeneralPrompt(filledState, false);
assert(!promptNoData.includes('\u2014'), 'Prompts copiados sem travessao');

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

// --- Summary ---
console.log(`\n=== Resultado: ${passed} passou, ${failed} falhou ===\n`);

if (failed > 0) {
  process.exit(1);
}
