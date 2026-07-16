/**
 * Modal de prompts IA: geração, aviso de privacidade e cópia.
 * Recebe o contexto compartilhado do app via init(ctx).
 */
const EuGeroPromptModal = (function () {
  'use strict';

  let ctx = null;
  let promptContext = { type: 'general', sectionId: null };

  function init(context) {
    ctx = context;
  }

  function show(type, sectionId, trigger) {
    promptContext = { type, sectionId: sectionId || null };
    refreshPromptText();
    updatePrivacyWarning();
    ctx.openModal(ctx.els.modalPrompt, trigger);
  }

  function refreshPromptText() {
    const state = ctx.getState();
    const els = ctx.els;
    const includeData = els.includeDataCheckbox?.checked ?? true;
    let prompt = '';
    if (promptContext.type === 'general') prompt = EuGeroPrompts.buildGeneralPrompt(state, includeData);
    else if (promptContext.type === 'section') prompt = EuGeroPrompts.buildSectionPrompt(promptContext.sectionId, state, includeData);
    else if (promptContext.type === 'translation') prompt = EuGeroPrompts.buildTranslationPrompt(state, includeData);
    if (els.promptText) els.promptText.value = prompt;
    updatePrivacyWarning();
  }

  function updatePrivacyWarning() {
    const els = ctx.els;
    const warning = els.privacyPromptWarning || document.getElementById('privacy-prompt-warning');
    if (!warning) return;
    const includeData = els.includeDataCheckbox?.checked ?? true;
    const hasData = EuGeroPrompts.containsPersonalData(els.promptText?.value || '');
    warning.hidden = !(includeData && hasData);
  }

  async function copyPrompt() {
    const ok = await copyToClipboard(ctx.els.promptText?.value || '');
    if (ok) ctx.showToast('Prompt copiado!');
    else ctx.showToast('Nao foi possivel copiar. Selecione o texto manualmente.', { error: true });
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      /* fallback below */
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  return {
    init,
    show,
    refreshPromptText,
    updatePrivacyWarning,
    copyPrompt,
    copyToClipboard
  };
})();
