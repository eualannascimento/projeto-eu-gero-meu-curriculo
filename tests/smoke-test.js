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
loadScript('js/pdf-export.js');

let passed = 0;
let failed = 0;
let pendingAsyncTests = Promise.resolve();

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

// --- Cor compartilhada entre prévia e PDF ---
console.log('\nCor dos modelos na prévia e no PDF:');

const previewColorVars = {};
const previewColorContainer = {
  parentElement: null,
  style: { setProperty(name, value) { previewColorVars[name] = value; } },
  className: '',
  innerHTML: '',
  querySelector() { return null; }
};
const colorState = EuGeroConfig.createEmptyState();
['classic', 'minimal'].forEach((templateId) => {
  Object.keys(previewColorVars).forEach((key) => delete previewColorVars[key]);
  EuGeroPreview.updatePreview(
    previewColorContainer,
    colorState,
    templateId,
    EuGeroConfig.getActiveSections(colorState.enabledSections)
  );
  const accent = EuGeroConfig.TEMPLATES[templateId].thumbAccent;
  const sharedPalette = EuGeroConfig.accentPalette(accent);
  const pdfPalette = EuGeroPdfExport.accentPalette(accent);
  assert(previewColorVars['--color-accent'] === accent,
    `Prévia usa thumbAccent do modelo ${templateId}`);
  assert(JSON.stringify(sharedPalette) === JSON.stringify(pdfPalette),
    `Prévia e PDF usam a mesma paleta do modelo ${templateId}`);
});

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

// --- Estado de teste ---
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

// --- JSON serialize/deserialize ---
console.log('\nExport/Import JSON:');

const stateToExport = {
  ...filledState,
  template: 'petroleo',
  experiences: [{ company: 'Tech Co', title: 'Dev', startDate: '2020', endDate: '2023', description: 'Implementei features.' }]
};

const serialized = EuGeroStorage.serialize(stateToExport);
assert(serialized.includes('"template": "petroleo"'), 'JSON contém template selecionado');
assert(serialized.includes('Tech Co'), 'JSON contém dados de experiência');

const deserialized = EuGeroStorage.deserialize(serialized);
assert(deserialized.valid === true, 'Import de JSON válido aceito');
assert(deserialized.data.template === 'petroleo', 'Template restaurado corretamente');
assert(deserialized.data.experiences[0].company === 'Tech Co', 'Experiências restauradas');

const invalidResult = EuGeroStorage.validateImportData({ foo: 'bar' });
assert(invalidResult.valid === false, 'JSON inválido rejeitado');

const corrupted = EuGeroStorage.validateImportData(null);
assert(corrupted.valid === false, 'Dados nulos rejeitados');

const nullListItemImport = EuGeroStorage.validateImportData({
  personal: {},
  experiences: [null]
});
assert(
  nullListItemImport.valid === false && nullListItemImport.error.includes('experiences[0]'),
  'Import rejeita item nulo com o caminho do dado inválido'
);

const invalidNestedFieldImport = EuGeroStorage.validateImportData({
  personal: {},
  experiences: [{ title: null }]
});
assert(
  invalidNestedFieldImport.valid === false && invalidNestedFieldImport.error.includes('experiences[0].title'),
  'Import valida recursivamente os campos dos itens'
);

const normalizedNullListItem = EuGeroStorage.mergeWithDefaults({
  personal: {},
  experiences: [null]
});
assert(
  normalizedNullListItem.experiences[0]
    && typeof normalizedNullListItem.experiences[0] === 'object'
    && normalizedNullListItem.experiences[0].title === '',
  'Merge defensivo normaliza item nulo antes da validação do currículo'
);

let normalizedNullListValidation = null;
try {
  normalizedNullListValidation = EuGeroValidation.validateSection(
    normalizedNullListItem,
    EuGeroConfig.SECTIONS.find((section) => section.id === 'experiences')
  );
} catch (_) {
  normalizedNullListValidation = null;
}
assert(
  normalizedNullListValidation?.valid === false && normalizedNullListValidation.issues.length > 0,
  'Validação relata o item normalizado sem lançar exceção'
);

// --- Rascunho local e entrada na revisão ---
console.log('\nRascunho local e revisão:');

const previousLocalStorage = global.localStorage;
const draftValues = new Map();
global.localStorage = {
  getItem(key) { return draftValues.has(key) ? draftValues.get(key) : null; },
  setItem(key, value) { draftValues.set(key, String(value)); },
  removeItem(key) { draftValues.delete(key); }
};

const resumableDraft = {
  ...EuGeroConfig.createEmptyState(),
  personal: {
    ...EuGeroConfig.createEmptyState().personal,
    fullName: 'Ana Retomada'
  }
};

assert(EuGeroStorage.hasDraft() === false, 'Sem conteúdo salvo não há rascunho para retomar');
draftValues.set(EuGeroConfig.STORAGE_KEY, JSON.stringify(resumableDraft));
assert(EuGeroStorage.hasDraft() === true, 'Rascunho local com conteúdo pode ser retomado');
const unknownPersonalDraft = {
  ...EuGeroConfig.createEmptyState(),
  personal: { ignored: 'não faz parte do currículo' }
};
draftValues.set(EuGeroConfig.STORAGE_KEY, JSON.stringify(unknownPersonalDraft));
assert(EuGeroStorage.hasDraft() === false, 'Campo pessoal desconhecido não torna o rascunho retomável');
assert(EuGeroStorage.clear() === true, 'Limpar rascunho confirma a remoção local');
assert(EuGeroStorage.hasDraft() === false, 'Rascunho removido deixa de estar disponível');

const emptyReviewState = EuGeroConfig.createEmptyState();
assert(EuGeroRouter.canGoToReview(emptyReviewState) === false, 'Revisão bloqueia currículo vazio');
assert(EuGeroRouter.canGoToReview(resumableDraft) === false, 'Revisão bloqueia rascunho incompleto com conteúdo');
assert(EuGeroRouter.canGoToReview(unknownPersonalDraft) === false, 'Revisão ignora campo pessoal desconhecido');

const completeReviewState = {
  ...EuGeroConfig.createEmptyState(),
  enabledSections: ['personal'],
  personal: {
    ...EuGeroConfig.createEmptyState().personal,
    fullName: 'Ana Completa',
    headline: 'Analista de Dados',
    email: 'ana.completa@exemplo.com.br',
    location: 'São Paulo, SP'
  }
};
assert(EuGeroRouter.canGoToReview(completeReviewState) === true, 'Revisão aceita todas as seções ativas válidas');

const missingSummaryState = {
  ...completeReviewState,
  enabledSections: ['personal', 'summary'],
  summary: ''
};
const missingSummaryGate = typeof EuGeroValidation.validateResume === 'function'
  ? EuGeroValidation.validateResume(
    missingSummaryState,
    EuGeroConfig.getActiveSections(missingSummaryState.enabledSections)
  )
  : { valid: true, issues: [] };
assert(
  missingSummaryGate.valid === false && missingSummaryGate.issues[0]?.sectionId === 'summary',
  'Gate global identifica a primeira seção ativa inválida'
);

const listSectionFixtures = {
  experiences: { label: 'Experiência', item: { title: 'Analista' }, metadata: { period: '2024' }, hiddenContent: { description: 'Atuação em análise de dados.' } },
  education: { label: 'Formação', item: { degree: 'Administração' }, metadata: { period: '2024' } },
  skills: { label: 'Habilidades', item: { name: 'Excel' } },
  languages: { label: 'Idiomas', item: { language: 'Inglês' }, metadata: { level: 'Fluente' } },
  certifications: { label: 'Certificações', item: { name: 'Curso de Excel' }, metadata: { issuer: 'Escola X' } },
  projects: { label: 'Projetos', item: { name: 'Projeto de dados' }, metadata: { url: 'https://exemplo.com' } }
};
Object.entries(listSectionFixtures).forEach(([sectionId, { label, item, metadata, hiddenContent }]) => {
  const unknownListDraft = {
    ...EuGeroConfig.createEmptyState(),
    personal: {},
    [sectionId]: [{ ignored: 'não faz parte do currículo' }]
  };
  draftValues.set(EuGeroConfig.STORAGE_KEY, JSON.stringify(unknownListDraft));
  assert(EuGeroStorage.hasDraft() === false, `${label} com campo desconhecido não torna o rascunho retomável`);
  assert(EuGeroRouter.canGoToReview(unknownListDraft) === false, `${label} com campo desconhecido não libera a revisão`);

  if (metadata) {
    const metadataOnlyDraft = {
      ...EuGeroConfig.createEmptyState(),
      personal: {},
      [sectionId]: [metadata]
    };
    draftValues.set(EuGeroConfig.STORAGE_KEY, JSON.stringify(metadataOnlyDraft));
    assert(EuGeroStorage.hasDraft() === false, `${label} com metadado isolado não torna o rascunho retomável`);
    assert(EuGeroRouter.canGoToReview(metadataOnlyDraft) === false, `${label} com metadado isolado não libera a revisão`);
  }

  if (hiddenContent) {
    const hiddenContentDraft = {
      ...EuGeroConfig.createEmptyState(),
      personal: {},
      [sectionId]: [hiddenContent]
    };
    draftValues.set(EuGeroConfig.STORAGE_KEY, JSON.stringify(hiddenContentDraft));
    assert(EuGeroStorage.hasDraft() === false, `${label} com descrição isolada não torna o rascunho retomável`);
    assert(EuGeroRouter.canGoToReview(hiddenContentDraft) === false, `${label} com descrição isolada não libera a revisão`);
  }

  const knownListDraft = {
    ...EuGeroConfig.createEmptyState(),
    personal: {},
    [sectionId]: [item]
  };
  draftValues.set(EuGeroConfig.STORAGE_KEY, JSON.stringify(knownListDraft));
  assert(EuGeroStorage.hasDraft() === true, `${label} com campo conhecido torna o rascunho retomável`);
  assert(EuGeroRouter.canGoToReview(knownListDraft) === false, `${label} isolada não libera um currículo incompleto`);
});

console.log('\nAutosave, backup e exclusão local:');

assert(typeof EuGeroStorage.loadDraft === 'function', 'Storage expõe carregamento de rascunho ou null');
assert(typeof EuGeroStorage.exportState === 'function', 'Storage expõe backup JSON como Blob');
assert(typeof EuGeroStorage.clearLocalData === 'function', 'Storage expõe limpeza completa dos dados locais');

draftValues.set(EuGeroConfig.STORAGE_KEY, JSON.stringify({
  ...resumableDraft,
  schemaVersion: 0
}));
const loadedDraft = typeof EuGeroStorage.loadDraft === 'function' ? EuGeroStorage.loadDraft() : null;
assert(loadedDraft?.personal.fullName === 'Ana Retomada' && loadedDraft.schemaVersion === EuGeroStorage.SCHEMA_VERSION,
  'Rascunho local é carregado com migração de schema');

const exportedState = typeof EuGeroStorage.exportState === 'function' ? EuGeroStorage.exportState(resumableDraft) : null;
assert(exportedState instanceof Blob && exportedState.type === 'application/json',
  'Backup local é exportado como Blob JSON');

const quotaStorage = global.localStorage;
const previousStorageWarning = console.warn;
global.localStorage = {
  getItem: quotaStorage.getItem.bind(quotaStorage),
  setItem() { throw new Error('QuotaExceededError'); },
  removeItem: quotaStorage.removeItem.bind(quotaStorage)
};
console.warn = () => {};
assert(EuGeroStorage.save(resumableDraft) === false, 'Quota simulada faz o autosave informar falha');
console.warn = previousStorageWarning;
global.localStorage = quotaStorage;

assert(typeof EuGeroStorage.clearLocalData === 'function' && EuGeroStorage.clearLocalData() === true,
  'Limpeza local confirma a remoção do rascunho');
assert(draftValues.has(EuGeroConfig.STORAGE_KEY) === false, 'Limpeza local remove todos os dados persistidos do currículo');

if (previousLocalStorage === undefined) delete global.localStorage;
else global.localStorage = previousLocalStorage;

// --- Template switch (data preservation) ---
console.log('\nTroca de template:');

const beforeSwitch = EuGeroStorage.mergeWithDefaults({ ...stateToExport, template: 'classic' });
const afterSwitch = { ...beforeSwitch, template: 'petroleo' };
assert(beforeSwitch.personal.fullName === afterSwitch.personal.fullName, 'Troca de template preserva dados pessoais');
assert(beforeSwitch.experiences.length === afterSwitch.experiences.length, 'Troca de template preserva listas');
assert(beforeSwitch.template === 'classic' && afterSwitch.template === 'petroleo', 'Template alterado sem perder dados');

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
assert(enabled.length === 2, 'Dados pessoais é a única seção sempre incluída');
assert(EuGeroConfig.isSectionMandatory('personal'), 'Dados pessoais é obrigatório');
assert(!EuGeroConfig.isSectionMandatory('summary'), 'Resumo é opcional');
assert(!EuGeroConfig.isSectionMandatory('skills'), 'Habilidades é opcional');
assert(!EuGeroConfig.isSectionMandatory('projects'), 'Projetos é opcional');

const normalized = EuGeroConfig.normalizeEnabledSections(['experiences']);
assert(normalized.includes('personal'), 'Sempre inclui seção obrigatória');
assert(normalized[0] === 'personal', 'Dados pessoais permanece na primeira posição');
assert(EuGeroConfig.getActiveSections(['experiences', 'personal', 'education']).map((s) => s.id).join(',') === 'personal,experiences,education', 'Ordem das seções ativas é preservada');
assert(EuGeroConfig.moveEnabledSection(['personal', 'experiences', 'education'], 'education', 'experiences', false).join(',') === 'personal,education,experiences', 'Reordenação altera a ordem das seções ativas');
const orderedPreview = EuGeroPreview.render(filledState, 'classic', EuGeroConfig.getActiveSections(['personal', 'education', 'experiences', 'summary']));
assert(orderedPreview.indexOf('Formação') < orderedPreview.indexOf('Experiência') && orderedPreview.indexOf('Experiência') < orderedPreview.indexOf('Resumo'), 'Prévia respeita a ordem escolhida para as seções');

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

const detailedState = { ...filledState, summary: 'A'.repeat(4600), pageMode: 'detailed' };
const detailedFit = EuGeroScoring.scorePageFit(detailedState, EuGeroConfig.SECTIONS);
assert(detailedFit.level === 'detailed', 'Modo detalhado aceita conteúdo para duas páginas');
const aggDetailed = EuGeroScoring.aggregateScore(
  EuGeroScoring.scoreState(filledState, lightSections, EuGeroConfig.ACTION_VERBS),
  detailedFit
);
assert(aggDetailed.overall > 45, 'Modo detalhado não aplica teto de uma página');
assert(EuGeroConfig.createEmptyState().pageMode === 'compact', 'Novo currículo começa no modo compacto');

// --- Validacao ---
console.log('\nValidacao de campos:');

assert(!EuGeroValidation.validateEmail('invalido').ok, 'E-mail invalido rejeitado');
assert(EuGeroValidation.validateEmail('a@b.co').ok, 'E-mail valido aceito');
assert(!EuGeroValidation.validateUrl('ftp://x').ok, 'URL com protocolo não permitido é rejeitada');
assert(EuGeroValidation.validateUrl('https://linkedin.com/in/x').ok, 'URL HTTPS válida é aceita');
const urlWithoutScheme = EuGeroValidation.validateUrl('linkedin.com/in/x');
assert(
  urlWithoutScheme.ok && urlWithoutScheme.value === 'https://linkedin.com/in/x',
  'Validação aceita URL sem esquema e devolve o valor HTTPS normalizado'
);

// --- Validação de listas no wizard ---
console.log('\nValidação acessível de listas no wizard:');

function createWizardDom() {
  const escapeText = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  class TestElement {
    constructor(tagName, ownerDocument) {
      this.tagName = tagName.toUpperCase();
      this.ownerDocument = ownerDocument;
      this.children = [];
      this.parentElement = null;
      this.dataset = {};
      this.style = {};
      this.attributes = {};
      this.listeners = {};
      this._className = '';
      this._innerHTML = '';
      this._textContent = '';
      this.classList = {
        add: (...names) => { this.className = `${this.className} ${names.join(' ')}`.trim(); },
        remove: (...names) => {
          this.className = this.className.split(/\s+/).filter((name) => name && !names.includes(name)).join(' ');
        },
        toggle: (name, force) => {
          const has = this.classList.contains(name);
          const next = force == null ? !has : force;
          if (next && !has) this.classList.add(name);
          if (!next && has) this.classList.remove(name);
          return next;
        },
        contains: (name) => this.className.split(/\s+/).includes(name)
      };
    }

    get className() { return this._className; }
    set className(value) { this._className = String(value || '').trim().replace(/\s+/g, ' '); }
    get textContent() { return this._textContent; }
    set textContent(value) { this._textContent = value == null ? '' : String(value); this._innerHTML = ''; }
    get innerHTML() { return this._innerHTML || (this.children.length ? '' : escapeText(this._textContent)); }
    set innerHTML(value) { this._innerHTML = String(value || ''); this._textContent = ''; this.children = []; }

    appendChild(child) {
      child.parentElement = this;
      this.children.push(child);
      return child;
    }

    prepend(child) {
      child.parentElement = this;
      this.children.unshift(child);
      return child;
    }

    remove() {
      if (!this.parentElement) return;
      const siblings = this.parentElement.children;
      siblings.splice(siblings.indexOf(this), 1);
      this.parentElement = null;
    }

    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null; }
    removeAttribute(name) { delete this.attributes[name]; }
    addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
    click() {
      const event = { preventDefault() {} };
      (this.listeners.click || []).forEach((listener) => listener(event));
      this.onclick?.(event);
    }
    dispatch(type, event = {}) {
      (this.listeners[type] || []).forEach((listener) => listener({ target: this, ...event }));
    }
    focus() { this.ownerDocument.activeElement = this; }
    scrollIntoView() { this.scrolledIntoView = true; }
    closest(selector) {
      let current = this;
      while (current) {
        if (matchesSelector(current, selector)) return current;
        current = current.parentElement;
      }
      return null;
    }
    querySelector(selector) { return findElements(this, selector)[0] || null; }
    querySelectorAll(selector) { return findElements(this, selector); }
  }

  function matchesSelector(element, selector) {
    if (selector === 'input, textarea, select') return ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);
    if (selector.startsWith('#')) return element.id === selector.slice(1);
    const attribute = selector.match(/^\.([\w-]+)\[data-section-id="([\w-]+)"\]$/);
    if (attribute) return element.classList.contains(attribute[1]) && element.dataset.sectionId === attribute[2];
    if (selector.startsWith('.')) return selector.slice(1).split('.').every((name) => element.classList.contains(name));
    if (selector === 'a') return element.tagName === 'A';
    if (selector === '[role="alert"]') return element.getAttribute('role') === 'alert';
    return false;
  }

  function findElements(root, selector) {
    const parts = selector.split(/\s+/);
    const descendants = [];
    const walk = (node) => node.children.forEach((child) => { descendants.push(child); walk(child); });
    walk(root);
    if (parts.length === 1) return descendants.filter((element) => matchesSelector(element, parts[0]));
    return descendants.filter((element) => {
      if (!matchesSelector(element, parts.at(-1))) return false;
      let parent = element.parentElement;
      for (let index = parts.length - 2; index >= 0; index--) {
        while (parent && !matchesSelector(parent, parts[index])) parent = parent.parentElement;
        if (!parent) return false;
        parent = parent.parentElement;
      }
      return true;
    });
  }

  const listeners = {};
  const document = {
    activeElement: null,
    createElement(tagName) { return new TestElement(tagName, document); },
    getElementById(id) { return document.body.querySelector(`#${id}`); },
    querySelector(selector) { return document.body.querySelector(selector); },
    querySelectorAll(selector) { return document.body.querySelectorAll(selector); },
    addEventListener(type, listener) { (listeners[type] ||= []).push(listener); },
    dispatchEvent(type) { (listeners[type] || []).forEach((listener) => listener()); },
    body: null
  };
  document.body = new TestElement('body', document);
  return { document, TestElement };
}

const previousDocumentForWizard = global.document;
const previousCssForWizard = global.CSS;
const wizardDom = createWizardDom();
global.document = wizardDom.document;
global.CSS = { escape: (value) => value };
['wizard-step-title', 'wizard-step-counter', 'wizard-step-desc', 'btn-prev', 'btn-next'].forEach((id) => {
  const element = wizardDom.document.createElement('div');
  element.id = id;
  wizardDom.document.body.appendChild(element);
});
const wizardSteps = wizardDom.document.createElement('div');
wizardSteps.id = 'wizard-steps';
wizardDom.document.body.appendChild(wizardSteps);
const wizardTimeline = wizardDom.document.createElement('nav');
wizardTimeline.id = 'wizard-timeline';
wizardDom.document.body.appendChild(wizardTimeline);

loadScript('js/screens/wizard.js');
const wizardState = {
  ...EuGeroConfig.createEmptyState(),
  currentStep: 1,
  enabledSections: ['personal', 'experiences'],
  experiences: [
    {
      title: '',
      company: 'Empresa válida',
      period: '2024',
      description: 'Atuei em projetos relevantes para a operação e para as pessoas atendidas.'
    },
    {
      title: 'Analista de dados',
      company: 'Outra empresa válida',
      period: '2023',
      description: 'Organizei relatórios e acompanhei indicadores para apoiar decisões da equipe.'
    }
  ]
};
const wizardSections = EuGeroConfig.getActiveSections(wizardState.enabledSections);
EuGeroWizardScreen.init({
  els: { wizardSteps, wizardTimeline },
  getState: () => wizardState,
  activeSections: () => wizardSections,
  goToStep() {},
  saveState() {},
  showToast() {},
  debouncedUpdatePreviews() {},
  escapeHtml: EuGeroUtils.escapeHtml,
  escapeAttr: EuGeroUtils.escapeAttr
});
EuGeroWizardScreen.renderWizardStep();
assert(wizardSteps.querySelectorAll('.btn-ai-section').length === 0,
  'Wizard não oferece acionador de IA');
wizardSteps.querySelectorAll('.list-tab')[1].click();
const experienceValidation = EuGeroWizardScreen.validateWizardStep('experiences');
const firstInvalidInput = wizardDom.document.getElementById('field-experiences-0-title');
const summaryLink = wizardSteps.querySelector('.validation-summary-list a');

assert(experienceValidation.valid === false && experienceValidation.errors[0].itemId === 'experiences-0',
  'validateWizardStep(stepId) valida o estado atual e identifica a primeira experiência');
assert(wizardSteps.querySelector('.list-tab.active')?.textContent === '1',
  'Validação troca para a aba da primeira experiência inválida');
assert(wizardDom.document.activeElement === firstInvalidInput && firstInvalidInput.scrolledIntoView === true,
  'Validação move o foco para o primeiro campo inválido');
assert(firstInvalidInput.getAttribute('aria-invalid') === 'true'
  && firstInvalidInput.getAttribute('aria-describedby') === 'error-field-experiences-0-title',
  'Campo inválido expõe aria-invalid e aria-describedby');
assert(summaryLink?.href === '#field-experiences-0-title' && summaryLink.textContent.includes('Cargo ou função'),
  'Resumo acessível contém link para o campo inválido');
summaryLink.click();
assert(wizardDom.document.activeElement === wizardDom.document.getElementById('field-experiences-0-title'),
  'Link do resumo mantém o foco no campo associado');
assert(wizardSteps.querySelectorAll('[role="alert"]').length === 1
  && wizardSteps.querySelector('.field-error')?.getAttribute('role') === null,
  'Resumo é o único canal role=alert e o erro de campo fica associado por aria-describedby');

const urlWizardState = {
  ...completeReviewState,
  currentStep: 0,
  personal: { ...completeReviewState.personal, linkedinUrl: '' }
};
EuGeroWizardScreen.init({
  els: { wizardSteps, wizardTimeline },
  getState: () => urlWizardState,
  activeSections: () => EuGeroConfig.getActiveSections(urlWizardState.enabledSections),
  goToStep() {},
  saveState() {},
  showToast() {},
  debouncedUpdatePreviews() {},
  escapeHtml: EuGeroUtils.escapeHtml,
  escapeAttr: EuGeroUtils.escapeAttr
});
EuGeroWizardScreen.renderWizardStep();
const linkedinInput = wizardDom.document.getElementById('field-personal-linkedinUrl');
linkedinInput.value = 'linkedin.com/in/ana-completa';
linkedinInput.dispatch('input');
linkedinInput.dispatch('blur');
assert(
  linkedinInput.value === 'https://linkedin.com/in/ana-completa'
    && urlWizardState.personal.linkedinUrl === 'https://linkedin.com/in/ana-completa',
  'Campo de URL normaliza o valor na sessão atual ao perder o foco'
);

global.document = previousDocumentForWizard;
global.CSS = previousCssForWizard;

// --- Autosave e retomada de rascunho ---
console.log('\nAutosave e retomada de rascunho:');

const previousAppDocument = global.document;
const previousAppWindow = global.window;
const previousAppLocation = global.location;
const previousAppHistory = global.history;
const previousAppStorage = global.localStorage;
const previousAppTimeout = global.setTimeout;
const previousAppClearTimeout = global.clearTimeout;
const previousAppAnimationFrame = global.requestAnimationFrame;
const previousFileReader = global.FileReader;
const previousStartScreen = global.EuGeroStartScreen;
const previousWizardScreen = global.EuGeroWizardScreen;
const previousReviewScreen = global.EuGeroReviewScreen;
const previousLinkedInGuide = global.EuGeroLinkedInGuide;

const appDom = createWizardDom();
const appTimers = new Map();
let appTimerId = 0;
const appStorageValues = new Map();
const appWindowListeners = {};
global.document = appDom.document;
global.window = {
  addEventListener(type, listener) { (appWindowListeners[type] ||= []).push(listener); },
  scrollTo() {}
};
global.location = { hash: '', pathname: '/', search: '' };
global.history = { replaceState(_state, _title, url) { global.location.hash = url.slice(url.indexOf('#')); } };
global.localStorage = {
  getItem(key) { return appStorageValues.has(key) ? appStorageValues.get(key) : null; },
  setItem(key, value) { appStorageValues.set(key, String(value)); },
  removeItem(key) { appStorageValues.delete(key); }
};
global.setTimeout = (callback) => {
  const id = ++appTimerId;
  appTimers.set(id, callback);
  return id;
};
global.clearTimeout = (id) => appTimers.delete(id);
global.requestAnimationFrame = () => 0;
global.FileReader = class TestFileReader {
  readAsText(file) {
    this.result = file.content;
    this.onload();
  }
};
global.EuGeroStartScreen = {
  init() {}, renderCharacterGrid() {}, renderTemplatePickers() {}, renderSectionChecklist() {},
  updateTemplatePreviewMinis() {}
};
global.EuGeroWizardScreen = {
  init() {},
  renderWizardStep() {},
  validateCurrentStep() { return true; },
  revealValidationError() {}
};
global.EuGeroReviewScreen = { init() {}, syncGalleryToTemplate() {}, renderReview() {}, renderReviewGallery() {} };
global.EuGeroLinkedInGuide = { renderGuide() {} };

['screen-characters', 'screen-start', 'screen-wizard', 'screen-review', 'screen-guide',
  'saved-indicator', 'toast', 'toast-message', 'toast-action', 'file-import'].forEach((id) => {
  const element = appDom.document.createElement('div');
  element.id = id;
  appDom.document.body.appendChild(element);
});
appDom.document.getElementById('toast-action').hidden = true;

loadScript('js/app.js');
appDom.document.dispatchEvent('DOMContentLoaded');

const app = global.window.EuGeroApp;
const savedIndicator = appDom.document.getElementById('saved-indicator');
const toastAction = appDom.document.getElementById('toast-action');
const originalAppSave = EuGeroStorage.save;
app.saveState();
const savedIndicatorTimer = appTimerId;
EuGeroStorage.save = () => false;
assert(app.saveState() === false, 'Falha de autosave retorna false pela interface pública');
assert(savedIndicator.hidden === true && !savedIndicator.classList.contains('visible') && !appTimers.has(savedIndicatorTimer),
  'Falha de autosave oculta imediatamente o indicador e cancela seu timer');
assert(toastAction.hidden === false && toastAction.textContent === 'Baixar backup',
  'Falha de autosave oferece backup acionável');
EuGeroStorage.save = originalAppSave;

const resumableAppDraft = {
  ...EuGeroConfig.createEmptyState(),
  personal: { ...EuGeroConfig.createEmptyState().personal, fullName: 'Rascunho Retomado' }
};
appStorageValues.set(EuGeroConfig.STORAGE_KEY, JSON.stringify(resumableAppDraft));
assert(typeof app.resumeDraft === 'function', 'Aplicação expõe a retomada do rascunho para a tela inicial');
const resumed = typeof app.resumeDraft === 'function' && app.resumeDraft();
assert(resumed === true && app.getState().personal.fullName === 'Rascunho Retomado'
  && app.getCurrentView() === 'wizard', 'Retomada restaura o estado local e abre o wizard');

const incompleteReview = app.goToReview();
assert(
  incompleteReview === false && app.getCurrentView() === 'wizard'
    && app.getState().currentStep === 0,
  'Ação de revisão usa o gate completo e abre a primeira seção inválida'
);

app.setState(completeReviewState);
assert(app.goToReview() === true && app.getCurrentView() === 'review', 'Ação de revisão aceita currículo completo');

app.setState(resumableAppDraft);
global.location.hash = '#/review';
(appWindowListeners.hashchange || []).forEach((listener) => listener());
assert(
  app.getCurrentView() === 'wizard' && app.getState().currentStep === 0,
  'Deep link de revisão bloqueia currículo incompleto e abre a primeira seção inválida'
);

const localDraftBeforeImport = {
  ...completeReviewState,
  personal: { ...completeReviewState.personal, fullName: 'Rascunho local preservado' }
};
appStorageValues.set(EuGeroConfig.STORAGE_KEY, JSON.stringify(localDraftBeforeImport));
const partialImport = {
  ...EuGeroConfig.createEmptyState(),
  enabledSections: ['personal', 'summary'],
  summary: 'Rascunho importado parcialmente, pronto para continuar sem recarregar a página.'
};
const fileImport = appDom.document.getElementById('file-import');
fileImport.files = [{ name: 'rascunho-parcial.json', content: JSON.stringify(partialImport) }];
fileImport.dispatch('change');
const storedBeforeContinue = JSON.parse(appStorageValues.get(EuGeroConfig.STORAGE_KEY));
assert(
  app.getCurrentView() === 'characters'
    && app.getState().summary === partialImport.summary
    && toastAction.hidden === false
    && toastAction.textContent === 'Continuar rascunho',
  'Import parcial mostra imediatamente a ação de continuar o estado em memória'
);
assert(
  storedBeforeContinue.personal.fullName === 'Rascunho local preservado',
  'Import parcial não sobrescreve o rascunho local antes da confirmação'
);
toastAction.click();
assert(
  app.getCurrentView() === 'wizard'
    && JSON.parse(appStorageValues.get(EuGeroConfig.STORAGE_KEY)).summary === partialImport.summary,
  'Ação de continuar abre e salva o rascunho importado sem recarregar'
);

global.document = previousAppDocument;
global.window = previousAppWindow;
global.location = previousAppLocation;
global.history = previousAppHistory;
if (previousAppStorage === undefined) delete global.localStorage;
else global.localStorage = previousAppStorage;
global.setTimeout = previousAppTimeout;
global.clearTimeout = previousAppClearTimeout;
global.requestAnimationFrame = previousAppAnimationFrame;
if (previousFileReader === undefined) delete global.FileReader;
else global.FileReader = previousFileReader;
global.EuGeroStartScreen = previousStartScreen;
global.EuGeroWizardScreen = previousWizardScreen;
global.EuGeroReviewScreen = previousReviewScreen;
global.EuGeroLinkedInGuide = previousLinkedInGuide;

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
assert(EuGeroConfig.getTemplateMeta('petroleo').atsFriendly === false, 'Petróleo avisa sobre ATS');

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

assert(
  [...EuGeroConfig.TEMPLATE_IDS].sort().join(',') === 'classic,creative,marinho,minimal,petroleo',
  'Catalogo mantém cinco famílias estruturais'
);
assert(EuGeroConfig.createEmptyState().template === 'classic', 'Clássico é o modelo padrão');
assert(
  EuGeroConfig.TEMPLATE_IDS.every((id) => {
    const t = EuGeroConfig.TEMPLATES[id];
    return t.id === id && t.name && t.description && typeof t.atsFriendly === 'boolean'
      && ['centered', 'left', 'banner', 'sidebar', 'creative'].includes(t.layout);
  }),
  'Todo template tem id, name, description, layout valido e flag atsFriendly booleana'
);
assert(
  new Set(EuGeroConfig.TEMPLATE_IDS.map((id) => EuGeroConfig.TEMPLATES[id].layout)).size === 5,
  'Cada família usa uma estrutura visual diferente'
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

const uiSources = ['index.html', 'js/config.js', 'js/characters.js', 'js/linkedin-guide.js'];
const withDash = uiSources.filter((p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8').match(/—|–/));
assert(withDash.length === 0, `Nenhum travessao em textos de UI${withDash.length ? ' (falha: ' + withDash.join(', ') + ')' : ''}`);

// --- Exportacao apenas PDF: sem residuos de Word/DOCX no projeto ---
console.log('\nExportacao (somente PDF):');

const noWordRefs = ['js/app.js', 'index.html'].filter((p) => {
  const code = fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
  return /(?:^|["'/])export\.js|libs\.js|cv-data\.js|exportDocx|EuGeroExport|EuGeroLibs|EuGeroCvData/.test(code);
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

const reviewScreenCode = fs.readFileSync(path.join(__dirname, '..', 'js/screens/review.js'), 'utf8');
const printCvUsesExportMode = /EuGeroPreview\.render\(\s*state\s*,\s*state\.template\s*,\s*ctx\.activeSections\(\)\s*,\s*['"]export['"]\s*\)/.test(reviewScreenCode);
assert(printCvUsesExportMode, 'printCv() chama EuGeroPreview.render com modo "export"');

// --- P0.4: tipografia unificada entre previa e PDF, sem fator de conversão ---
console.log('\nTipografia unificada (previa = PDF):');

const cssDir = path.join(__dirname, '..', 'css');
const cssCode = fs.readdirSync(cssDir)
  .filter((f) => f.endsWith('.css'))
  .map((f) => fs.readFileSync(path.join(cssDir, f), 'utf8'))
  .join('\n');
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
['petroleo'].forEach((id) => {
  assert(EuGeroConfig.TEMPLATES[id].atsNote === sidebarNote, `Nota de ATS revisada para modelo com barra lateral (${id})`);
});
const creativeNote = 'Este modelo usa um elemento gráfico no topo. Alguns sistemas podem ignorar ou reorganizar essa parte do conteúdo.';
['creative'].forEach((id) => {
  assert(EuGeroConfig.TEMPLATES[id].atsNote === creativeNote, `Nota de ATS revisada para modelo com selo gráfico (${id})`);
});

console.log('\nEscopo sem IA (index.html):');

const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(htmlContent.includes('Leitura por ATS'), 'HTML tem o rotulo "Leitura por ATS" na previa do start');
assert(htmlContent.includes('currículo de uma ou duas páginas'), 'Meta description informa o limite de até duas páginas');
assert(htmlContent.includes('Crie um currículo de uma ou duas páginas'), 'Open Graph informa o limite de até duas páginas');
assert(htmlContent.includes('Currículo de uma ou duas páginas'), 'Twitter informa o limite de até duas páginas');
assert(!htmlContent.includes('modal-prompt') && !htmlContent.includes('btn-mobile-prompt'), 'HTML não oferece acionadores de IA');
assert(!htmlContent.includes('js/prompts.js') && !htmlContent.includes('js/screens/prompt-modal.js'), 'HTML não carrega módulos de IA');
assert(htmlContent.includes('Algumas plataformas usam sistemas ATS para ler e organizar currículos'), 'Paragrafo do modal trocar modelo atualizado');

assert(!fs.existsSync(path.join(__dirname, '..', 'js/prompts.js')), 'Módulo de prompts removido');
assert(!fs.existsSync(path.join(__dirname, '..', 'js/screens/prompt-modal.js')), 'Modal de prompts removido');

console.log('\nTextos ATS (js/app.js):');

const appJsContent = fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8');
const screensDir = path.join(__dirname, '..', 'js/screens');
const appModulesContent = appJsContent + fs.readdirSync(screensDir)
  .map((f) => fs.readFileSync(path.join(screensDir, f), 'utf8'))
  .join('\n');
assert(appModulesContent.includes('Estrutura favorável a ATS'), 'Selo "Estrutura favoravel a ATS" presente em app.js/screens');
assert(appModulesContent.includes('Pode dificultar a leitura por ATS'), 'Selo "Pode dificultar a leitura por ATS" presente em app.js/screens');
assert(!appModulesContent.includes('Favorável a ATS'), 'Selo antigo "Favorável a ATS" removido de app.js/screens');
assert(!appModulesContent.includes('EuGeroPrompt') && !appModulesContent.includes('showPrompt'), 'Aplicação não mantém bindings de IA');
assert(!appModulesContent.includes('Pode exigir atenção no ATS'), 'Texto antigo de selo removido de app.js/screens');
assert(appModulesContent.includes('texto do PDF pode ser selecionado e copiado'), 'Checklist pede confirmar texto selecionável no PDF');
assert(appModulesContent.includes('window.print()'), 'Exportação usa a impressão nativa do navegador');
assert(appModulesContent.includes('Esta verificação considera apenas a estrutura e a organização do currículo'), 'Texto de apoio do painel Leitura por ATS presente em app.js/screens');
assert(appModulesContent.includes('Estrutura favorável') && appModulesContent.includes('Revise a estrutura'), 'Status do painel Leitura por ATS presentes em app.js/screens');
assert(appModulesContent.includes('Antes de enviar'), 'Rotulo da checklist "Antes de enviar" presente em app.js/screens');
assert(appModulesContent.includes('Confirme se o texto do PDF pode ser selecionado e copiado.'), 'Checklist inclui item sobre texto selecionavel no PDF');
assert(appModulesContent.includes('Dica: leia os requisitos da vaga e confira se as habilidades'), 'Dica de habilidades x requisitos da vaga presente abaixo das sugestoes');

// --- Content-Security-Policy ---
console.log('\nContent-Security-Policy:');

assert(/<meta\s+http-equiv="Content-Security-Policy"/.test(htmlContent), 'index.html declara meta CSP');
assert(htmlContent.includes("default-src 'self'"), 'CSP restringe default-src a self');
assert(htmlContent.includes("script-src 'self'"), 'CSP restringe script-src a self (sem inline nem eval)');
assert(htmlContent.includes("object-src 'none'"), 'CSP bloqueia object/embed/plugin');

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

// --- Sanitizacao de URL (rascunho .json vem de arquivo de terceiro) ---
assert(
  EuGeroUtils.safeUrl('https://linkedin.com/in/fulano') === 'https://linkedin.com/in/fulano',
  'safeUrl preserva https'
);
assert(
  EuGeroUtils.safeUrl('linkedin.com/in/fulano') === 'https://linkedin.com/in/fulano',
  'safeUrl assume https quando falta o esquema'
);
assert(
  EuGeroUtils.safeUrl('javascript:alert(1)') === '',
  'safeUrl bloqueia javascript:'
);
assert(
  EuGeroUtils.safeUrl('JaVaScRiPt:alert(1)') === '',
  'safeUrl bloqueia javascript: em qualquer caixa'
);
assert(
  EuGeroUtils.safeUrl('data:text/html,<script>alert(1)</script>') === '',
  'safeUrl bloqueia data:'
);
assert(
  EuGeroUtils.safeUrl('vbscript:msgbox(1)') === '',
  'safeUrl bloqueia vbscript:'
);
assert(EuGeroUtils.safeUrl('') === '' && EuGeroUtils.safeUrl(null) === '', 'safeUrl trata vazio e nulo');

const importedUnsafeUrl = EuGeroStorage.mergeWithDefaults({
  personal: { linkedinUrl: 'javascript:alert(1)' }
});
assert(
  importedUnsafeUrl.personal.linkedinUrl === '',
  'Import normaliza URL executável antes de mantê-la no estado'
);
const serializedUnsafeUrl = JSON.parse(EuGeroStorage.serialize({
  ...EuGeroConfig.createEmptyState(),
  personal: { ...EuGeroConfig.createEmptyState().personal, linkedinUrl: 'data:text/html,alert(1)' }
}));
assert(
  serializedUnsafeUrl.personal.linkedinUrl === '',
  'Backup JSON não preserva URL executável'
);
const storageBeforeUrlTest = global.localStorage;
let storedUnsafeUrl = '';
global.localStorage = {
  setItem(_key, value) { storedUnsafeUrl = value; }
};
assert(
  EuGeroStorage.save({
    ...EuGeroConfig.createEmptyState(),
    personal: { ...EuGeroConfig.createEmptyState().personal, linkedinUrl: 'vbscript:msgbox(1)' }
  }) === true && JSON.parse(storedUnsafeUrl).personal.linkedinUrl === '',
  'Autosave não persiste URL executável'
);
if (storageBeforeUrlTest === undefined) delete global.localStorage;
else global.localStorage = storageBeforeUrlTest;

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

// --- Impressão nativa fiel à prévia ---
console.log('\nExportação de PDF:');

const reviewJsCode = fs.readFileSync(path.join(__dirname, '..', 'js/screens/review.js'), 'utf8');
const printCss = fs.readFileSync(path.join(__dirname, '..', 'css/print-preview.css'), 'utf8');
const skillsSuggestTitleRule = printCss.match(/\.skills-suggest-title\s*\{[^}]*\}/);
// Decisao revista em 2026-07-26 (ver .docs/specs/feat-pdf-direto-como-unico-caminho.md):
// o botao passa a baixar um PDF gerado por jsPDF em vez de abrir o dialogo de
// impressao. O dialogo aplicava margem e escala proprias de cada navegador, e
// era ali que nascia a segunda pagina em branco no Safari.
assert(reviewJsCode.includes('function downloadPdf'), 'review.js define downloadPdf');
assert(appJsCode.includes('EuGeroReviewScreen.downloadPdf'), 'Botão de exportação chama downloadPdf');
assert(reviewJsCode.includes('EuGeroPdfExport.generatePdf('), 'downloadPdf usa o gerador jsPDF');
assert(reviewJsCode.includes('function printCv'), 'printCv continua disponível para Ctrl+P');
assert(
  skillsSuggestTitleRule && /color:\s*var\(--color-text-muted\)/.test(skillsSuggestTitleRule[0]),
  'Título "Sugestões para adicionar" usa token de texto auxiliar com contraste AA'
);
// A altura da caixa de impressao nao pode ser fixada em milimetros: era o
// min-height 297mm herdado de templates.css que gerava a pagina em branco.
assert(printCss.includes('min-height: 0 !important'), 'Caixa de impressão não impõe altura de folha');
assert(printCss.includes('#print-cv') && printCss.includes('box-sizing: border-box'), 'Área impressa usa caixa A4 com padding interno');
// base.css define "body { min-height: 100vh }". Na impressao o Safari resolve
// vh pela altura da janela, nao pela altura da folha: numa janela alta o body
// ficava maior que a area imprimivel e saia uma segunda pagina em branco, com o
// curriculo inteiro cabendo na primeira.
const blocoImpressao = printCss.slice(printCss.indexOf('@media print'), printCss.indexOf('/* ---- Moldura A4'));
assert(/html,\s*body\s*\{[^}]*min-height:\s*0\s*!important/.test(blocoImpressao),
    'Impressão zera a altura mínima do body (100vh não vale na folha)');

// --- Carregamento sob demanda (CA09) ---
console.log('\nCarregamento sob demanda:');

assert(!reviewJsCode.includes("loadScriptOnce('js/vendor/jspdf.umd.min.js')") || reviewJsCode.includes('function loadPdfVendor'),
    'Scripts do jsPDF sao carregados dentro de loadPdfVendor, nao no topo do modulo');
const indexHtmlCode = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(!indexHtmlCode.includes('jspdf.umd.min.js') && !indexHtmlCode.includes('pdf-export.js'),
    'index.html nao carrega os scripts de PDF por tag <script> direta (carregamento sob demanda)');

// --- CSP sem estilo inline ---
console.log('\nCSP:');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const csp = (indexHtml.match(/style-src([^;"]*)/) || [])[1] || '';
assert(csp.trim() === "'self'", "style-src e 'self', sem 'unsafe-inline'");
assert(!/\sstyle="/.test(indexHtml), 'index.html sem atributo style inline');
// A CSP barra o atributo style tambem quando ele chega por innerHTML, e o modo
// de falha e silencioso: o elemento aparece sem o estilo e so o console avisa.
for (const arquivo of ['js/linkedin-guide.js', 'js/screens/start.js', 'js/screens/wizard.js', 'js/screens/review.js']) {
    const codigo = fs.readFileSync(path.join(__dirname, '..', arquivo), 'utf8');
    assert(!/\sstyle="/.test(codigo), `${arquivo} nao monta atributo style`);
}
const screensCss = fs.readFileSync(path.join(__dirname, '..', 'css/screens.css'), 'utf8');
assert(screensCss.includes('--thumb-accent'), 'a cor da miniatura vem de propriedade personalizada');
// A ordem importa: fora dela, regras de componente vencem as novas e as telas
// de revisao e guia perdem o estilo.
assert(indexHtml.indexOf('css/screens.css') > indexHtml.indexOf('css/print-preview.css'),
    'screens.css entra depois de print-preview.css');
assert(indexHtml.indexOf('css/screens.css') < indexHtml.indexOf('css/responsive.css'),
    'screens.css entra antes de responsive.css');

// --- Notificações discretas ---
console.log('\nNotificações discretas:');

const startScreenCode = fs.readFileSync(path.join(__dirname, '..', 'js/screens/start.js'), 'utf8');
const responsiveCss = fs.readFileSync(path.join(__dirname, '..', 'css/responsive.css'), 'utf8');
assert(!startScreenCode.includes('Página em branco pronta'), 'Escolher ponto de partida não abre toast');
assert(!appJsCode.includes('Modelo alterado para'), 'Trocar modelo não abre toast');
assert(responsiveCss.includes('bottom: max(5.25rem'), 'Toast mobile fica acima da barra fixa');

// --- Limite real de páginas no PDF ---
console.log('\nPDF - limite real de páginas:');

global.jspdf = require(path.join(__dirname, '..', 'js/vendor/jspdf.umd.min.js'));

const unsafePdfState = {
  ...EuGeroConfig.createEmptyState(),
  personal: {
    ...EuGeroConfig.createEmptyState().personal,
    fullName: 'Maria da Silva',
    headline: 'Analista de Dados',
    linkedinUrl: ''
  }
};
['javascript:alert(1)', 'data:text/html,alert(1)', 'vbscript:msgbox(1)'].forEach((unsafeUrl) => {
  const unsafePdf = EuGeroPdfExport.generatePdf(
    { ...unsafePdfState, personal: { ...unsafePdfState.personal, linkedinUrl: unsafeUrl } },
    EuGeroConfig.getActiveSections(unsafePdfState.enabledSections),
    'classic'
  );
  const unsafePdfBytes = Buffer.from(unsafePdf.output('arraybuffer')).toString('latin1');
  assert(!unsafePdfBytes.includes('/URI'), `PDF real não escreve anotação para ${unsafeUrl.split(':')[0]}:`);
});

const sidebarUnsafePdfState = {
  ...unsafePdfState,
  template: 'petroleo',
  personal: { ...unsafePdfState.personal, linkedinUrl: '' }
};
['javascript:alert(1)', 'data:text/html,alert(1)', 'vbscript:msgbox(1)'].forEach((unsafeUrl) => {
  const sidebarUnsafePdf = EuGeroPdfExport.generatePdf(
    { ...sidebarUnsafePdfState, personal: { ...sidebarUnsafePdfState.personal, linkedinUrl: unsafeUrl } },
    EuGeroConfig.getActiveSections(sidebarUnsafePdfState.enabledSections),
    'petroleo'
  );
  const sidebarUnsafePdfBytes = Buffer.from(sidebarUnsafePdf.output('arraybuffer')).toString('latin1');
  assert(!sidebarUnsafePdfBytes.includes('/URI'), `Sidebar não escreve anotação para ${unsafeUrl.split(':')[0]}:`);
});

const schemelessPdf = EuGeroPdfExport.generatePdf(
  { ...unsafePdfState, personal: { ...unsafePdfState.personal, linkedinUrl: 'linkedin.com/in/maria-da-silva' } },
  EuGeroConfig.getActiveSections(unsafePdfState.enabledSections),
  'classic'
);
const schemelessPdfBytes = Buffer.from(schemelessPdf.output('arraybuffer')).toString('latin1');
assert(
  schemelessPdfBytes.includes('/URI') && schemelessPdfBytes.includes('https://linkedin.com/in/maria-da-silva'),
  'PDF real normaliza anotação de URL sem esquema para HTTPS'
);

const httpsPdfState = {
  ...unsafePdfState,
  personal: { ...unsafePdfState.personal, linkedinUrl: 'https://linkedin.com/in/maria-da-silva' }
};
const httpsPdf = EuGeroPdfExport.generatePdf(
  httpsPdfState,
  EuGeroConfig.getActiveSections(httpsPdfState.enabledSections),
  'classic'
);
const httpsPdfBytes = Buffer.from(httpsPdf.output('arraybuffer')).toString('latin1');
assert(httpsPdfBytes.includes('/URI'), 'PDF real preserva anotação para URL HTTPS válida');

const resumeLimitBase = {
  ...EuGeroConfig.createEmptyState(),
  personal: {
    fullName: 'Maria da Silva',
    headline: 'Analista de Dados',
    email: 'maria@exemplo.com.br',
    phone: '(11) 99999-0000',
    location: 'São Paulo, SP',
    linkedinUrl: ''
  },
  summary: 'Analista de dados com experiência em produtos digitais e melhoria de processos.',
  experiences: [{
    title: 'Analista de Dados',
    company: 'Empresa Exemplo',
    startDate: '2021-01',
    endDate: '',
    endCurrent: true,
    description: 'Analisei dados de produto, construí relatórios e apoiei decisões com indicadores claros.'
  }],
  education: [{
    degree: 'Bacharelado em Sistemas de Informação',
    institution: 'Universidade Exemplo',
    startDate: '2017-01',
    endDate: '2020-12'
  }],
  skillsText: 'SQL; Python; Excel; Power BI',
  languages: [{ language: 'Inglês', level: 'Intermediário' }]
};

function measureResumeExport(state) {
  if (typeof EuGeroPdfExport.measureExport !== 'function') {
    return { pages: 0, issues: ['Medição do PDF indisponível.'] };
  }
  return EuGeroPdfExport.measureExport(state);
}

function pageLimitFor(state) {
  return typeof EuGeroPdfExport.getPageLimit === 'function'
    ? EuGeroPdfExport.getPageLimit(state)
    : 0;
}

const minimalResume = {
  ...EuGeroConfig.createEmptyState(),
  personal: { ...resumeLimitBase.personal }
};
const minimalExport = measureResumeExport(minimalResume);
assert(pageLimitFor(minimalResume) === 1, 'Conteúdo mínimo usa limite de uma página por padrão');
assert(minimalExport.pages === 1 && minimalExport.issues.length === 0, 'Conteúdo mínimo gera uma página sem bloqueio');

const typicalExport = measureResumeExport(resumeLimitBase);
assert(typicalExport.pages === 1 && typicalExport.issues.length === 0, 'Conteúdo típico gera uma página sem bloqueio');

const secondPageResume = {
  ...resumeLimitBase,
  pageMode: 'detailed',
  summary: 'Analisei dados de produto e melhorei processos com resultados mensuráveis. '.repeat(42)
};
const secondPageExport = measureResumeExport(secondPageResume);
assert(pageLimitFor(secondPageResume) === 2, 'Modo detalhado permite duas páginas');
assert(secondPageExport.pages === 2 && secondPageExport.issues.length === 0, 'Segundo page break é permitido no modo detalhado');

const overflowResume = {
  ...resumeLimitBase,
  pageMode: 'detailed',
  summary: 'Analisei dados de produto e melhorei processos com resultados mensuráveis. '.repeat(140)
};
const overflowExport = measureResumeExport(overflowResume);
assert(overflowExport.pages > 2 && overflowExport.issues.length > 0, 'PDF acima de duas páginas é identificado para bloqueio');

function createPreviewContainer(scrollHeight) {
  const parentClasses = new Set(['preview-a4-wrap']);
  const body = {
    overflow: null,
    classList: { toggle(_name, force) { body.overflow = force; } }
  };
  return {
    parentElement: {
      classList: {
        contains: (name) => parentClasses.has(name),
        toggle(name, force) {
          if (force) parentClasses.add(name);
          else parentClasses.delete(name);
        }
      }
    },
    style: {},
    scrollHeight,
    innerHTML: '',
    className: '',
    querySelector() { return body; },
    body
  };
}

const compactPreview = createPreviewContainer(1200);
EuGeroPreview.updatePreview(compactPreview, resumeLimitBase, 'classic');
assert(compactPreview.body.overflow === true && compactPreview.innerHTML.includes('Limite de 1'),
  'Prévia compacta sinaliza conteúdo acima de uma página');

const detailedPreview = createPreviewContainer(1200);
EuGeroPreview.updatePreview(detailedPreview, secondPageResume, 'classic');
assert(detailedPreview.body.overflow === false && detailedPreview.innerHTML.includes('Limite de 2'),
  'Prévia detalhada permite conteúdo até a segunda página');
assert(detailedPreview.parentElement.classList.contains('preview-a4-wrap-two-pages'),
  'Prévia detalhada expande a moldura para exibir a segunda página');

// --- PDF: fidelidade visual (fake doc para testar desenho sem jsPDF real) ---
console.log('\nPDF - fake doc:');

function createFakeDoc() {
  const calls = [];
  const record = (method) => (...args) => { calls.push({ method, args }); };
  const doc = {
    setFont: record('setFont'),
    setFontSize: record('setFontSize'),
    setTextColor: record('setTextColor'),
    setDrawColor: record('setDrawColor'),
    setFillColor: record('setFillColor'),
    setCharSpace: record('setCharSpace'),
    text: record('text'),
    textWithLink: record('textWithLink'),
    line: record('line'),
    rect: record('rect'),
    addPage: record('addPage'),
    splitTextToSize: (text) => [text],
    getTextWidth: (text) => String(text).length * 2
  };
  return { doc, calls };
}

{
  const { doc, calls } = createFakeDoc();
  doc.text('ola', 10, 10);
  doc.setDrawColor(1, 2, 3);
  assert(calls.length === 2, 'createFakeDoc registra chamadas na ordem');
  assert(calls[0].method === 'text' && calls[0].args[0] === 'ola', 'createFakeDoc registra metodo e argumentos de text()');
  assert(calls[1].method === 'setDrawColor' && calls[1].args.join(',') === '1,2,3', 'createFakeDoc registra setDrawColor com os argumentos certos');
}

{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 178 };
  EuGeroPdfExport.drawSectionHeading(doc, cursor, 'Experiência', 16, 178, palette, { fontPt: 10.5 }, false);
  const linha = calls.find((c) => c.method === 'line');
  assert(!!linha, 'drawSectionHeading desenha uma linha divisoria abaixo do titulo');
  const corAntesDaLinha = calls.filter((c) => c.method === 'setDrawColor');
  assert(corAntesDaLinha.some((c) => c.args.join(',') === '224,224,227'), 'Linha divisoria usa a cor neutra 224,224,227');
}

{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 60 };
  EuGeroPdfExport.drawSectionHeading(doc, cursor, 'Habilidades', 16, 60, palette, { fontPt: 10.5 }, false, true);
  assert(!calls.some((c) => c.method === 'line'), 'drawSectionHeading nao desenha linha quando skipDivider e true (coluna da sidebar)');
}

{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 178 };
  const blocks = [{ type: 'item', title: 'Consultor Sênior', sub: 'Empresa X', period: '2020 - Atual', desc: '' }];
  EuGeroPdfExport.drawBlocks(doc, cursor, blocks, 16, 178, palette, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const corDoTitulo = calls.find((c) => c.method === 'setTextColor' && calls.indexOf(c) === calls.findIndex((x2) => x2.method === 'text' && x2.args[0] === 'Consultor Sênior') - 1);
  const idxTexto = calls.findIndex((c) => c.method === 'text' && c.args[0] === 'Consultor Sênior');
  const corAntes = [...calls].slice(0, idxTexto).reverse().find((c) => c.method === 'setTextColor');
  assert(!!corAntes, 'Existe uma cor definida antes do titulo do item');
  assert(corAntes.args.join(',') === palette.accent900.join(','), 'Titulo do item usa palette.accent900, nao a cor fixa anterior');
}

// --- Task 4: colisao entre titulo e periodo ---
console.log('\nPDF - colisao entre titulo e periodo:');

{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 60 };
  const tituloLongo = 'Especializacao em Ciencia da Computacao Aplicada';
  const blocks = [{ type: 'item', title: tituloLongo, sub: 'Universidade X', period: '2018 - 2022', desc: '' }];
  EuGeroPdfExport.drawBlocks(doc, cursor, blocks, 16, 60, palette, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const idxTitulo = calls.findIndex((c) => c.method === 'text' && c.args[0] === tituloLongo);
  const idxPeriodo = calls.findIndex((c) => c.method === 'text' && c.args[0] === '2018 - 2022');
  assert(idxPeriodo > -1, 'Periodo continua sendo desenhado mesmo com titulo longo');
  const mesmaLinha = calls[idxTitulo].args[2] === calls[idxPeriodo].args[2];
  assert(!mesmaLinha, 'Com titulo longo, periodo vai para a linha seguinte em vez de sobrepor o titulo');
}
{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 178 };
  const blocks = [{ type: 'item', title: 'Consultor', sub: 'Empresa X', period: '2020 - Atual', desc: '' }];
  EuGeroPdfExport.drawBlocks(doc, cursor, blocks, 16, 178, palette, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const idxTitulo = calls.findIndex((c) => c.method === 'text' && c.args[0] === 'Consultor');
  const idxPeriodo = calls.findIndex((c) => c.method === 'text' && c.args[0] === '2020 - Atual');
  assert(calls[idxTitulo].args[2] === calls[idxPeriodo].args[2], 'Com titulo curto, periodo continua na mesma linha do titulo');
}

// --- Task 5: letter-spacing (charSpace) em nome e titulos de secao ---
console.log('\nPDF - letter-spacing (charSpace):');

{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 178 };
  EuGeroPdfExport.drawSectionHeading(doc, cursor, 'Formação', 16, 178, palette, { fontPt: 10.5 }, false);
  const idxTexto = calls.findIndex((c) => c.method === 'text' && c.args[0] === 'FORMAÇÃO');
  const charSpaceAntes = [...calls].slice(0, idxTexto).reverse().find((c) => c.method === 'setCharSpace');
  assert(!!charSpaceAntes && charSpaceAntes.args[0] > 0, 'Titulo de secao recebe charSpace maior que zero antes de ser desenhado');
  const charSpaceDepois = calls.slice(idxTexto + 1).find((c) => c.method === 'setCharSpace');
  assert(!!charSpaceDepois && charSpaceDepois.args[0] === 0, 'charSpace e resetado para 0 depois do titulo de secao');
}

// --- Task 6: link do LinkedIn clicavel no cabecalho ---
console.log('\nPDF - link do LinkedIn clicavel no cabecalho:');

{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const state = {
    personal: { fullName: 'Maria Teste', headline: 'Analista', email: 'maria@teste.com', phone: '', location: 'São Paulo', linkedinUrl: 'https://linkedin.com/in/maria-teste' },
    enabledSections: {}
  };
  const data = EuGeroPdfExport.buildSectionsData(state, []);
  data.state = state;
  EuGeroPdfExport.LAYOUTS.left(doc, data, palette, 16, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const link = calls.find((c) => c.method === 'textWithLink');
  assert(!!link, 'Cabecalho desenha o LinkedIn com textWithLink quando linkedinUrl esta preenchido');
  assert(link.args[3] && link.args[3].url === 'https://linkedin.com/in/maria-teste', 'Link aponta para a URL correta do LinkedIn');
}

{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 290, margin: 16, colWidth: 178 };
  let onNewPageChamado = false;
  const onNewPage = () => { onNewPageChamado = true; };
  EuGeroPdfExport.drawSectionHeading(doc, cursor, 'Habilidades', 16, 178, palette, { fontPt: 10.5 }, false, undefined, onNewPage);
  assert(calls.some((c) => c.method === 'addPage'), 'drawSectionHeading quebra a pagina quando o cursor esta perto do fim');
  assert(onNewPageChamado, 'drawSectionHeading repassa onNewPage para ensureSpace e ele e chamado ao quebrar pagina');
}

// --- Task 7: fundo da sidebar redesenhado em varias paginas ---
console.log('\nPDF - fundo da sidebar em varias paginas:');

{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#155e75');
  const experienciasLongas = Array.from({ length: 20 }, (_, i) => ({
    title: `Cargo ${i}`, company: `Empresa ${i}`, period: '2020 - 2021',
    description: 'Descricao longa o suficiente para forcar quebra de pagina no layout de teste, repetida varias vezes para garantir overflow do conteudo principal da coluna direita.'
  }));
  const state = {
    personal: { fullName: 'Maria Teste', headline: 'Analista', email: 'maria@teste.com', phone: '', location: 'São Paulo' },
    experiences: experienciasLongas,
    enabledSections: { experiences: true }
  };
  const sections = [{ id: 'experiences', title: 'Experiência', list: true, itemFields: [{ key: 'title' }, { key: 'company' }, { key: 'description' }] }];
  const data = EuGeroPdfExport.buildSectionsData(state, sections);
  data.state = state;
  EuGeroPdfExport.LAYOUTS.sidebar(doc, data, palette, 16, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const paginas = calls.filter((c) => c.method === 'addPage').length;
  assert(paginas > 0, 'Conteudo longo forca pelo menos uma nova pagina neste cenario de teste');
  const fundos = calls.filter((c) => c.method === 'rect' && c.args[2] < 100 && c.args[3] > 290);
  assert(fundos.length === paginas + 1, 'O fundo da sidebar e redesenhado uma vez por pagina (inicial + cada addPage)');
}

// --- Task 9b: sobreposicao do link do LinkedIn na sidebar ---
console.log('\nPDF - LinkedIn na sidebar nao sobrepoe a linha da localizacao:');

{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#155e75');
  const state = {
    personal: { fullName: 'Hua Mulan Teste', headline: 'Analista', email: 'hua@teste.com', phone: '11 99999-9999', location: 'Vale do Rio Amarelo, China', linkedinUrl: 'https://linkedin.com/in/hua-mulan-teste' },
    enabledSections: {}
  };
  const data = EuGeroPdfExport.buildSectionsData(state, []);
  data.state = state;
  EuGeroPdfExport.LAYOUTS.sidebar(doc, data, palette, 16, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const idxLocalizacao = calls.findIndex((c) => c.method === 'text' && c.args[0] === 'Vale do Rio Amarelo, China');
  const link = calls.find((c) => c.method === 'textWithLink' && c.args[3] && c.args[3].url === 'https://linkedin.com/in/hua-mulan-teste');
  assert(idxLocalizacao > -1, 'Linha da localizacao e desenhada na sidebar');
  assert(!!link, 'Link do LinkedIn e desenhado na sidebar com textWithLink');
  assert(link.args[2] > calls[idxLocalizacao].args[2], 'Link do LinkedIn fica estritamente abaixo (y maior) da linha da localizacao, sem sobrepor');
}

// --- Correcao 2: largura do titulo medida com a fonte do titulo, nao do periodo ---
console.log('\nPDF - largura do titulo medida antes de trocar a fonte:');

{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 178 };
  const blocks = [{ type: 'item', title: 'Cargo', sub: 'Empresa X', period: '2020 - Atual', desc: '' }];
  EuGeroPdfExport.drawBlocks(doc, cursor, blocks, 16, 178, palette, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const idxTitulo = calls.findIndex((c) => c.method === 'text' && c.args[0] === 'Cargo');
  const fontesAntesDoTitulo = calls.slice(0, idxTitulo + 1).filter((c) => c.method === 'setFontSize');
  const tamanhoFonteDoTitulo = fontesAntesDoTitulo[fontesAntesDoTitulo.length - 1].args[0];
  assert(tamanhoFonteDoTitulo === 12, 'A ultima fonte definida antes de desenhar o titulo e a do titulo (fontPt + 1.5), nao a do periodo');
}

// --- Correcao 3: drawContactLine centraliza a logica repetida das 4 familias ---
console.log('\nPDF - drawContactLine (helper compartilhado):');

{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const personal = { email: 'ana@teste.com', phone: '11 99999-0000', location: 'São Paulo', linkedinUrl: 'https://linkedin.com/in/ana-teste' };
  EuGeroPdfExport.drawContactLine(doc, personal, palette, 100, 30, { align: 'center' });
  const link = calls.find((c) => c.method === 'textWithLink');
  assert(!!link, 'drawContactLine desenha o LinkedIn com textWithLink quando preenchido');
  assert(link.args[3].url === personal.linkedinUrl, 'drawContactLine preserva a URL completa no href do link');
}

// --- Correcao 4: URL longa do LinkedIn e truncada apenas no texto exibido ---
console.log('\nPDF - truncamento do texto exibido do LinkedIn:');

{
  const urlLonga = 'https://www.linkedin.com/in/um-nome-de-usuario-bem-comprido-para-teste';
  const exibido = EuGeroPdfExport.truncateLinkedinDisplay(urlLonga);
  assert(exibido.length === 40, 'Texto exibido do LinkedIn e truncado para 40 caracteres (37 + "...")');
  assert(exibido.endsWith('...'), 'Texto truncado termina com reticencias');
  assert(urlLonga.startsWith(exibido.slice(0, 37)), 'Texto truncado preserva o inicio da URL original');

  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const personal = { email: 'ana@teste.com', linkedinUrl: urlLonga };
  EuGeroPdfExport.drawContactLine(doc, personal, palette, 16, 30, { align: 'left' });
  const link = calls.find((c) => c.method === 'textWithLink');
  assert(!!link, 'drawContactLine desenha o link mesmo com URL longa');
  assert(link.args[0] === exibido, 'Texto exibido no PDF e a versao truncada da URL');
  assert(link.args[3].url === urlLonga, 'href do link continua sendo a URL completa, sem truncar');
}

setTimeout(() => {
  pendingAsyncTests.then(() => {
    assert(debounceCalls === 1, 'debounce cancela chamadas anteriores e executa só a última');
    finishTests();
  }).catch((error) => {
    assert(false, `Teste assíncrono falhou: ${error.message}`);
    finishTests();
  });
}, 30);

function finishTests() {
  // --- Summary ---
  console.log(`\n=== Resultado: ${passed} passou, ${failed} falhou ===\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

// --- Versionamento do rascunho salvo (schemaVersion) ---
console.log('\nVersionamento do rascunho:');
assert(EuGeroStorage.SCHEMA_VERSION >= 1, 'storage expõe SCHEMA_VERSION');
const semVersao = EuGeroStorage.migrate({ personal: { fullName: 'Ana' } });
assert(semVersao.schemaVersion === EuGeroStorage.SCHEMA_VERSION, 'rascunho sem versão é migrado para a atual');
assert(semVersao.personal.fullName === 'Ana', 'migração preserva os dados existentes');
const jaAtual = EuGeroStorage.migrate({ schemaVersion: EuGeroStorage.SCHEMA_VERSION, summary: 'x' });
assert(jaAtual.summary === 'x', 'rascunho já na versão atual passa intacto');
assert(EuGeroStorage.migrate(null) === null, 'migração tolera entrada nula');

// --- Impressao: margem no @page e animacoes desligadas ---
console.log('\nRegras de impressão:');
// A animacao cvfade deixava a coluna de conteudo invisivel no PDF dos modelos
// com barra lateral: o curriculo saia sem a secao de experiencia.
assert(printCss.includes('animation: none !important'), 'impressão desliga animações');
assert(printCss.includes('transition: none !important'), 'impressão desliga transições');
// A margem do papel vem do padding interno do documento. Declarar no @page e
// zerar o padding fazia o Safari cortar o conteudo nas bordas.
assert(!printCss.includes('padding: 0 !important'), 'impressão preserva o padding interno do documento');
assert(!reviewJsCode.includes('applyPageMargin'), 'printCv não injeta regra @page dinâmica');

// --- Download bloqueado acima do limite real ---
console.log('\nPDF - bloqueio do download:');

const previousReviewDocument = global.document;
const reviewDownloadDom = createWizardDom();
reviewDownloadDom.document.head = {
  appendChild(script) { script.onload?.(); }
};
global.document = reviewDownloadDom.document;
const reviewDownloadButton = reviewDownloadDom.document.createElement('button');
reviewDownloadButton.id = 'btn-export-pdf';
reviewDownloadButton.textContent = 'Baixar currículo em PDF';
reviewDownloadDom.document.body.appendChild(reviewDownloadButton);
const reviewToastMessages = [];

loadScript('js/screens/review.js');

// --- Regressão: Ctrl+P preserva a paleta do modelo selecionado ---
console.log('\nImpressão nativa com paleta do modelo:');

const previousPrintSyncDocument = global.document;
const previousPrintSyncWindow = global.window;
const printSyncDom = createWizardDom();
const printCvElement = printSyncDom.document.createElement('div');
const printPaletteVars = {};
printCvElement.id = 'print-cv';
printCvElement.style.setProperty = (name, value) => { printPaletteVars[name] = value; };
printSyncDom.document.body.appendChild(printCvElement);
global.document = printSyncDom.document;
global.window = { print() {} };

const printPaletteState = {
  ...EuGeroConfig.createEmptyState(),
  template: 'petroleo'
};
EuGeroReviewScreen.init({
  getState: () => printPaletteState,
  activeSections: () => EuGeroConfig.getActiveSections(printPaletteState.enabledSections),
  showToast() {},
  goToWizard() {},
  escapeHtml: EuGeroUtils.escapeHtml,
  saveState() {},
  updateTemplateIndicators() {},
  debouncedUpdatePreviews() {},
  scaleReviewPreviews() {},
  els: {}
});
EuGeroReviewScreen.printCv();
assert(
  printPaletteVars['--color-accent'] === EuGeroConfig.TEMPLATES.petroleo.thumbAccent,
  'Ctrl+P aplica à área impressa a paleta compartilhada do modelo selecionado'
);

global.document = previousPrintSyncDocument;
if (previousPrintSyncWindow === undefined) delete global.window;
else global.window = previousPrintSyncWindow;

EuGeroReviewScreen.init({
  getState: () => overflowResume,
  activeSections: () => EuGeroConfig.getActiveSections(overflowResume.enabledSections),
  showToast(message) { reviewToastMessages.push(message); },
  goToWizard() {},
  escapeHtml: EuGeroUtils.escapeHtml,
  saveState() {},
  updateTemplateIndicators() {},
  debouncedUpdatePreviews() {},
  scaleReviewPreviews() {},
  els: {}
});

assert(
  EuGeroReviewScreen.cvFileBaseName({
    personal: { fullName: 'Ana Sobrescrita', headline: 'Engenheira de Dados' }
  }) === 'CV_Ana-Sobrescrita_Engenheira-de-Dados',
  'Download com estado explícito usa o nome do arquivo desse estado'
);

pendingAsyncTests = (async () => {
  try {
    const downloaded = await EuGeroReviewScreen.downloadPdf(overflowResume);
    assert(downloaded === false, 'Download retorna false quando o PDF ultrapassa duas páginas');
    assert(reviewToastMessages.some((message) => message.includes('ultrapassa o limite de 2')),
      'Download bloqueado informa como reduzir o conteúdo');

    const reviewMeasureStatus = {
      textContent: '',
      attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; }
    };
    const reviewMeasureActions = { hidden: true };
    const reviewMeasureContent = {
      innerHTML: '',
      querySelector(selector) {
        if (selector === '[data-pdf-page-measure]') return reviewMeasureStatus;
        if (selector === '[data-page-reduction-actions]') return reviewMeasureActions;
        return null;
      },
      querySelectorAll() { return []; }
    };
    EuGeroReviewScreen.init({
      getState: () => overflowResume,
      activeSections: () => EuGeroConfig.getActiveSections(overflowResume.enabledSections),
      showToast() {},
      goToWizard() {},
      escapeHtml: EuGeroUtils.escapeHtml,
      saveState() {},
      updateTemplateIndicators() {},
      debouncedUpdatePreviews() {},
      scaleReviewPreviews() {},
      els: { reviewContent: reviewMeasureContent }
    });
    EuGeroReviewScreen.renderReview();
    await Promise.resolve();
    await Promise.resolve();
    assert(
      reviewMeasureStatus.textContent.includes('ultrapassa o limite de 2') && reviewMeasureActions.hidden === false,
      'Revisão exibe a medição real e libera ações antes do download'
    );

    const originalMeasureExport = EuGeroPdfExport.measureExport;
    const originalTemplate = overflowResume.template;
    const measuredTemplates = [];
    try {
      overflowResume.template = 'classic';
      EuGeroPdfExport.measureExport = (measuredState) => {
        measuredTemplates.push(measuredState.template);
        return {
          pages: measuredState.template === 'minimal' ? 1 : 2,
          issues: []
        };
      };
      EuGeroReviewScreen.syncGalleryToTemplate();
      EuGeroReviewScreen.renderReview();
      await Promise.resolve();
      await Promise.resolve();
      EuGeroReviewScreen.galleryStep(1);
      await Promise.resolve();
      await Promise.resolve();
      assert(
        measuredTemplates.at(-1) === 'minimal'
          && reviewMeasureStatus.textContent === 'PDF confirmado com 1 página.',
        'Troca de modelo na galeria mede novamente o PDF e atualiza a mensagem visível'
      );
    } finally {
      EuGeroPdfExport.measureExport = originalMeasureExport;
      overflowResume.template = originalTemplate;
    }
  } finally {
    global.document = previousReviewDocument;
  }
})();
