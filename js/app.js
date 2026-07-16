/**
 * Eu Gero Meu Curriculo - aplicacao principal.
 */
(function () {
  'use strict';

  const {
    SECTIONS, TEMPLATES, ACTION_VERBS, createEmptyListItem,
    getActiveSections, normalizeEnabledSections, isSectionMandatory, skillsToText, SHORT_LABELS,
    TEMPLATE_IDS, getTemplateMeta
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
      showPrompt,
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
    EuGeroReviewScreen.init(ctx);
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
    renderTemplatePickers();

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

    document.getElementById('btn-prompt-general')?.addEventListener('click', (e) => showPrompt('general', null, e.currentTarget));
    document.getElementById('btn-prompt-general-review')?.addEventListener('click', (e) => showPrompt('general', null, e.currentTarget));
    document.getElementById('btn-prompt-translation')?.addEventListener('click', (e) => showPrompt('translation', null, e.currentTarget));
    document.getElementById('btn-prompt-translation-guide')?.addEventListener('click', (e) => showPrompt('translation', null, e.currentTarget));
    document.getElementById('btn-copy-prompt')?.addEventListener('click', copyPrompt);
    els.includeDataCheckbox?.addEventListener('change', () => {
      refreshPromptText();
      updatePrivacyWarning();
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
      showPrompt('general', null, e.currentTarget);
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

  function renderCharacterGrid() {
    const grid = document.getElementById('character-grid');
    if (!grid || typeof EuGeroCharacters === 'undefined') return;
    grid.innerHTML = EuGeroCharacters.CHARACTERS.map((c) => `
      <button type="button" class="character-card${c.state ? '' : ' character-card-blank'}" data-character="${c.id}">
        <span class="character-avatar" aria-hidden="true">${escapeHtml(c.initials)}</span>
        <span class="character-kicker">${escapeHtml(c.tagline)}</span>
        <span class="character-name">${escapeHtml(c.name)}</span>
        <span class="character-role">${escapeHtml(c.role)}</span>
        <span class="character-cta">Escolher →</span>
      </button>
    `).join('');
    grid.querySelectorAll('.character-card').forEach((card) => {
      card.addEventListener('click', () => pickCharacter(card.dataset.character));
    });
  }

  function pickCharacter(id) {
    const character = EuGeroCharacters.getById(id);
    if (!character) return;
    if (character.state) {
      // Cópia profunda para não mutar o módulo de personagens.
      state = EuGeroStorage.mergeWithDefaults(JSON.parse(JSON.stringify(character.state)));
      showToast(`Currículo de exemplo carregado: ${character.name}. Edite à vontade!`);
    } else {
      state = EuGeroStorage.mergeWithDefaults(EuGeroConfig.createEmptyState());
      showToast('Página em branco pronta. Vamos montar o seu!');
    }
    saveState();
    goToStart();
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

  function renderTemplatePickers() {
    const getThumbMarkup = (layout, id) => {
      if (layout === 'sidebar') {
        const bg = id === 'creative' ? 'var(--color-accent-2)' : 'var(--color-accent)';
        return `
          <div class="thumb-sidebar" style="background: ${bg}; width: 30%; height: 100%;"></div>
          <div class="thumb-main" style="flex: 1; padding: 6px; display: flex; flex-direction: column; gap: 4px;">
            <div class="thumb-line" style="height: 4px; background: #cbd5e1; width: 80%; border-radius: 1px;"></div>
            <div class="thumb-line" style="height: 3px; background: #e2e8f0; width: 100%; border-radius: 1px;"></div>
            <div class="thumb-line" style="height: 3px; background: #e2e8f0; width: 90%; border-radius: 1px;"></div>
            <div class="thumb-line" style="height: 3px; background: #e2e8f0; width: 40%; border-radius: 1px;"></div>
          </div>
        `;
      }
      if (layout === 'banner') {
        return `
          <div style="display: flex; flex-direction: column; width: 100%; height: 100%;">
            <div class="thumb-banner" style="background: #0f172a; height: 25%; width: 100%;"></div>
            <div style="flex: 1; padding: 6px; display: flex; flex-direction: column; gap: 4px;">
              <div class="thumb-line" style="height: 3px; background: #cbd5e1; width: 60%; border-radius: 1px;"></div>
              <div class="thumb-line" style="height: 3px; background: #e2e8f0; width: 90%; border-radius: 1px;"></div>
              <div class="thumb-line" style="height: 3px; background: #e2e8f0; width: 40%; border-radius: 1px;"></div>
            </div>
          </div>
        `;
      }
      if (layout === 'left') {
        return `
          <div style="display: flex; flex-direction: column; width: 100%; height: 100%; padding: 6px; gap: 4px; align-items: flex-start; text-align: left;">
            <div class="thumb-line" style="height: 5px; background: #475569; width: 50%; border-radius: 1px; margin-bottom: 2px;"></div>
            <div class="thumb-line" style="height: 3px; background: #cbd5e1; width: 90%; border-radius: 1px;"></div>
            <div class="thumb-line" style="height: 3px; background: #e2e8f0; width: 80%; border-radius: 1px;"></div>
            <div class="thumb-line" style="height: 3px; background: #e2e8f0; width: 95%; border-radius: 1px;"></div>
          </div>
        `;
      }
      // Centered (classic, elegant)
      const accent = id === 'elegant' ? '#92400e' : '#334155';
      return `
        <div style="display: flex; flex-direction: column; width: 100%; height: 100%; padding: 6px; gap: 4px; align-items: center; text-align: center;">
          <div class="thumb-line" style="height: 5px; background: ${accent}; width: 60%; border-radius: 1px; margin-bottom: 2px;"></div>
          <div class="thumb-line" style="height: 3px; background: #cbd5e1; width: 40%; border-radius: 1px;"></div>
          <div class="thumb-line" style="height: 3px; background: #e2e8f0; width: 80%; border-radius: 1px; margin-top: 4px;"></div>
          <div class="thumb-line" style="height: 3px; background: #e2e8f0; width: 90%; border-radius: 1px;"></div>
        </div>
      `;
    };

    const cardHtml = (t) => {
      const atsBadge = t.atsFriendly
        ? '<span class="badge badge-ats">ATS</span>'
        : `<span class="badge badge-ats-warn" title="${escapeAttr(t.atsNote || 'Layout pode afetar leitura ATS')}">Atenção ATS</span>`;
      return `
        <button type="button" class="template-card" data-template="${t.id}" aria-label="Template ${escapeAttr(t.name)}">
          <div class="template-thumb ${t.thumbClass}">${getThumbMarkup(t.layout, t.id)}</div>
          <span class="template-card-name">${escapeHtml(t.name)} ${atsBadge}</span>
          <small class="template-card-desc">${escapeHtml(t.description)}</small>
        </button>
      `;
    };

    const startGrid = document.getElementById('template-grid-start');
    if (startGrid) {
      startGrid.innerHTML = TEMPLATE_IDS.map((id) => cardHtml(TEMPLATES[id])).join('');
    }

    const modalGrid = document.getElementById('modal-template-grid');
    if (modalGrid) {
      modalGrid.innerHTML = TEMPLATE_IDS.map((id) => {
        const t = TEMPLATES[id];
        const atsNote = t.atsFriendly ? 'Compativel com ATS' : (t.atsNote || 'Atenção ATS');
        return `<button type="button" class="modal-template-option" data-template="${t.id}"><strong>${escapeHtml(t.name)}</strong><span>${escapeHtml(t.description)} - ${escapeHtml(atsNote)}</span></button>`;
      }).join('');
    }

    document.querySelectorAll('.template-card').forEach((card) => {
      card.addEventListener('click', () => pickTemplate(card.dataset.template));
    });

    updateTemplatePreviewMinis();
  }

  function updateTemplatePreviewMinis() {
    document.querySelectorAll('[data-template-preview]').forEach((container) => {
      EuGeroPreview.updatePreview(container, state, container.dataset.templatePreview, activeSections());
    });
  }

  function pickTemplate(templateId) {
    state.template = templateId;
    document.querySelectorAll('.template-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.template === templateId);
    });
    updateTemplateIndicators();
    debouncedUpdatePreviews();
    saveState();
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

  function toggleSection(sectionId, checked) {
    if (isSectionMandatory(sectionId)) return;
    let enabled = [...state.enabledSections];
    if (checked && !enabled.includes(sectionId)) {
      enabled.push(sectionId);
    } else if (!checked) {
      enabled = enabled.filter((id) => id !== sectionId);
    }
    state.enabledSections = normalizeEnabledSections(enabled);
    const maxStep = activeSections().length - 1;
    if (state.currentStep > maxStep) state.currentStep = Math.max(0, maxStep);
    saveState();
    renderSectionChecklist();
    debouncedUpdatePreviews();
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

  function clearCurrentSection(section) {
    if (!section) return;
    if (section.id === 'personal') {
      state.personal = { fullName: '', headline: '', email: '', phone: '', location: '', linkedinUrl: '' };
    } else if (section.id === 'summary') {
      state.summary = '';
    } else if (section.id === 'skills') {
      state.skillsText = '';
      state.skills = [];
    } else if (section.list) {
      state[section.id] = [];
    }
    saveState();
    renderWizardStep();
    debouncedUpdatePreviews();
    showToast(`Seção "${SHORT_LABELS[section.id] || section.title}" limpa.`);
  }

  function nextStep() {
    validateCurrentStep();
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
      renderCharacterGrid();
    } else if (currentView === 'start') {
      renderSectionChecklist();
      updateTemplatePreviewMinis();
      debouncedUpdatePreviews();
    } else if (currentView === 'wizard') {
      renderWizardStep();
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

  function renderSectionChecklist() {
    if (!els.sectionChecklist) return;
    els.sectionChecklist.innerHTML = SECTIONS.map((section) => {
      const mandatory = isSectionMandatory(section.id);
      const checked = state.enabledSections.includes(section.id) || mandatory;
      const rowBg = checked ? 'color-mix(in srgb, var(--color-accent) 6%, transparent)' : 'transparent';
      return `
        <label class="section-check ${mandatory ? 'section-check-mandatory' : ''}" style="display: flex; align-items: center; gap: 12px; padding: 13px 14px; border: 1px solid var(--color-divider); cursor: ${mandatory ? 'default' : 'pointer'}; background: ${rowBg}; margin-bottom: 2px;">
          <input type="checkbox" data-section-id="${section.id}" ${checked ? 'checked' : ''} ${mandatory ? 'disabled checked' : ''} style="width: 17px; height: 17px; accent-color: var(--color-accent);">
          <span class="section-check-label" style="display:flex; flex:1; align-items:center;">
            <strong style="font-family: var(--font-heading); font-weight: 600; font-size: 16px;">${section.title}</strong>
            <span style="margin-left: auto; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: color-mix(in srgb, var(--color-text) 50%, transparent);">${mandatory ? 'Sempre incluída' : 'Opcional'}</span>
          </span>
        </label>
      `;
    }).join('');

    els.sectionChecklist.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => toggleSection(input.dataset.sectionId, input.checked));
    });
  }

  function renderWizardTimeline() {
    if (!els.wizardTimeline) return;
    const sections = activeSections();
    els.wizardTimeline.innerHTML = sections.map((section, i) => {
      const label = SHORT_LABELS[section.id] || section.title;
      const isActive = i === state.currentStep;
      const isDone = i < state.currentStep;
      const cls = `timeline-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`;
      const ariaCurrent = isActive ? ' aria-current="step"' : '';
      return `
        <button type="button" class="${cls}" data-step="${i}" title="${escapeAttr(section.title)}" aria-label="Etapa ${i + 1}: ${escapeAttr(label)}"${ariaCurrent}>
          <span class="timeline-step-num">${i + 1}</span><span class="timeline-step-label">${escapeHtml(label)}</span>
        </button>
      `;
    }).join('');

    els.wizardTimeline.querySelectorAll('.timeline-step').forEach((btn) => {
      btn.addEventListener('click', () => goToStep(parseInt(btn.dataset.step, 10)));
    });

    const activeBtn = els.wizardTimeline.querySelector('.timeline-step.active');
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  function renderWizardStep() {
    const sections = activeSections();
    const section = sections[state.currentStep];
    if (!section) {
      state.currentStep = 0;
      saveState();
      if (sections.length === 0) return;
      return renderWizardStep();
    }

    if (!els.wizardSteps) return;

    const titleEl = document.getElementById('wizard-step-title');
    const counterEl = document.getElementById('wizard-step-counter');
    const descEl = document.getElementById('wizard-step-desc');
    
    if (titleEl) titleEl.textContent = SHORT_LABELS[section.id] || section.title;
    if (counterEl) counterEl.textContent = `Etapa ${state.currentStep + 1} de ${sections.length}`;
    if (descEl) descEl.textContent = section.description || '';
    
    if (els.wizardProgress) {
      els.wizardProgress.textContent = `Etapa ${state.currentStep + 1} de ${sections.length}: ${section.title}`;
    }

    els.wizardSteps.innerHTML = '';
    const stepEl = document.createElement('div');
    stepEl.className = 'wizard-step';
    stepEl.dataset.sectionId = section.id;

    if (section.list) {
      stepEl.appendChild(renderListSection(section));
    } else if (section.fields) {
      const grid = document.createElement('div');
      grid.className = 'cv-form2';
      grid.style.marginTop = '16px';
      section.fields.forEach((field) => {
        grid.appendChild(renderField(section, field));
      });
      stepEl.appendChild(grid);
    }

    const actionsRow = document.createElement('div');
    actionsRow.style.cssText = 'margin-top: 30px; display: flex; flex-wrap: wrap; gap: 18px; align-items: center;';
    const mutedGhost = 'font-size: 13.5px; color: color-mix(in srgb, var(--color-text) 55%, transparent);';

    const aiBtn = document.createElement('button');
    aiBtn.type = 'button';
    aiBtn.className = 'btn btn-ghost btn-ai-section';
    aiBtn.style.cssText = mutedGhost;
    aiBtn.textContent = 'Travou? Peça ideias a uma IA →';
    aiBtn.addEventListener('click', (e) => showPrompt('section', section.id, e.currentTarget));
    actionsRow.appendChild(aiBtn);

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn btn-ghost';
    clearBtn.style.cssText = mutedGhost;
    clearBtn.textContent = 'Limpar esta seção';
    clearBtn.addEventListener('click', () => clearCurrentSection(section));
    actionsRow.appendChild(clearBtn);

    stepEl.appendChild(actionsRow);
    els.wizardSteps.appendChild(stepEl);

    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    if (prevBtn) {
      prevBtn.disabled = false;
      prevBtn.textContent = state.currentStep === 0 ? 'Configuração' : 'Anterior';
    }
    if (nextBtn) {
      nextBtn.textContent = state.currentStep === sections.length - 1 ? 'Revisar →' : 'Próximo';
    }

    renderWizardTimeline();
  }

  function fieldErrorId(section, field, index) {
    if (index != null) return `error-${section.id}-${index}-${field.key}`;
    return `error-${section.id}-${field.key}`;
  }

  function renderFieldTip(field) {
    if (!field.tip) return '';
    return `
      <span class="cv-help" tabindex="0" aria-label="Ajuda">?<span class="cv-tip-pop">${escapeHtml(field.tip)}</span></span>
    `;
  }

  function getFieldIdealMax(field) {
    if (field.idealMax) return field.idealMax;
    if (field.actionVerbs) {
      if (field.key === 'summary') return 550;
      return 260;
    }
    if (field.key === 'skillsText') return 180;
    return 120;
  }

  function renderCharCounter(wrap, field, getValue) {
    const idealMax = getFieldIdealMax(field);
    const counter = document.createElement('span');
    counter.className = 'char-counter';
    counter.setAttribute('aria-live', 'polite');
    const update = () => {
      const len = (getValue() || '').length;
      counter.textContent = `${len}/${idealMax}`;
      counter.classList.toggle('char-counter-over', len > idealMax);
    };
    update();
    wrap.appendChild(counter);
    return update;
  }

  function clearFieldValidation(scope) {
    scope.querySelectorAll('.field-invalid').forEach((el) => {
      el.classList.remove('field-invalid');
      el.removeAttribute('aria-describedby');
    });
    scope.querySelectorAll('.field-error').forEach((el) => el.remove());
  }

  function setFieldInvalid(input, errorId, message) {
    input.classList.add('field-invalid');
    input.setAttribute('aria-describedby', errorId);
    const err = document.createElement('span');
    err.id = errorId;
    err.className = 'field-error';
    err.setAttribute('role', 'alert');
    err.textContent = message;
    input.closest('.field-group')?.appendChild(err);
  }

  function validateCurrentStep() {
    const sections = activeSections();
    const section = sections[state.currentStep];
    if (!section) return true;

    const scope = els.wizardSteps;
    if (!scope) return true;

    clearFieldValidation(scope);
    const result = EuGeroValidation.validateSection(state, section);

    result.issues.forEach((issue) => {
      let input;
      if (issue.itemIndex != null) {
        const card = scope.querySelector(`.list-item-card[data-index="${issue.itemIndex}"]`);
        const fieldWrap = card?.querySelector(`[data-field="${issue.fieldKey}"]`);
        input = fieldWrap?.querySelector('input, textarea, select')
          || scope.querySelector(`#field-${issue.sectionId}-${issue.itemIndex}-${issue.fieldKey}`);
      } else {
        input = scope.querySelector(`#field-${issue.sectionId}-${issue.fieldKey}`)
          || scope.querySelector(`[data-field="${issue.fieldKey}"] input, [data-field="${issue.fieldKey}"] textarea, [data-field="${issue.fieldKey}"] select`);
      }
      if (input) {
        const errorId = fieldErrorId(section, { key: issue.fieldKey }, issue.itemIndex);
        setFieldInvalid(input, errorId, issue.message);
      }
    });

    if (!result.valid) {
      showToast('Revise os campos destacados antes de continuar.', { duration: 4000 });
      const firstInvalid = scope.querySelector('.field-invalid');
      firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalid?.focus?.();
      return false;
    }
    return true;
  }

  function renderField(section, field, options = {}) {
    const wrap = document.createElement('label');
    wrap.className = 'field-group' + (field.fullWidth ? ' field-full' : '');
    wrap.style.display = 'block';
    if (field.fullWidth) wrap.style.gridColumn = '1 / -1';
    wrap.dataset.section = section.id;
    wrap.dataset.field = field.key;

    const value = getFieldValue(section, field, options.item);
    const id = options.id || `field-${section.id}${options.index != null ? `-${options.index}` : ''}-${field.key}`;

    if (field.type === 'skillsTags') {
      renderSkillsTagsField(wrap, section, field, value, id);
      return wrap;
    }

    if (field.type === 'monthYear') {
      renderMonthYearField(wrap, section, field, value, {
        id,
        index: options.index,
        item: options.item
      });
      return wrap;
    }

    const labelRow = document.createElement('span');
    labelRow.style.cssText = 'display:flex; align-items:center; gap:7px; font-size: 13px; margin-bottom: 6px; color: color-mix(in srgb, var(--color-text) 72%, transparent);';
    labelRow.innerHTML = `${field.label}${renderFieldTip(field)}`;
    wrap.appendChild(labelRow);

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.className = 'cv-input';
      input.id = id;
      input.name = field.key;
      input.rows = 3;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.required) input.required = true;
      input.value = value;
      wrap.appendChild(input);
    } else if (field.type === 'select') {
      input = document.createElement('select');
      input.className = 'cv-input';
      input.id = id;
      input.name = field.key;
      if (field.required) input.required = true;
      input.innerHTML = `<option value="">Selecione...</option>${(field.options || []).map((o) =>
        `<option value="${escapeAttr(o)}" ${value === o ? 'selected' : ''}>${escapeHtml(o)}</option>`
      ).join('')}`;
      wrap.appendChild(input);
    } else {
      input = document.createElement('input');
      input.className = 'cv-input';
      input.type = field.type || 'text';
      input.id = id;
      input.name = field.key;
      input.value = value;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.required) input.required = true;
      wrap.appendChild(input);
    }

    // Dica de qualidade sob o campo, igual ao modelo.
    let hintEl = null;
    const hintKind = field.actionVerbs ? 'quality' : (field.type === 'email' ? 'email' : null);
    if (hintKind) {
      hintEl = document.createElement('div');
      hintEl.className = 'field-hint';
      hintEl.setAttribute('role', 'status');
      wrap.appendChild(hintEl);
      updateFieldHint(hintEl, hintKind, value);
    }

    const eventName = field.type === 'select' ? 'change' : 'input';
    input.addEventListener(eventName, () => {
      setFieldValue(section, field, input.value, options.item, options.index);
      if (hintEl) updateFieldHint(hintEl, hintKind, input.value);
      clearFieldValidation(wrap);
      debouncedUpdatePreviews();
      saveState();
    });

    return wrap;
  }

  // --- Dicas de qualidade (mesma heuristica e textos do modelo) ---
  const QUALITY_VERBS = ['lider', 'otimiz', 'desenvolv', 'cri', 'aument', 'reduz', 'implement', 'gerenci',
    'coorden', 'lanc', 'negoci', 'analis', 'planej', 'execut', 'conduz', 'melhor', 'constru', 'estrutur',
    'automatiz', 'entreg', 'organiz', 'dobr', 'triplic', 'apoi', 'atend', 'vend', 'captei', 'capt', 'arrecad', 'ajud'];

  function textQuality(text) {
    const t = (text || '').trim();
    if (!t) return { kind: 'empty', label: 'Dica: comece com um verbo de ação (ex.: Vendi, Organizei, Atendi…).' };
    const low = t.toLowerCase();
    const hasVerb = QUALITY_VERBS.some((v) => low.includes(v));
    const hasNum = /\d/.test(t);
    if (t.length < 45) return { kind: 'weak', label: 'Continue - conte o que você fez e o impacto disso.' };
    if (hasVerb && hasNum) return { kind: 'great', label: 'Ótimo! Tem verbo de ação e um resultado com número.' };
    if (hasNum) return { kind: 'good', label: 'Bom - que tal começar com um verbo de ação para reforçar?' };
    if (hasVerb) return { kind: 'good', label: 'Bom - tente incluir um número ou resultado concreto.' };
    return { kind: 'weak', label: 'Adicione um verbo de ação no início da frase.' };
  }

  const HINT_STYLE = {
    empty: { c: 'var(--color-neutral-600)', i: 'info' },
    weak: { c: 'var(--color-neutral-700)', i: 'arrow' },
    good: { c: 'var(--color-accent-700)', i: 'check' },
    great: { c: 'var(--color-accent-800)', i: 'star' }
  };

  function hintIconSvg(name, color) {
    const open = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">`;
    const paths = {
      info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5"></path><path d="M12 8h.01"></path>',
      arrow: '<path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path>',
      check: '<path d="M20 6L9 17l-5-5"></path>',
      star: '<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3z"></path>'
    };
    return `${open}${paths[name]}</svg>`;
  }

  function updateFieldHint(el, kind, value) {
    let q;
    if (kind === 'email') {
      q = (!value || /.+@.+\..+/.test(value))
        ? { kind: 'good', label: 'Use um e-mail que você consulta com frequência.' }
        : { kind: 'weak', label: 'Esse e-mail parece incompleto - confira o "@" e o domínio.' };
    } else {
      q = textQuality(value);
    }
    const m = HINT_STYLE[q.kind];
    el.style.color = m.c;
    el.innerHTML = `${hintIconSvg(m.i, m.c)}<span>${escapeHtml(q.label)}</span>`;
  }

  function renderMonthYearField(wrap, section, field, value, { id, index, item }) {
    const parsed = EuGeroDates.parseStoredDate(value);
    const monthId = `${id}-month`;
    const yearId = `${id}-year`;
    const showEndCurrent = item && EuGeroDates.hasEndCurrentFlag(section.id, field.key);
    const isEndDisabled = () => showEndCurrent && item.endCurrent && field.key === 'endDate';

    wrap.innerHTML = `
      <div class="field-label-row">
        <label for="${monthId}">${field.label}${field.required ? ' <span class="required">*</span>' : ''}</label>
        <div class="field-score" aria-live="polite"></div>
      </div>
      <div class="month-year-row ${isEndDisabled() ? 'is-disabled' : ''}">
        <select id="${monthId}" class="month-year-month" aria-label="${escapeAttr(field.label)} mes" ${isEndDisabled() ? 'disabled' : ''}>
          ${EuGeroDates.monthOptions(parsed.month)}
        </select>
        <select id="${yearId}" class="month-year-year" aria-label="${escapeAttr(field.label)} ano" ${isEndDisabled() ? 'disabled' : ''}>
          ${EuGeroDates.yearOptions(parsed.year)}
        </select>
      </div>
      ${showEndCurrent ? `
        <label class="checkbox-label end-current-label">
          <input type="checkbox" class="end-current-checkbox" ${item.endCurrent ? 'checked' : ''}>
          Ate hoje
        </label>
      ` : ''}
      ${renderFieldTip(field)}
    `;

    const monthSel = wrap.querySelector('.month-year-month');
    const yearSel = wrap.querySelector('.month-year-year');
    const endCheckbox = wrap.querySelector('.end-current-checkbox');
    const row = wrap.querySelector('.month-year-row');

    function syncDate() {
      if (isEndDisabled()) return;
      const serialized = EuGeroDates.serializeDate(monthSel.value, yearSel.value);
      if (item && index != null) {
        state[section.id][index][field.key] = serialized;
        updateFieldScore(wrap, field, serialized);
      } else {
        setFieldValue(section, field, serialized);
        updateFieldScore(wrap, field, serialized);
      }
      clearFieldValidation(wrap);
      debouncedUpdatePreviews();
      saveState();
    }

    monthSel?.addEventListener('change', syncDate);
    yearSel?.addEventListener('change', syncDate);

    if (endCheckbox && item) {
      endCheckbox.addEventListener('change', () => {
        item.endCurrent = endCheckbox.checked;
        if (field.key === 'endDate') {
          const disable = item.endCurrent;
          monthSel.disabled = disable;
          yearSel.disabled = disable;
          row?.classList.toggle('is-disabled', disable);
          if (disable) {
            item.endDate = '';
          }
        } else if (item.endCurrent) {
          item.endDate = '';
          const endField = section.itemFields?.find((f) => f.key === 'endDate');
          const endWrap = wrap.closest('.list-item-card')?.querySelector('[data-field="endDate"]');
          if (endWrap) {
            const endMonth = endWrap.querySelector('.month-year-month');
            const endYear = endWrap.querySelector('.month-year-year');
            if (endMonth) endMonth.disabled = true;
            if (endYear) endYear.disabled = true;
            endWrap.querySelector('.month-year-row')?.classList.add('is-disabled');
          }
        }
        debouncedUpdatePreviews();
        saveState();
      });
    }

    updateFieldScore(wrap, field, value);
  }

  const SKILL_SUGGESTIONS = ['Trabalho em equipe', 'Comunicação', 'Atendimento ao cliente', 'Organização',
    'Pacote Office', 'Proatividade', 'Resolução de problemas', 'Liderança', 'Pontualidade', 'Vendas'];

  function renderSkillsTagsField(wrap, section, field, value, id) {
    const tags = EuGeroConfig.parseSkillsText(value || state.skillsText);

    wrap.innerHTML = `
      <span style="display:flex; align-items:center; gap:7px; font-size: 13px; margin-bottom: 6px; color: color-mix(in srgb, var(--color-text) 72%, transparent);">${field.label}${renderFieldTip(field)}</span>
      <input type="text" id="${id}" class="cv-input" placeholder="${escapeAttr(field.placeholder || 'Ex.: Atendimento ao cliente…')}" autocomplete="off">
      <div class="skills-tags-chips" role="list"></div>
      <p class="skills-suggest-title">Sugestões - clique para adicionar</p>
      <div class="skills-suggest-row"></div>
    `;

    const chipsEl = wrap.querySelector('.skills-tags-chips');
    const suggestEl = wrap.querySelector('.skills-suggest-row');
    const input = wrap.querySelector(`#${CSS.escape(id)}`);

    function syncTags(newTags) {
      const text = newTags.map((t) => t.name || t).filter(Boolean).join('; ');
      state.skillsText = text;
      state.skills = newTags;
      clearFieldValidation(wrap);
      debouncedUpdatePreviews();
      saveState();
    }

    function renderChips() {
      chipsEl.innerHTML = tags.map((tag, i) => `
        <button type="button" class="skills-tag-chip" role="listitem" data-index="${i}" aria-label="Remover ${escapeAttr(tag.name || tag)}">
          ${escapeHtml(tag.name || tag)}<span class="skills-tag-remove">×</span>
        </button>
      `).join('');
      chipsEl.querySelectorAll('.skills-tag-chip').forEach((btn) => {
        btn.addEventListener('click', () => {
          tags.splice(parseInt(btn.dataset.index, 10), 1);
          renderChips();
          renderSuggestions();
          syncTags(tags);
        });
      });
    }

    function renderSuggestions() {
      const existing = new Set(tags.map((t) => (t.name || t).toLowerCase()));
      const options = SKILL_SUGGESTIONS.filter((s) => !existing.has(s.toLowerCase())).slice(0, 6);
      suggestEl.innerHTML = options.map((s) =>
        `<button type="button" class="skills-suggest-btn" data-name="${escapeAttr(s)}">+ ${escapeHtml(s)}</button>`
      ).join('');
      suggestEl.querySelectorAll('.skills-suggest-btn').forEach((btn) => {
        btn.addEventListener('click', () => addTag(btn.dataset.name));
      });
    }

    function addTag(raw) {
      const name = raw.trim().replace(/[;,]+$/, '');
      if (!name) return;
      if (tags.some((t) => (t.name || t).toLowerCase() === name.toLowerCase())) return;
      tags.push({ name });
      renderChips();
      renderSuggestions();
      syncTags(tags);
    }

    renderChips();
    renderSuggestions();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ';') {
        e.preventDefault();
        addTag(input.value);
        input.value = '';
      } else if (e.key === 'Backspace' && !input.value && tags.length) {
        tags.pop();
        renderChips();
        renderSuggestions();
        syncTags(tags);
      }
    });

    input.addEventListener('blur', () => {
      if (input.value.trim()) {
        addTag(input.value);
        input.value = '';
      }
    });
  }

  function getFieldValue(section, field, item) {
    if (item) return item[field.key] || '';
    if (section.id === 'personal') return state.personal[field.key] || '';
    if (section.id === 'summary') return state.summary || '';
    if (section.id === 'skills') return skillsToText(state);
    return state[field.key] || '';
  }

  function setFieldValue(section, field, value, item, index) {
    if (item != null && index != null) {
      state[section.id][index][field.key] = value;
      return;
    }
    if (section.id === 'personal') {
      state.personal[field.key] = value;
    } else if (section.id === 'summary') {
      state.summary = value;
    } else if (section.id === 'skills') {
      state.skillsText = value;
      state.skills = EuGeroConfig.parseSkillsText(value);
    } else {
      state[field.key] = value;
    }
  }

  function renderListSection(section) {
    const container = document.createElement('div');
    container.className = 'list-section';

    if (!Array.isArray(state[section.id])) state[section.id] = [];
    const items = state[section.id];

    const listEl = document.createElement('div');
    listEl.className = 'list-items';
    listEl.id = `list-items-${section.id}`;
    listEl.style.cssText = `display: flex; flex-direction: column; gap: ${section.id === 'languages' ? '14px' : '20px'};`;

    if (items.length === 0) items.push(createEmptyListItem(section.id));

    items.forEach((item, index) => {
      listEl.appendChild(createListItemEl(section, item, index));
    });

    container.appendChild(listEl);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-secondary btn-add-item';
    addBtn.style.cssText = 'align-self: flex-start; min-height: 42px; margin-top: 20px;';
    addBtn.textContent = `+ Adicionar ${(LIST_ITEM_LABELS[section.id] || 'item').toLowerCase()}`;
    addBtn.addEventListener('click', () => appendListItem(section.id));
    container.appendChild(addBtn);

    return container;
  }

  const LIST_ITEM_LABELS = {
    experiences: 'Experi\u00eancia',
    education: 'Forma\u00e7\u00e3o',
    languages: 'Idioma',
    certifications: 'Certificado',
    projects: 'Projeto'
  };

  function createListItemEl(section, item, index) {
    const makeRemoveBtn = (card) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-ghost btn-remove-item';
      btn.style.fontSize = '13px';
      btn.textContent = 'Remover';
      btn.addEventListener('click', () => {
        removeListItem(section.id, parseInt(card.dataset.index, 10));
      });
      return btn;
    };

    // Idiomas: linha simples (Idioma | N\u00edvel | Remover), como no modelo.
    if (section.id === 'languages') {
      const card = document.createElement('div');
      card.className = 'list-item-card cv-form2';
      card.dataset.index = String(index);
      card.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr auto; gap: 12px; align-items: end;';
      section.itemFields.forEach((field) => {
        card.appendChild(renderField(section, field, { item, index, id: `field-${section.id}-${index}-${field.key}` }));
      });
      const removeBtn = makeRemoveBtn(card);
      removeBtn.style.minHeight = '40px';
      card.appendChild(removeBtn);
      return card;
    }

    // Demais listas: card blueprint com cantos, como no modelo.
    const card = document.createElement('div');
    card.className = 'list-item-card blueprint';
    card.dataset.index = String(index);
    card.style.padding = '20px';
    card.innerHTML = '<i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>';

    const header = document.createElement('div');
    header.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;';
    const num = document.createElement('span');
    num.className = 'list-item-num';
    num.style.cssText = 'font-family: var(--font-heading); font-weight: 600; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-accent-700);';
    num.textContent = `${LIST_ITEM_LABELS[section.id] || 'Item'} ${String(index + 1).padStart(2, '0')}`;
    header.appendChild(num);
    header.appendChild(makeRemoveBtn(card));
    card.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'cv-form2';
    grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 14px;';
    section.itemFields.forEach((field) => {
      grid.appendChild(renderField(section, field, { item, index, id: `field-${section.id}-${index}-${field.key}` }));
    });
    card.appendChild(grid);

    return card;
  }

  function reindexListCards(sectionId) {
    const container = document.getElementById(`list-items-${sectionId}`);
    if (!container) return;
    const label = LIST_ITEM_LABELS[sectionId] || 'Item';
    const cards = container.querySelectorAll('.list-item-card');
    cards.forEach((card, i) => {
      card.dataset.index = String(i);
      const num = card.querySelector('.list-item-num');
      if (num) num.textContent = `${label} ${String(i + 1).padStart(2, '0')}`;
    });
  }

  function appendListItem(sectionId) {
    const section = SECTIONS.find((s) => s.id === sectionId);
    if (!section) return;
    if (!Array.isArray(state[sectionId])) state[sectionId] = [];
    const newItem = createEmptyListItem(sectionId);
    state[sectionId].push(newItem);
    const index = state[sectionId].length - 1;

    const container = document.getElementById(`list-items-${sectionId}`);
    if (container) {
      const card = createListItemEl(section, newItem, index);
      container.appendChild(card);
      reindexListCards(sectionId);
      const firstField = card.querySelector('input:not([type="checkbox"]), textarea, select');
      firstField?.focus();
    } else {
      renderWizardStep();
    }

    saveState();
    debouncedUpdatePreviews();
  }

  function removeListItem(sectionId, index) {
    const items = state[sectionId];
    if (!items || index < 0 || index >= items.length) return;

    const removed = { ...items[index] };
    const removedIndex = index;
    items.splice(index, 1);

    const container = document.getElementById(`list-items-${sectionId}`);
    const card = container?.querySelector(`.list-item-card[data-index="${index}"]`);
    card?.remove();
    reindexListCards(sectionId);

    if (items.length === 0) {
      appendListItem(sectionId);
    }

    saveState();
    debouncedUpdatePreviews();

    showToast('Item removido.', {
      actionLabel: 'Desfazer',
      duration: 5000,
      onAction: () => {
        const section = SECTIONS.find((s) => s.id === sectionId);
        if (!section) return;
        state[sectionId].splice(removedIndex, 0, removed);
        const listContainer = document.getElementById(`list-items-${sectionId}`);
        if (listContainer) {
          const newCard = createListItemEl(section, removed, removedIndex);
          const siblings = listContainer.querySelectorAll('.list-item-card');
          if (removedIndex >= siblings.length) {
            listContainer.appendChild(newCard);
          } else {
            listContainer.insertBefore(newCard, siblings[removedIndex]);
          }
          reindexListCards(sectionId);
        } else {
          renderWizardStep();
        }
        saveState();
        debouncedUpdatePreviews();
        showToast('Item restaurado.');
      }
    });
  }

  function reorderListItem(sectionId, index, direction) {
    const items = state[sectionId];
    const newIndex = index + direction;
    if (!items || newIndex < 0 || newIndex >= items.length) return;

    const tmp = items[index];
    items[index] = items[newIndex];
    items[newIndex] = tmp;

    const container = document.getElementById(`list-items-${sectionId}`);
    if (!container) return;
    const cards = Array.from(container.querySelectorAll('.list-item-card'));
    const cardA = cards[index];
    const cardB = cards[newIndex];
    if (direction < 0) {
      container.insertBefore(cardA, cardB);
    } else {
      container.insertBefore(cardB, cardA);
    }
    reindexListCards(sectionId);
    saveState();
    debouncedUpdatePreviews();
  }

  function updateFieldScore(wrap, field, value) {
    const scoreEl = wrap.querySelector('.field-score');
    if (!scoreEl) return;
    const score = EuGeroScoring.scoreField(value, field, ACTION_VERBS);
    scoreEl.textContent = EuGeroScoring.getLabelText(score);
    scoreEl.className = `field-score score-${score}`;
    scoreEl.title = `Nota: ${EuGeroScoring.getLabelText(score)}`;
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
    updateTemplatePreviewMinis();
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

  let promptContext = { type: 'general', sectionId: null };

  function showPrompt(type, sectionId, trigger) {
    promptContext = { type, sectionId: sectionId || null };
    refreshPromptText();
    updatePrivacyWarning();
    openModal(els.modalPrompt, trigger);
  }

  function refreshPromptText() {
    const includeData = els.includeDataCheckbox?.checked ?? true;
    let prompt = '';
    if (promptContext.type === 'general') prompt = EuGeroPrompts.buildGeneralPrompt(state, includeData);
    else if (promptContext.type === 'section') prompt = EuGeroPrompts.buildSectionPrompt(promptContext.sectionId, state, includeData);
    else if (promptContext.type === 'translation') prompt = EuGeroPrompts.buildTranslationPrompt(state, includeData);
    if (els.promptText) els.promptText.value = prompt;
    updatePrivacyWarning();
  }

  function updatePrivacyWarning() {
    const warning = els.privacyPromptWarning || document.getElementById('privacy-prompt-warning');
    if (!warning) return;
    const includeData = els.includeDataCheckbox?.checked ?? true;
    const hasData = EuGeroPrompts.containsPersonalData(els.promptText?.value || '');
    warning.hidden = !(includeData && hasData);
  }

  async function copyPrompt() {
    const ok = await copyToClipboard(els.promptText?.value || '');
    if (ok) showToast('Prompt copiado!');
    else showToast('Nao foi possivel copiar. Selecione o texto manualmente.', { error: true });
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
    copyToClipboard,
    validateCurrentStep,
    appendListItem,
    removeListItem,
    reorderListItem,
    handleExport: (type, btn) => EuGeroReviewScreen.handleExport(type, btn),
    debouncedUpdatePreviews
  };

  document.addEventListener('DOMContentLoaded', init);
})();
