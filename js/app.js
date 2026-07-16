/**
 * Eu Gero Meu Curriculo - aplicacao principal.
 */
(function () {
  'use strict';

  const {
    TEMPLATES, getActiveSections, normalizeEnabledSections, TEMPLATE_IDS
  } = EuGeroConfig;

  let state = EuGeroStorage.load();
  let currentView = 'home';
  let suppressHash = false;
  let saveTimer = null;
  let toastTimer = null;

  const els = {};
  const A4_BASE_WIDTH = 370;
  const LIBS_WARN_KEY = 'eugero-libs-warned';

  // Contexto compartilhado com os módulos de tela (js/screens/*).
  // getState é função porque `state` é reatribuído (import, personagens, limpar).
  function buildScreenContext() {
    return {
      els,
      getState: () => state,
      replaceState: (next) => { state = next; },
      activeSections,
      saveState,
      showToast,
      showPrompt: (type, sectionId, trigger) => EuGeroPromptModal.show(type, sectionId, trigger),
      openModal,
      navigateTo,
      goToStart,
      goToStep,
      goToWizard,
      updateTemplateIndicators,
      switchTemplate,
      scaleReviewPreviews,
      debouncedUpdatePreviews: (...args) => debouncedUpdatePreviews(...args),
      escapeHtml,
      escapeAttr
    };
  }

  function initScreens() {
    const ctx = buildScreenContext();
    EuGeroStartScreen.init(ctx);
    EuGeroWizardScreen.init(ctx);
    EuGeroReviewScreen.init(ctx);
    EuGeroPromptModal.init(ctx);
  }

  function init() {
    cacheElements();
    ensureToastStructure();
    initScreens();
    bindGlobalEvents();

    const initialRoute = EuGeroRouter.getInitialRoute();
    if (initialRoute) {
      applyRouteState(initialRoute);
    } else {
      const hasProgress = state.personal?.fullName || state.currentStep > 0;
      currentView = hasProgress ? 'wizard' : 'home';
    }

    EuGeroRouter.subscribe((route) => {
      if (suppressHash) return;
      applyRouteState(route);
      render();
    });

    render();
    probeLibrariesOnce();
  }

  function cacheElements() {
    els.screenHome = document.getElementById('screen-home');
    els.screenCharacters = document.getElementById('screen-characters');
    els.screenStart = document.getElementById('screen-start');
    els.screenWizard = document.getElementById('screen-wizard');
    els.screenReview = document.getElementById('screen-review');
    els.screenGuide = document.getElementById('screen-guide');
    els.wizardSteps = document.getElementById('wizard-steps');
    els.wizardProgress = document.getElementById('wizard-progress');
    els.wizardTimeline = document.getElementById('wizard-timeline');
    els.sectionChecklist = document.getElementById('section-checklist');
    els.reviewContent = document.getElementById('review-content');
    els.reviewTemplateGallery = document.getElementById('review-template-gallery');
    els.guideContent = document.getElementById('guide-content');
    els.modalPrompt = document.getElementById('modal-prompt');
    els.promptText = document.getElementById('prompt-text');
    els.modalTemplate = document.getElementById('modal-template');
    els.modalMobileMenu = document.getElementById('modal-mobile-menu');
    els.fileImport = document.getElementById('file-import');
    els.toast = document.getElementById('toast');
    els.previewOverlay = document.getElementById('preview-overlay');
    els.includeDataCheckbox = document.getElementById('include-data-checkbox');
    els.privacyPromptWarning = document.getElementById('privacy-prompt-warning');
    els.savedIndicator = document.getElementById('saved-indicator');
    els.previewMobileDock = document.getElementById('preview-mobile-dock');
    els.toastMessage = document.getElementById('toast-message');
    els.toastAction = document.getElementById('toast-action');
    els.progressBar = document.getElementById('wizard-progress-bar');
    els.progressText = document.getElementById('wizard-progress-text');
  }

  function ensureToastStructure() {
    if (!els.toast) return;
    if (!els.toastMessage) {
      els.toastMessage = document.createElement('span');
      els.toastMessage.id = 'toast-message';
      els.toast.appendChild(els.toastMessage);
    }
    if (!els.toastAction) {
      els.toastAction = document.createElement('button');
      els.toastAction.type = 'button';
      els.toastAction.id = 'toast-action';
      els.toastAction.className = 'toast-action btn btn-ghost btn-sm';
      els.toastAction.hidden = true;
      els.toast.appendChild(els.toastAction);
    }
  }

  function activeSections() {
    return getActiveSections(state.enabledSections);
  }

  function resolveWizardSectionId(sectionId) {
    const sections = activeSections();
    if (sectionId) {
      const idx = sections.findIndex((s) => s.id === sectionId);
      if (idx >= 0) {
        state.currentStep = idx;
        return sectionId;
      }
    }
    return sections[state.currentStep]?.id || sections[0]?.id || null;
  }

  function applyRouteState(route) {
    currentView = route.view || 'home';
    if (currentView === 'wizard') {
      resolveWizardSectionId(route.sectionId);
    }
  }

  function navigateTo(view, sectionId, { replace = false } = {}) {
    currentView = view;
    let hashSectionId = null;
    if (view === 'wizard') {
      hashSectionId = resolveWizardSectionId(sectionId);
    }
    render();
    suppressHash = true;
    EuGeroRouter.setHash(view, hashSectionId, { replace });
    suppressHash = false;
    saveState();
  }

  function goToHome() {
    navigateTo('home');
  }

  function goToStart() {
    navigateTo('start');
  }

  function startWizard() {
    state.currentStep = 0;
    const sectionId = activeSections()[0]?.id || null;
    navigateTo('wizard', sectionId);
  }

  function goToWizard(step) {
    const sections = activeSections();
    if (typeof step === 'number') {
      state.currentStep = Math.min(Math.max(0, step), Math.max(0, sections.length - 1));
    }
    navigateTo('wizard', sections[state.currentStep]?.id || null);
  }

  function goToReview() {
    EuGeroReviewScreen.syncGalleryToTemplate();
    navigateTo('review');
  }

  function goToGuide() {
    navigateTo('guide');
  }

  async function probeLibrariesOnce() {
    if (typeof EuGeroLibs === 'undefined') return;
    try {
      const caps = await EuGeroLibs.probeAll();
      if (sessionStorage.getItem(LIBS_WARN_KEY)) return;
      const msgs = EuGeroLibs.missingMessages(caps);
      if (msgs.length) {
        showToast(msgs.join(' '), { duration: 7000 });
        sessionStorage.setItem(LIBS_WARN_KEY, '1');
      }
    } catch (e) {
      /* ignore probe errors */
    }
  }

  function bindGlobalEvents() {
    EuGeroStartScreen.renderTemplatePickers();

    document.getElementById('btn-enter-app')?.addEventListener('click', () => navigateTo('characters'));
    document.getElementById('btn-go-home')?.addEventListener('click', goToHome);
    document.getElementById('btn-import-home')?.addEventListener('click', () => els.fileImport?.click());

    document.getElementById('btn-start-wizard')?.addEventListener('click', startWizard);
    document.getElementById('btn-fill-sample')?.addEventListener('click', fillSampleData);
    document.getElementById('btn-clear-all')?.addEventListener('click', clearAll);
    document.getElementById('btn-change-template-wizard')?.addEventListener('click', (e) => openModal(els.modalTemplate, e.currentTarget));
    document.getElementById('btn-prev-template-start')?.addEventListener('click', () => cycleTemplate(-1));
    document.getElementById('btn-next-template-start')?.addEventListener('click', () => cycleTemplate(1));
    document.getElementById('btn-prev-template')?.addEventListener('click', () => cycleTemplate(-1));
    document.getElementById('btn-next-template')?.addEventListener('click', () => cycleTemplate(1));
    document.getElementById('btn-prev')?.addEventListener('click', prevStep);
    document.getElementById('btn-next')?.addEventListener('click', nextStep);
    document.getElementById('btn-finish')?.addEventListener('click', goToReview);
    document.getElementById('btn-back-wizard')?.addEventListener('click', () => goToWizard());
    document.getElementById('btn-gal-prev')?.addEventListener('click', () => EuGeroReviewScreen.galleryStep(-1));
    document.getElementById('btn-gal-next')?.addEventListener('click', () => EuGeroReviewScreen.galleryStep(1));
    document.getElementById('btn-export-pdf')?.addEventListener('click', EuGeroReviewScreen.printCv);
    document.getElementById('btn-export-docx')?.addEventListener('click', (e) => EuGeroReviewScreen.handleExport('docx', e.currentTarget));
    document.getElementById('btn-guide')?.addEventListener('click', goToGuide);
    document.getElementById('btn-back-review')?.addEventListener('click', goToReview);
    document.getElementById('btn-back-start')?.addEventListener('click', goToStart);

    const btnToggleCompact = document.getElementById('toggle-compact-mode');
    if (btnToggleCompact) {
      btnToggleCompact.addEventListener('change', (e) => {
        document.querySelectorAll('.preview-content').forEach(el => {
          el.classList.toggle('condensed-mode', e.target.checked);
        });
      });
    }

    document.getElementById('btn-export-json')?.addEventListener('click', exportJson);
    document.getElementById('btn-export-json-review')?.addEventListener('click', exportJson);
    document.getElementById('btn-import-json')?.addEventListener('click', () => els.fileImport?.click());
    document.getElementById('btn-import-json-review')?.addEventListener('click', () => els.fileImport?.click());
    document.getElementById('btn-import-start')?.addEventListener('click', () => els.fileImport?.click());
    els.fileImport?.addEventListener('change', handleImport);

    document.getElementById('btn-prompt-general')?.addEventListener('click', (e) => EuGeroPromptModal.show('general', null, e.currentTarget));
    document.getElementById('btn-prompt-general-review')?.addEventListener('click', (e) => EuGeroPromptModal.show('general', null, e.currentTarget));
    document.getElementById('btn-prompt-translation')?.addEventListener('click', (e) => EuGeroPromptModal.show('translation', null, e.currentTarget));
    document.getElementById('btn-prompt-translation-guide')?.addEventListener('click', (e) => EuGeroPromptModal.show('translation', null, e.currentTarget));
    document.getElementById('btn-copy-prompt')?.addEventListener('click', EuGeroPromptModal.copyPrompt);
    els.includeDataCheckbox?.addEventListener('change', () => {
      EuGeroPromptModal.refreshPromptText();
      EuGeroPromptModal.updatePrivacyWarning();
    });

    document.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
    });

    document.getElementById('modal-template')?.addEventListener('click', (e) => {
      const opt = e.target.closest('.modal-template-option');
      if (opt) {
        switchTemplate(opt.dataset.template);
        closeModal(els.modalTemplate);
      }
    });

    document.getElementById('btn-toggle-preview')?.addEventListener('click', (e) => openPreviewOverlay(e.currentTarget));
    document.getElementById('btn-toggle-preview-start')?.addEventListener('click', (e) => openPreviewOverlay(e.currentTarget));
    document.getElementById('btn-toggle-preview-review')?.addEventListener('click', (e) => openPreviewOverlay(e.currentTarget));
    document.getElementById('btn-expand-mobile-preview')?.addEventListener('click', (e) => openPreviewOverlay(e.currentTarget));
    document.getElementById('btn-close-preview')?.addEventListener('click', () => closePreviewOverlay());
    els.previewOverlay?.addEventListener('click', (e) => {
      if (e.target === els.previewOverlay) {
        closePreviewOverlay();
      }
    });

    document.getElementById('btn-wizard-menu')?.addEventListener('click', (e) => openModal(els.modalMobileMenu, e.currentTarget));
    document.getElementById('btn-mobile-change-template')?.addEventListener('click', (e) => {
      closeModal(els.modalMobileMenu);
      openModal(els.modalTemplate, e.currentTarget);
    });
    document.getElementById('btn-mobile-export-json')?.addEventListener('click', () => {
      closeModal(els.modalMobileMenu);
      exportJson();
    });
    document.getElementById('btn-mobile-import-json')?.addEventListener('click', () => {
      closeModal(els.modalMobileMenu);
      els.fileImport?.click();
    });
    document.getElementById('btn-mobile-prompt')?.addEventListener('click', (e) => {
      closeModal(els.modalMobileMenu);
      EuGeroPromptModal.show('general', null, e.currentTarget);
    });

    window.addEventListener('resize', debounce(scaleReviewPreviews, 150));

    document.querySelectorAll('.modal').forEach((modal) => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    });
  }

  function saveState() {
    state.enabledSections = normalizeEnabledSections(state.enabledSections);
    state.skills = EuGeroConfig.parseSkillsText(state.skillsText);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      EuGeroStorage.save(state);
      flashSavedIndicator();
    }, 400);
  }

  function flashSavedIndicator() {
    const el = els.savedIndicator || document.getElementById('saved-indicator');
    if (!el) return;
    el.textContent = 'Salvo';
    el.hidden = false;
    el.classList.add('visible');
    clearTimeout(flashSavedIndicator._timer);
    flashSavedIndicator._timer = setTimeout(() => {
      el.classList.remove('visible');
      el.hidden = true;
    }, 2000);
  }

  function fillSampleData() {
    const sample = EuGeroSampleData.build();
    state = EuGeroStorage.mergeWithDefaults({ ...state, ...sample });
    saveState();
    render();
    showToast('Exemplo carregado. Ajuste com seus dados reais.');
  }

  function clearAll() {
    const fresh = EuGeroConfig.createEmptyState();
    fresh.template = state.template;
    fresh.margin = state.margin;
    fresh.density = state.density;
    fresh.enabledSections = [...state.enabledSections];
    state = EuGeroStorage.mergeWithDefaults(fresh);
    saveState();
    render();
    showToast('Campos limpos. Comece do zero quando quiser.');
  }

  const PAGE_MARGINS = [
    { v: 'estreita', l: 'Estreita' },
    { v: 'padrao', l: 'Padrão' },
    { v: 'confortavel', l: 'Confortável' }
  ];
  const PAGE_DENSITIES = [
    { v: 'normal', l: 'Normal' },
    { v: 'condensado', l: 'Condensado' }
  ];

  function setPageOption(key, value) {
    state[key] = value;
    saveState();
    renderPageControls();
    debouncedUpdatePreviews();
  }

  function renderPageControls() {
    const containers = document.querySelectorAll('[data-page-controls]');
    if (!containers.length) return;
    // O name precisa ser único por container: radios com o mesmo name no
    // documento formam um grupo só e desmarcam uns aos outros.
    const seg = (name, title, cur, opts) => `
      <div>
        <div class="cv-pc-label">${title}</div>
        <div class="seg">
          ${opts.map((o) => `<label class="seg-opt"><input type="radio" name="${name}" value="${o.v}" ${cur === o.v ? 'checked' : ''}>${o.l}</label>`).join('')}
        </div>
      </div>`;
    containers.forEach((c, ci) => {
      c.innerHTML = `<div class="cv-page-controls">
        ${seg(`pc-margin-${ci}`, 'Margens', state.margin || 'padrao', PAGE_MARGINS)}
        ${seg(`pc-density-${ci}`, 'Espaçamento', state.density || 'normal', PAGE_DENSITIES)}
      </div>`;
      c.querySelectorAll(`input[name="pc-margin-${ci}"]`).forEach((inp) => {
        inp.addEventListener('change', () => setPageOption('margin', inp.value));
      });
      c.querySelectorAll(`input[name="pc-density-${ci}"]`).forEach((inp) => {
        inp.addEventListener('change', () => setPageOption('density', inp.value));
      });
    });
  }

  function cycleTemplate(dir) {
    const i = TEMPLATE_IDS.indexOf(state.template);
    const next = TEMPLATE_IDS[(i + dir + TEMPLATE_IDS.length) % TEMPLATE_IDS.length];
    switchTemplate(next);
  }

  function switchTemplate(templateId) {
    state.template = templateId;
    document.querySelectorAll('.template-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.template === templateId);
    });
    document.querySelectorAll('.review-template-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.template === templateId);
    });
    saveState();
    updateTemplateIndicators();
    debouncedUpdatePreviews();
    showToast(`Template alterado para ${TEMPLATES[templateId].name}`);
  }

  function updateTemplateIndicators() {
    document.querySelectorAll('[data-current-template]').forEach((el) => {
      el.textContent = TEMPLATES[state.template]?.name || 'Classico';
    });
  }

  function goToStep(stepIndex) {
    const sections = activeSections();
    if (stepIndex < 0 || stepIndex >= sections.length) return;
    state.currentStep = stepIndex;
    navigateTo('wizard', sections[stepIndex].id);
  }

  function prevStep() {
    if (state.currentStep > 0) {
      goToStep(state.currentStep - 1);
    } else {
      goToStart();
    }
  }

  function nextStep() {
    EuGeroWizardScreen.validateCurrentStep();
    const sections = activeSections();
    if (state.currentStep < sections.length - 1) {
      goToStep(state.currentStep + 1);
    } else {
      goToReview();
    }
  }

  function showView(view) {
    els.screenHome.hidden = view !== 'home';
    if (els.screenCharacters) els.screenCharacters.hidden = view !== 'characters';
    els.screenStart.hidden = view !== 'start';
    els.screenWizard.hidden = view !== 'wizard';
    els.screenReview.hidden = view !== 'review';
    els.screenGuide.hidden = view !== 'guide';
    if (els.previewMobileDock) {
      els.previewMobileDock.hidden = (view !== 'start' && view !== 'wizard' && view !== 'review');
      // No wizard o botao flutua acima da barra fixa; nas demais, junto da base.
      els.previewMobileDock.style.bottom = view === 'wizard'
        ? 'calc(4.8rem + env(safe-area-inset-bottom))'
        : 'calc(16px + env(safe-area-inset-bottom))';
    }
  }

  function render() {
    showView(currentView);
    updateTemplateIndicators();
    document.querySelectorAll('.template-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.template === state.template);
    });

    if (currentView === 'characters') {
      EuGeroStartScreen.renderCharacterGrid();
    } else if (currentView === 'start') {
      EuGeroStartScreen.renderSectionChecklist();
      EuGeroStartScreen.updateTemplatePreviewMinis();
      debouncedUpdatePreviews();
    } else if (currentView === 'wizard') {
      EuGeroWizardScreen.renderWizardStep();
      debouncedUpdatePreviews();
    } else if (currentView === 'review') {
      EuGeroReviewScreen.renderReview();
    } else if (currentView === 'guide') {
      EuGeroLinkedInGuide.renderGuide(els.guideContent, state);
    }
    renderPageControls();
    observeA4Wraps();
    requestAnimationFrame(scaleReviewPreviews);
  }

  let a4Observer = null;

  function observeA4Wraps() {
    // Re-escala sempre que a moldura muda de tamanho ou aparece
    // (troca de tela, abrir overlay, girar o celular) - evita previa "bugada".
    if (a4Observer || typeof ResizeObserver === 'undefined') return;
    a4Observer = new ResizeObserver(() => scaleReviewPreviews());
    document.querySelectorAll('.preview-a4-wrap').forEach((wrap) => a4Observer.observe(wrap));
  }

  function scaleReviewPreviews() {
    // Escala as prévias dentro da moldura A4 (base do modelo: 370px de largura).
    document.querySelectorAll('.preview-a4-wrap > .preview-content').forEach((preview) => {
      const width = preview.parentElement.clientWidth;
      if (width <= 0) return;
      const scale = width / A4_BASE_WIDTH;
      preview.style.width = `${A4_BASE_WIDTH}px`;
      preview.style.transform = `scale(${scale})`;
    });
  }

  function updateProgressBar() {
    const bar = els.progressBar || document.getElementById('wizard-progress-bar');
    const text = els.progressText || document.getElementById('wizard-progress-text');
    if (!bar || !text) return;
    const progress = EuGeroScoring.calculateProgress(state);
    bar.style.width = `${progress}%`;
    text.textContent = `${progress}% preenchido`;
  }

  function updateAllPreviews() {
    const sections = activeSections();
    document.querySelectorAll('[data-preview]').forEach((container) => {
      EuGeroPreview.updatePreview(container, state, state.template, sections);
    });
    updateMobilePreviewDock();
    EuGeroStartScreen.updateTemplatePreviewMinis();
    updateProgressBar();
    requestAnimationFrame(scaleReviewPreviews);
  }

  const debouncedUpdatePreviews = debounce(updateAllPreviews, 150);

  function updateMobilePreviewDock() {
    const thumb = document.querySelector('[data-preview-mobile]');
    if (!thumb) return;
    EuGeroPreview.updatePreview(thumb, state, state.template, activeSections());
  }

  function exportJson() {
    EuGeroStorage.downloadJson(state);
    showToast('Rascunho exportado com sucesso!');
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showToast('Selecione um arquivo .json valido.', { error: true });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = EuGeroStorage.deserialize(reader.result);
        if (!result.valid) {
          showToast(result.error, { error: true });
          return;
        }
        state = result.data;
        const hasProgress = state.personal?.fullName || state.currentStep > 0;
        if (hasProgress) {
          navigateTo('wizard', activeSections()[state.currentStep]?.id, { replace: true });
        } else {
          navigateTo('home', null, { replace: true });
        }
        showToast('Rascunho carregado com sucesso!');
      } catch (err) {
        showToast('Arquivo corrompido ou invalido. Tente outro arquivo.', { error: true });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function syncBodyScrollLock() {
    const modalOpen = !!document.querySelector('.modal:not([hidden])');
    const overlayOpen = els.previewOverlay && !els.previewOverlay.hidden;
    document.body.classList.toggle('modal-open', modalOpen || overlayOpen);
  }

  function openModal(modal, trigger) {
    if (!modal) return;
    EuGeroA11y.openDialog(modal, trigger);
    syncBodyScrollLock();
  }

  function closeModal(modal) {
    if (!modal) return;
    EuGeroA11y.closeDialog(modal);
    syncBodyScrollLock();
  }

  function openPreviewOverlay(trigger) {
    if (!els.previewOverlay) return;
    EuGeroA11y.openOverlay(els.previewOverlay, trigger);
    syncBodyScrollLock();
    updateAllPreviews();
  }

  function closePreviewOverlay() {
    if (!els.previewOverlay) return;
    EuGeroA11y.closeOverlay(els.previewOverlay);
    syncBodyScrollLock();
  }

  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function showToast(message, options = {}) {
    if (!els.toast) return;
    ensureToastStructure();

    const { error = false, actionLabel = '', onAction = null, duration = 3000 } = options;

    els.toastMessage.textContent = message;
    els.toast.className = 'toast visible' + (error ? ' toast-error' : '');
    els.toast.setAttribute('role', error ? 'alert' : 'status');
    els.toast.setAttribute('aria-live', error ? 'assertive' : 'polite');

    clearTimeout(toastTimer);
    els.toastAction.onclick = null;

    if (actionLabel && typeof onAction === 'function') {
      els.toastAction.textContent = actionLabel;
      els.toastAction.hidden = false;
      els.toastAction.onclick = () => {
        onAction();
        hideToast();
      };
      els.toast.style.pointerEvents = 'auto';
    } else {
      els.toastAction.hidden = true;
      els.toast.style.pointerEvents = 'none';
    }

    toastTimer = setTimeout(hideToast, duration);
  }

  function hideToast() {
    if (!els.toast) return;
    els.toast.className = 'toast';
    els.toast.style.pointerEvents = 'none';
    if (els.toastAction) els.toastAction.hidden = true;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  window.EuGeroApp = {
    getState: () => JSON.parse(JSON.stringify(state)),
    setState: (newState) => {
      state = EuGeroStorage.mergeWithDefaults(newState);
      render();
    },
    switchTemplate: (t) => switchTemplate(t),
    getTemplate: () => state.template,
    getActiveSections: () => activeSections(),
    getCurrentView: () => currentView,
    navigateTo,
    render,
    saveState,
    showToast,
    copyToClipboard: (text) => EuGeroPromptModal.copyToClipboard(text),
    validateCurrentStep: () => EuGeroWizardScreen.validateCurrentStep(),
    appendListItem: (sectionId) => EuGeroWizardScreen.appendListItem(sectionId),
    removeListItem: (sectionId, index) => EuGeroWizardScreen.removeListItem(sectionId, index),
    reorderListItem: (sectionId, index, dir) => EuGeroWizardScreen.reorderListItem(sectionId, index, dir),
    handleExport: (type, btn) => EuGeroReviewScreen.handleExport(type, btn),
    debouncedUpdatePreviews
  };

  document.addEventListener('DOMContentLoaded', init);
})();
