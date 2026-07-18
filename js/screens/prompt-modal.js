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

  function showPrompt(type, sectionId, trigger) {
    promptContext = { type, sectionId: sectionId || null };
    refreshPromptText();
    updatePrivacyWarning();
    ctx.openModal(ctx.els.modalPrompt, trigger);
  }

  function refreshPromptText() {
    const state = ctx.getState();
    const includeData = ctx.els.includeDataCheckbox?.checked ?? true;
    const jobDescription = ctx.els.jobDescriptionTextarea?.value || '';
    let prompt = '';
    if (promptContext.type === 'general') prompt = EuGeroPrompts.buildGeneralPrompt(state, includeData, jobDescription);
    else if (promptContext.type === 'section') prompt = EuGeroPrompts.buildSectionPrompt(promptContext.sectionId, state, includeData, jobDescription);
    else if (promptContext.type === 'translation') prompt = EuGeroPrompts.buildTranslationPrompt(state, includeData);
    if (ctx.els.promptText) ctx.els.promptText.value = prompt;
    updatePrivacyWarning();
  }

  function updatePrivacyWarning() {
    const warning = ctx.els.privacyPromptWarning || document.getElementById('privacy-prompt-warning');
    if (!warning) return;
    const includeData = ctx.els.includeDataCheckbox?.checked ?? true;
    const hasData = EuGeroPrompts.containsPersonalData(ctx.els.promptText?.value || '');
    warning.hidden = !(includeData && hasData);
  }

  async function copyPrompt() {
    const ok = await copyToClipboard(ctx.els.promptText?.value || '');
    if (ok) ctx.showToast('Prompt copiado.');
    else ctx.showToast('Não foi possível copiar. Selecione o texto e copie manualmente.', { error: true });
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
    show: showPrompt,
    refreshPromptText,
    updatePrivacyWarning,
    copyPrompt,
    copyToClipboard
  };
})();
