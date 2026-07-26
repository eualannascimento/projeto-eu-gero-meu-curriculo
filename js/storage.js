/**
 * Persistência localStorage + serialização JSON.
 */
const EuGeroStorage = (function () {
  const { STORAGE_KEY, createEmptyState, APP_VERSION } = EuGeroConfig;

  // Versao do formato do rascunho. Sem ela, uma mudanca futura de estrutura
  // corromperia silenciosamente o rascunho de quem ja usa a ferramenta.
  const SCHEMA_VERSION = 1;

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, schemaVersion: SCHEMA_VERSION }));
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

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return initialState();
      const parsed = migrate(JSON.parse(raw));
      return mergeWithDefaults(parsed);
    } catch (e) {
      console.warn('Erro ao carregar localStorage:', e);
      return initialState();
    }
  }

  function mergeWithDefaults(data) {
    const defaults = createEmptyState();
    if (!data || typeof data !== 'object') return defaults;

    const merged = { ...defaults, ...data };
    merged.personal = { ...defaults.personal, ...(data.personal || {}) };

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
      merged.skillsText = merged.skills.map(s => s.name || s).filter(Boolean).join('; ');
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
      ...state,
      version: APP_VERSION,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  function deserialize(jsonString) {
    const parsed = JSON.parse(jsonString);
    return validateImportData(parsed);
  }

  function downloadJson(state, filename) {
    const blob = new Blob([serialize(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'curriculo-rascunho.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    SCHEMA_VERSION,
    migrate,
    save,
    load,
    mergeWithDefaults,
    validateImportData,
    serialize,
    deserialize,
    downloadJson,
    clear
  };
})();
