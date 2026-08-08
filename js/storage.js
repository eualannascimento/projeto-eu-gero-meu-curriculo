/**
 * Persistência localStorage + serialização JSON.
 */
const EuGeroStorage = (function () {
  const { STORAGE_KEY, createEmptyState, APP_VERSION } = EuGeroConfig;

  // Versao do formato do rascunho. Sem ela, uma mudanca futura de estrutura
  // corromperia silenciosamente o rascunho de quem ja usa a ferramenta.
  const SCHEMA_VERSION = 1;

  function normalizeUrls(state) {
    if (!state || typeof state !== 'object') return state;
    return {
      ...state,
      personal: {
        ...(state.personal || {}),
        linkedinUrl: EuGeroUtils.safeUrl(state.personal?.linkedinUrl)
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
    if (!data || typeof data !== 'object') return defaults;

    const merged = { ...defaults, ...data };
    merged.personal = { ...defaults.personal, ...(data.personal || {}) };
    merged.personal.linkedinUrl = EuGeroUtils.safeUrl(merged.personal.linkedinUrl);

    const listKeys = ['experiences', 'education', 'skills', 'languages', 'certifications',
      'projects', 'volunteering', 'publications', 'awards', 'organizations', 'courses'];

    listKeys.forEach(key => {
      merged[key] = Array.isArray(data[key]) ? data[key] : defaults[key];
    });

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
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Arquivo inválido: formato não reconhecido.' };
    }

    if (!data.personal || typeof data.personal !== 'object') {
      return { valid: false, error: 'Arquivo inválido: faltam os dados pessoais.' };
    }

    if (data.version && typeof data.version !== 'string') {
      return { valid: false, error: 'Arquivo inválido: versão não compatível.' };
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
