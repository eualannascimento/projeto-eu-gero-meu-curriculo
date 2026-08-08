/**
 * Persistência localStorage + serialização JSON.
 */
const EuGeroStorage = (function () {
  const { STORAGE_KEY, createEmptyState, APP_VERSION } = EuGeroConfig;

  // Versao do formato do rascunho. Sem ela, uma mudanca futura de estrutura
  // corromperia silenciosamente o rascunho de quem ja usa a ferramenta.
  const SCHEMA_VERSION = 1;
  const LIST_KEYS = ['experiences', 'education', 'skills', 'languages', 'certifications',
    'projects', 'volunteering', 'publications', 'awards', 'organizations', 'courses'];

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function textOrEmpty(value) {
    return typeof value === 'string' ? value : '';
  }

  function normalizeUrls(state) {
    if (!isRecord(state)) return state;
    const personal = isRecord(state.personal) ? state.personal : {};
    return {
      ...state,
      personal: {
        ...personal,
        linkedinUrl: EuGeroUtils.safeUrl(personal.linkedinUrl)
      }
    };
  }

  /** Traz um rascunho de versao anterior para o formato atual. */
  function migrate(data) {
    if (!data || typeof data !== 'object') return data;
    const from = Number(data.schemaVersion) || 0;
    if (from >= SCHEMA_VERSION) return data;
    // v0 -> v1: nenhuma transformacao necessaria; o merge com os defaults
    // (mergeWithDefaults) ja preenche o que faltava.
    return { ...data, schemaVersion: SCHEMA_VERSION };
  }

  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...normalizeUrls(state), schemaVersion: SCHEMA_VERSION }));
      return true;
    } catch (e) {
      console.warn('Erro ao salvar no localStorage:', e);
      return false;
    }
  }

  function initialState() {
    // Visitante novo comeca vazio; o conteudo de exemplo vem da tela de personagens.
    return createEmptyState();
  }

  function hasContent(data) {
    if (!data || typeof data !== 'object') return false;

    const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
    const previewContentFields = {
      experiences: ['title', 'company'],
      education: ['degree', 'institution'],
      languages: ['language'],
      certifications: ['name'],
      projects: ['name']
    };

    const personalKeys = Object.keys(createEmptyState().personal);
    if (personalKeys.some((key) => hasText(data.personal?.[key]))) return true;

    if (hasText(data.summary) || hasText(data.skillsText)) return true;

    const hasLegacySkill = Array.isArray(data.skills) && data.skills.some((skill) => {
      if (typeof skill === 'string') return hasText(skill);
      return hasText(skill?.name);
    });
    if (hasLegacySkill) return true;

    return Object.entries(previewContentFields).some(([sectionId, fields]) => Array.isArray(data[sectionId])
      && data[sectionId].some((item) => item && typeof item === 'object'
        && fields.some((field) => hasText(item[field]))));
  }

  function load() {
    return loadDraft() || initialState();
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = migrate(JSON.parse(raw));
      return mergeWithDefaults(parsed);
    } catch (e) {
      console.warn('Erro ao carregar localStorage:', e);
      return null;
    }
  }

  function hasDraft() {
    return hasContent(loadDraft());
  }

  function mergeWithDefaults(data) {
    const defaults = createEmptyState();
    if (!isRecord(data)) return defaults;

    const merged = { ...defaults, ...data };
    const personal = isRecord(data.personal) ? data.personal : {};
    merged.personal = Object.fromEntries(Object.keys(defaults.personal).map((key) => [
      key,
      textOrEmpty(personal[key])
    ]));
    merged.personal.linkedinUrl = EuGeroUtils.safeUrl(merged.personal.linkedinUrl);

    LIST_KEYS.forEach((key) => {
      if (!Array.isArray(data[key])) {
        merged[key] = defaults[key];
        return;
      }
      if (key === 'skills') {
        merged.skills = data.skills.map((skill) => {
          if (typeof skill === 'string') return skill.trim();
          return isRecord(skill) ? { ...skill, name: textOrEmpty(skill.name) } : { name: '' };
        });
        return;
      }
      const section = EuGeroConfig.SECTIONS.find((candidate) => candidate.id === key);
      merged[key] = data[key].map((item) => {
        if (!section?.itemFields) return isRecord(item) ? { ...item } : {};
        if (!isRecord(item)) return EuGeroConfig.createEmptyListItem(key);
        const normalized = { ...item };
        section.itemFields.forEach((field) => {
          const value = textOrEmpty(item[field.key]);
          normalized[field.key] = field.type === 'url' ? EuGeroUtils.safeUrl(value) : value;
        });
        ['startDate', 'endDate'].forEach((field) => {
          if (Object.hasOwn(item, field)) normalized[field] = textOrEmpty(item[field]);
        });
        normalized.endCurrent = item.endCurrent === true;
        return normalized;
      });
    });

    merged.summary = textOrEmpty(data.summary);
    merged.skillsText = textOrEmpty(data.skillsText);
    merged.currentStep = Number.isInteger(data.currentStep) && data.currentStep >= 0 ? data.currentStep : 0;
    merged.margin = ['estreita', 'padrao', 'confortavel'].includes(data.margin) ? data.margin : defaults.margin;
    merged.density = ['normal', 'condensado'].includes(data.density) ? data.density : defaults.density;
    merged.pageMode = ['compact', 'detailed'].includes(data.pageMode) ? data.pageMode : defaults.pageMode;

    merged.template = EuGeroConfig.TEMPLATE_IDS.includes(merged.template) ? merged.template : 'classic';

    merged.enabledSections = EuGeroConfig.normalizeEnabledSections(merged.enabledSections);

    if (data.skillsText) {
      merged.skillsText = data.skillsText;
    } else if (merged.skills?.length && !merged.skillsText) {
      merged.skillsText = merged.skills.map((skill) => {
        if (typeof skill === 'string') return skill.trim();
        return typeof skill?.name === 'string' ? skill.name.trim() : '';
      }).filter(Boolean).join('; ');
    }

    return merged;
  }

  function validateImportData(data) {
    if (!isRecord(data)) {
      return { valid: false, error: 'Arquivo inválido: formato não reconhecido.' };
    }

    if (!isRecord(data.personal)) {
      return { valid: false, error: 'Arquivo inválido: faltam os dados pessoais.' };
    }

    if (data.version && typeof data.version !== 'string') {
      return { valid: false, error: 'Arquivo inválido: versão não compatível.' };
    }

    const invalidPath = (path) => ({
      valid: false,
      error: `Arquivo inválido: ${path} contém um valor não reconhecido.`
    });

    for (const key of Object.keys(createEmptyState().personal)) {
      if (Object.hasOwn(data.personal, key) && typeof data.personal[key] !== 'string') {
        return invalidPath(`personal.${key}`);
      }
    }

    for (const key of ['summary', 'skillsText', 'template', 'margin', 'density', 'pageMode']) {
      if (Object.hasOwn(data, key) && typeof data[key] !== 'string') return invalidPath(key);
    }

    if (Object.hasOwn(data, 'currentStep')
      && (!Number.isInteger(data.currentStep) || data.currentStep < 0)) {
      return invalidPath('currentStep');
    }

    if (Object.hasOwn(data, 'enabledSections')
      && (!Array.isArray(data.enabledSections)
        || data.enabledSections.some((sectionId) => typeof sectionId !== 'string'))) {
      return invalidPath('enabledSections');
    }

    for (const key of LIST_KEYS) {
      if (!Object.hasOwn(data, key)) continue;
      if (!Array.isArray(data[key])) return invalidPath(key);
      for (let index = 0; index < data[key].length; index++) {
        const item = data[key][index];
        if (key === 'skills' && typeof item === 'string') continue;
        if (!isRecord(item)) return invalidPath(`${key}[${index}]`);

        if (key === 'skills') {
          if (Object.hasOwn(item, 'name') && typeof item.name !== 'string') {
            return invalidPath(`${key}[${index}].name`);
          }
          continue;
        }

        const section = EuGeroConfig.SECTIONS.find((candidate) => candidate.id === key);
        for (const field of section?.itemFields || []) {
          if (Object.hasOwn(item, field.key) && typeof item[field.key] !== 'string') {
            return invalidPath(`${key}[${index}].${field.key}`);
          }
        }
        for (const field of ['startDate', 'endDate']) {
          if (Object.hasOwn(item, field) && typeof item[field] !== 'string') {
            return invalidPath(`${key}[${index}].${field}`);
          }
        }
        if (Object.hasOwn(item, 'endCurrent') && typeof item.endCurrent !== 'boolean') {
          return invalidPath(`${key}[${index}].endCurrent`);
        }
      }
    }

    return { valid: true, data: mergeWithDefaults(data) };
  }

  function serialize(state) {
    return JSON.stringify({
      ...normalizeUrls(state),
      version: APP_VERSION,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  function deserialize(jsonString) {
    const parsed = JSON.parse(jsonString);
    return validateImportData(parsed);
  }

  function downloadJson(state, filename) {
    const blob = exportState(state);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'curriculo-rascunho.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportState(state) {
    return new Blob([serialize(state)], { type: 'application/json' });
  }

  function clearLocalData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.warn('Erro ao remover o rascunho local:', e);
      return false;
    }
  }

  function clear() {
    return clearLocalData();
  }

  return {
    SCHEMA_VERSION,
    migrate,
    save,
    load,
    loadDraft,
    hasContent,
    hasDraft,
    mergeWithDefaults,
    validateImportData,
    serialize,
    deserialize,
    exportState,
    downloadJson,
    clearLocalData,
    clear
  };
})();
