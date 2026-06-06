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
  const REVIEW_PREVIEW_BASE_WIDTH = 340;

  const PAGE_TITLES = {
    home: 'Eu Gero Meu Curriculo - Inicio',
    start: 'Eu Gero Meu Curriculo - Configuracao',
    wizard: 'Eu Gero Meu Curriculo - Preenchimento',
    review: 'Eu Gero Meu Curriculo - Revisao',
    guide: 'Eu Gero Meu Curriculo - Guia LinkedIn'
  };

  const MAIN_HEADING_SELECTORS = {
    home: '.home-title',
    start: '#screen-start .start-block h2',
    wizard: '#wizard-progress',
    review: '.review-summary h2',
    guide: '.guide-header h2'
  };

  function init() {
    cacheElements();
    ensureToastStructure();
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
  }

  function cacheElements() {
    els.screenHome = document.getElementById('screen-home');
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
    els.headerActions = document.getElementById('header-actions-wizard');
    els.includeDataCheckbox = document.getElementById('include-data-checkbox');
    els.privacyPromptWarning = document.getElementById('privacy-prompt-warning');
    els.savedIndicator = document.getElementById('saved-indicator');
    els.previewMobileDock = document.getElementById('preview-mobile-dock');
    els.toastMessage = document.getElementById('toast-message');
    els.toastAction = document.getElementById('toast-action');
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
    navigateTo('review');
  }

  function goToGuide() {
    navigateTo('guide');
  }

  function bindGlobalEvents() {
    renderTemplatePickers();

    document.getElementById('btn-enter-app')?.addEventListener('click', goToStart);
    document.getElementById('btn-go-home')?.addEventListener('click', goToHome);
    document.getElementById('btn-import-home')?.addEventListener('click', () => els.fileImport?.click());

    document.getElementById('btn-start-wizard')?.addEventListener('click', startWizard);
    document.getElementById('btn-fill-sample')?.addEventListener('click', fillSampleData);
    document.getElementById('btn-change-template-wizard')?.addEventListener('click', (e) => openModal(els.modalTemplate, e.currentTarget));
    document.getElementById('btn-prev')?.addEventListener('click', prevStep);
    document.getElementById('btn-next')?.addEventListener('click', nextStep);
    document.getElementById('btn-back-wizard')?.addEventListener('click', () => goToWizard());
    document.getElementById('btn-guide')?.addEventListener('click', goToGuide);
    document.getElementById('btn-back-review')?.addEventListener('click', goToReview);
    document.getElementById('btn-back-start')?.addEventListener('click', goToStart);

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

  function renderTemplatePickers() {
    const cardHtml = (t) => {
      const atsBadge = t.atsFriendly
        ? '<span class="badge badge-ats">ATS</span>'
        : `<span class="badge badge-ats-warn" title="${escapeAttr(t.atsNote || 'Layout pode afetar leitura ATS')}">Atenção ATS</span>`;
      return `
        <button type="button" class="template-card" data-template="${t.id}" aria-label="Template ${escapeAttr(t.name)}">
          <div class="template-thumb ${t.thumbClass}"></div>
          <div class="template-preview" data-template-preview="${t.id}" aria-hidden="true"></div>
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
    }
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    const sections = activeSections();
    if (state.currentStep < sections.length - 1) {
      goToStep(state.currentStep + 1);
    } else {
      goToReview();
    }
  }

  function showView(view) {
    els.screenHome.hidden = view !== 'home';
    els.screenStart.hidden = view !== 'start';
    els.screenWizard.hidden = view !== 'wizard';
    els.screenReview.hidden = view !== 'review';
    els.screenGuide.hidden = view !== 'guide';
    if (els.headerActions) {
      els.headerActions.hidden = view !== 'wizard';
    }
  }

  function focusMainHeading(view) {
    requestAnimationFrame(() => {
      const selector = MAIN_HEADING_SELECTORS[view];
      if (!selector) return;
      const el = document.querySelector(selector);
      if (!el) return;
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: false });
    });
  }

  function render() {
    showView(currentView);
    document.title = PAGE_TITLES[currentView] || 'Eu Gero Meu Curriculo';
    updateTemplateIndicators();
    document.querySelectorAll('.template-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.template === state.template);
    });

    if (currentView === 'start') {
      renderSectionChecklist();
      updateTemplatePreviewMinis();
      debouncedUpdatePreviews();
    } else if (currentView === 'wizard') {
      renderWizardStep();
      debouncedUpdatePreviews();
    } else if (currentView === 'review') {
      renderReview();
    } else if (currentView === 'guide') {
      EuGeroLinkedInGuide.renderGuide(els.guideContent, state);
    }

    focusMainHeading(currentView);
  }

  function renderSectionChecklist() {
    if (!els.sectionChecklist) return;
    els.sectionChecklist.innerHTML = SECTIONS.map((section) => {
      const mandatory = isSectionMandatory(section.id);
      const checked = state.enabledSections.includes(section.id);
      return `
        <label class="section-check ${mandatory ? 'section-check-mandatory' : ''}">
          <input type="checkbox" data-section-id="${section.id}" ${checked ? 'checked' : ''} ${mandatory ? 'disabled checked' : ''}>
          <span class="section-check-label">
            <strong>${section.title}</strong>
            ${mandatory ? '<span class="badge badge-required">Obrigatorio</span>' : ''}
            <small>${section.description || ''}</small>
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
      const cls = [
        'timeline-step',
        i === state.currentStep ? 'active' : '',
        i < state.currentStep ? 'done' : ''
      ].filter(Boolean).join(' ');
      const ariaCurrent = i === state.currentStep ? ' aria-current="step"' : '';
      return `
        <button type="button" class="${cls}" data-step="${i}" title="${escapeAttr(section.title)}"${ariaCurrent}>
          <span class="timeline-num">${i + 1}</span>
          <span class="timeline-label">${escapeHtml(label)}</span>
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
      grid.className = section.id === 'personal' ? 'field-grid field-grid-personal' : 'field-grid';
      section.fields.forEach((field) => {
        grid.appendChild(renderField(section, field));
      });
      stepEl.appendChild(grid);
    }

    const aiBtn = document.createElement('button');
    aiBtn.type = 'button';
    aiBtn.className = 'btn btn-outline btn-ai-section';
    aiBtn.textContent = 'Pedir ajuda a IA';
    aiBtn.addEventListener('click', (e) => showPrompt('section', section.id, e.currentTarget));
    stepEl.appendChild(aiBtn);

    els.wizardSteps.appendChild(stepEl);

    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    if (prevBtn) prevBtn.disabled = state.currentStep === 0;
    if (nextBtn) {
      nextBtn.textContent = state.currentStep === sections.length - 1 ? 'Ir para revisao' : 'Proximo';
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
      <details class="field-tip-expand">
        <summary>Dica</summary>
        <p>${escapeHtml(field.tip)}</p>
      </details>
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

  function markValidationIssues(scope, issues, sectionId) {
    const section = SECTIONS.find((s) => s.id === sectionId);
    if (!section || !scope) return;

    issues.forEach((issue) => {
      if (issue.sectionId !== sectionId) return;
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
  }

  function focusFirstInvalidField(scope) {
    const firstInvalid = scope?.querySelector('.field-invalid');
    if (!firstInvalid) return;
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    firstInvalid.focus?.();
  }

  function validateCurrentStep() {
    const sections = activeSections();
    const section = sections[state.currentStep];
    if (!section) return true;

    const scope = els.wizardSteps;
    if (!scope) return true;

    clearFieldValidation(scope);
    const result = EuGeroValidation.validateSection(state, section);
    markValidationIssues(scope, result.issues, section.id);

    if (!result.valid) {
      showToast('Revise os campos destacados antes de continuar.', { duration: 4000 });
      focusFirstInvalidField(scope);
      return false;
    }
    return true;
  }

  function validateForExport() {
    const sections = activeSections();
    const result = EuGeroValidation.validateActiveSections(state, sections);
    if (result.valid) return true;

    const first = result.issues[0];
    const stepIndex = sections.findIndex((s) => s.id === first.sectionId);
    showToast('Complete os campos obrigatorios antes de exportar.', { duration: 5000, error: true });

    if (stepIndex >= 0) {
      state.currentStep = stepIndex;
      navigateTo('wizard', sections[stepIndex].id);
      requestAnimationFrame(() => {
        const scope = els.wizardSteps;
        if (!scope) return;
        clearFieldValidation(scope);
        markValidationIssues(scope, result.issues, sections[stepIndex].id);
        focusFirstInvalidField(scope);
      });
    }
    return false;
  }

  function renderField(section, field, options = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'field-group' + (field.fullWidth ? ' field-full' : '');
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

    const labelRow = document.createElement('div');
    labelRow.className = 'field-label-row';
    labelRow.innerHTML = `
      <label for="${id}">${field.label}${field.required ? ' <span class="required">*</span>' : ''}</label>
      <div class="field-score" aria-live="polite"></div>
    `;
    wrap.appendChild(labelRow);

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.id = id;
      input.name = field.key;
      input.rows = field.key === 'skillsText' ? 2 : 3;
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.required) input.required = true;
      input.value = value;
      wrap.appendChild(input);
      const updateCounter = renderCharCounter(wrap, field, () => input.value);
      input.addEventListener('input', () => {
        setFieldValue(section, field, input.value, options.item, options.index);
        updateFieldScore(wrap, field, input.value);
        updateCounter();
        clearFieldValidation(wrap);
        debouncedUpdatePreviews();
        saveState();
      });
    } else if (field.type === 'select') {
      input = document.createElement('select');
      input.id = id;
      input.name = field.key;
      if (field.required) input.required = true;
      input.innerHTML = `<option value="">Selecione...</option>${(field.options || []).map((o) =>
        `<option value="${escapeAttr(o)}" ${value === o ? 'selected' : ''}>${escapeHtml(o)}</option>`
      ).join('')}`;
      wrap.appendChild(input);
      input.addEventListener('change', () => {
        setFieldValue(section, field, input.value, options.item, options.index);
        updateFieldScore(wrap, field, input.value);
        clearFieldValidation(wrap);
        debouncedUpdatePreviews();
        saveState();
      });
    } else {
      input = document.createElement('input');
      input.type = field.type || 'text';
      input.id = id;
      input.name = field.key;
      input.value = value;
      if (field.required) input.required = true;
      wrap.appendChild(input);
      input.addEventListener('input', () => {
        setFieldValue(section, field, input.value, options.item, options.index);
        updateFieldScore(wrap, field, input.value);
        clearFieldValidation(wrap);
        debouncedUpdatePreviews();
        saveState();
      });
      if (field.type === 'email' || field.type === 'url') {
        input.addEventListener('blur', () => {
          const result = EuGeroValidation.validateField(input.value, field);
          clearFieldValidation(wrap);
          if (!result.ok) {
            setFieldInvalid(input, fieldErrorId(section, field, options.index), result.message);
          }
        });
      }
    }

    wrap.insertAdjacentHTML('beforeend', renderFieldTip(field));
    updateFieldScore(wrap, field, value);
    return wrap;
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

  function renderSkillsTagsField(wrap, section, field, value, id) {
    const tags = EuGeroConfig.parseSkillsText(value || state.skillsText);

    wrap.innerHTML = `
      <div class="field-label-row">
        <label for="${id}">${field.label}${field.required ? ' <span class="required">*</span>' : ''}</label>
        <div class="field-score" aria-live="polite"></div>
      </div>
      <div class="skills-tags-field">
        <div class="skills-tags-chips" role="list"></div>
        <input type="text" id="${id}" class="skills-tags-input" placeholder="${escapeAttr(field.placeholder || 'Digite uma habilidade...')}" autocomplete="off">
      </div>
      ${renderFieldTip(field)}
    `;

    const chipsEl = wrap.querySelector('.skills-tags-chips');
    const input = wrap.querySelector('.skills-tags-input');

    function syncTags(newTags) {
      const text = newTags.map((t) => t.name || t).filter(Boolean).join('; ');
      state.skillsText = text;
      state.skills = newTags;
      updateFieldScore(wrap, field, text);
      clearFieldValidation(wrap);
      debouncedUpdatePreviews();
      saveState();
    }

    function renderChips() {
      chipsEl.innerHTML = tags.map((tag, i) => `
        <span class="skills-tag-chip" role="listitem">
          ${escapeHtml(tag.name || tag)}
          <button type="button" class="skills-tag-remove" aria-label="Remover ${escapeAttr(tag.name || tag)}" data-index="${i}">x</button>
        </span>
      `).join('');
      chipsEl.querySelectorAll('.skills-tag-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.index, 10);
          tags.splice(idx, 1);
          renderChips();
          syncTags(tags);
        });
      });
    }

    function addTag(raw) {
      const name = raw.trim().replace(/[;,]+$/, '');
      if (!name) return;
      if (tags.some((t) => (t.name || t).toLowerCase() === name.toLowerCase())) return;
      tags.push({ name });
      renderChips();
      syncTags(tags);
    }

    renderChips();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ';') {
        e.preventDefault();
        addTag(input.value);
        input.value = '';
      } else if (e.key === 'Backspace' && !input.value && tags.length) {
        tags.pop();
        renderChips();
        syncTags(tags);
      }
    });

    input.addEventListener('blur', () => {
      if (input.value.trim()) {
        addTag(input.value);
        input.value = '';
      }
    });

    updateFieldScore(wrap, field, value);
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

    if (items.length === 0) items.push(createEmptyListItem(section.id));

    items.forEach((item, index) => {
      listEl.appendChild(createListItemEl(section, item, index));
    });

    container.appendChild(listEl);

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-secondary btn-add-item';
    addBtn.textContent = '+ Adicionar item';
    addBtn.addEventListener('click', () => appendListItem(section.id));
    container.appendChild(addBtn);

    return container;
  }

  function createListItemEl(section, item, index) {
    const card = document.createElement('div');
    card.className = 'list-item-card';
    card.dataset.index = String(index);

    const header = document.createElement('div');
    header.className = 'list-item-header';
    header.innerHTML = `<span class="list-item-num">Item ${index + 1}</span>`;
    card.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'field-grid field-grid-item';

    section.itemFields.forEach((field) => {
      if (field.type === 'monthYear') {
        const wrap = document.createElement('div');
        wrap.className = 'field-group';
        wrap.dataset.section = section.id;
        wrap.dataset.field = field.key;
        const id = `field-${section.id}-${index}-${field.key}`;
        renderMonthYearField(wrap, section, field, item[field.key] || '', { id, index, item });
        grid.appendChild(wrap);
      } else {
        grid.appendChild(renderField(section, field, { item, index, id: `field-${section.id}-${index}-${field.key}` }));
      }
    });

    card.appendChild(grid);

    const actions = document.createElement('div');
    actions.className = 'list-item-actions';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'btn btn-ghost btn-icon btn-reorder-up';
    upBtn.setAttribute('aria-label', 'Mover para cima');
    upBtn.textContent = '\u2191';
    upBtn.disabled = index === 0;
    upBtn.addEventListener('click', () => {
      const idx = parseInt(card.dataset.index, 10);
      reorderListItem(section.id, idx, -1);
    });

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'btn btn-ghost btn-icon btn-reorder-down';
    downBtn.setAttribute('aria-label', 'Mover para baixo');
    downBtn.textContent = '\u2193';
    downBtn.addEventListener('click', () => {
      const idx = parseInt(card.dataset.index, 10);
      reorderListItem(section.id, idx, 1);
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-danger btn-remove-item';
    removeBtn.setAttribute('aria-label', 'Remover item');
    removeBtn.textContent = 'Remover';
    removeBtn.addEventListener('click', () => {
      const idx = parseInt(card.dataset.index, 10);
      removeListItem(section.id, idx);
    });

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(removeBtn);
    card.appendChild(actions);

    return card;
  }

  function reindexListCards(sectionId) {
    const container = document.getElementById(`list-items-${sectionId}`);
    if (!container) return;
    const cards = container.querySelectorAll('.list-item-card');
    cards.forEach((card, i) => {
      card.dataset.index = String(i);
      const num = card.querySelector('.list-item-num');
      if (num) num.textContent = `Item ${i + 1}`;
      const up = card.querySelector('.btn-reorder-up');
      const down = card.querySelector('.btn-reorder-down');
      if (up) up.disabled = i === 0;
      if (down) down.disabled = i === cards.length - 1;
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

  function renderReview() {
    const sections = activeSections();
    const results = EuGeroScoring.scoreState(state, sections, ACTION_VERBS);
    const pageFit = EuGeroScoring.scorePageFit(state, sections);
    const aggregate = EuGeroScoring.aggregateScore(results, pageFit);

    const pageFitClass = pageFit.level === 'overflow' ? 'page-fit-overflow' : pageFit.level === 'warning' ? 'page-fit-warning' : 'page-fit-ok';
    const pageFitLabel = pageFit.level === 'overflow' ? 'Excede 1 pagina' : pageFit.level === 'warning' ? 'Atencao ao tamanho' : 'Cabe em 1 pagina';

    const legendHtml = EuGeroScoring.CRITERIA_LEGEND.map((line) => `<li>${escapeHtml(line)}</li>`).join('');

    let html = `
      <div class="review-summary">
        <h2>Revisao final</h2>
        <div class="review-scores-row">
          <p class="review-overall-label">Qualidade: <strong>${aggregate.label}</strong> - ${aggregate.overall}%</p>
          <p class="review-page-fit ${pageFitClass}">${pageFitLabel} - ${pageFit.fitScore}%</p>
        </div>
        <div class="progress-bar" role="progressbar" aria-valuenow="${aggregate.overall}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" style="width: ${aggregate.overall}%"></div>
        </div>
        <p class="progress-text">${aggregate.scored} campos avaliados - ~${pageFit.metrics.totalChars} caracteres - ${pageFit.metrics.listItems} itens em listas</p>
        <details class="review-criteria-legend">
          <summary>Como funciona a pontuacao?</summary>
          <ul>${legendHtml}</ul>
        </details>
      </div>
    `;

    if (pageFit.issues.length > 0) {
      html += `
        <div class="review-page-issues ${pageFitClass}">
          <h3>Curriculo de uma pagina</h3>
          <p>O objetivo e um CV conciso. Conteudo demais reduz a nota e pode sobrepor secoes na exportacao.</p>
          <ul>${pageFit.issues.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
        </div>
      `;
    }

    if (aggregate.weakFields.length > 0) {
      html += `
        <div class="review-weak">
          <h3>Campos para revisar (nota Fraco)</h3>
          <ul>
            ${aggregate.weakFields.map((f) => {
              const stepIndex = sections.findIndex((s) => s.id === f.sectionId);
              return `<li><button type="button" class="link-btn" data-step="${stepIndex}">${escapeHtml(f.displayName)}</button></li>`;
            }).join('')}
          </ul>
        </div>
      `;
    } else if (pageFit.level === 'ok') {
      html += '<p class="review-success">Parabens! Nenhum campo com nota Fraco e volume adequado para 1 pagina.</p>';
    }

    html += `
      <div class="export-actions">
        <h3>Exportar - template: <span data-current-template>${escapeHtml(TEMPLATES[state.template]?.name || 'Classico')}</span></h3>
        <div class="btn-group">
          <button type="button" class="btn btn-primary" id="btn-export-pdf">Exportar PDF</button>
          <button type="button" class="btn btn-primary" id="btn-export-docx">Exportar Word</button>
          <button type="button" class="btn btn-primary" id="btn-export-txt">Exportar TXT</button>
        </div>
      </div>
    `;

    els.reviewContent.innerHTML = html;

    els.reviewContent.querySelectorAll('.link-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        goToWizard(parseInt(btn.dataset.step, 10));
      });
    });

    document.getElementById('btn-export-pdf')?.addEventListener('click', (e) => handleExport('pdf', e.currentTarget));
    document.getElementById('btn-export-docx')?.addEventListener('click', (e) => handleExport('docx', e.currentTarget));
    document.getElementById('btn-export-txt')?.addEventListener('click', (e) => handleExport('txt', e.currentTarget));

    renderReviewTemplateGallery();
  }

  async function handleExport(type, btn) {
    if (!btn) return;
    if (!validateForExport()) return;

    if (typeof EuGeroLibs !== 'undefined' && type !== 'txt') {
      try {
        const caps = await EuGeroLibs.probeAll();
        const msgs = EuGeroLibs.missingMessages(caps, type);
        if (msgs.length) {
          showToast(msgs.join(' '), { duration: 7000, error: true });
          return;
        }
      } catch (e) {
        /* continue and let export report error */
      }
    }

    btn.disabled = true;
    btn.classList.add('is-loading');
    try {
      let result;
      if (type === 'pdf') result = await EuGeroExport.exportPdf(state, state.template);
      else if (type === 'docx') result = await EuGeroExport.exportDocx(state, state.template);
      else result = EuGeroExport.exportTxt(state);

      if (result?.ok) {
        showToast('Exportado com sucesso!');
      } else {
        showToast(result?.error || 'Falha na exportacao.', { error: true });
      }
    } catch (err) {
      showToast('Falha na exportacao.', { error: true });
    } finally {
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  }

  function renderReviewTemplateGallery() {
    if (!els.reviewTemplateGallery) return;
    const sections = activeSections();

    els.reviewTemplateGallery.innerHTML = TEMPLATE_IDS.map((id) => {
      const t = TEMPLATES[id];
      const selected = state.template === id;
      const atsBadge = t.atsFriendly
        ? '<span class="badge badge-ats">ATS</span>'
        : '<span class="badge badge-ats-warn">Atencao ATS</span>';
      return `
        <button type="button" class="review-template-card${selected ? ' selected' : ''}" data-template="${t.id}" aria-pressed="${selected}">
          <span class="review-template-name">${escapeHtml(t.name)} ${atsBadge}</span>
          <div class="review-template-preview-wrap">
            <div class="review-template-preview" data-preview-template="${t.id}"></div>
          </div>
        </button>
      `;
    }).join('');

    els.reviewTemplateGallery.querySelectorAll('[data-preview-template]').forEach((container) => {
      EuGeroPreview.updatePreview(container, state, container.dataset.previewTemplate, sections);
    });

    els.reviewTemplateGallery.querySelectorAll('.review-template-card').forEach((card) => {
      card.addEventListener('click', () => {
        switchTemplate(card.dataset.template);
        renderReview();
      });
    });

    requestAnimationFrame(scaleReviewPreviews);
  }

  function scaleReviewPreviews() {
    document.querySelectorAll('.review-template-preview-wrap').forEach((wrap) => {
      const preview = wrap.querySelector('.review-template-preview');
      if (!preview) return;
      const width = wrap.clientWidth;
      if (width <= 0) return;
      const scale = width / REVIEW_PREVIEW_BASE_WIDTH;
      preview.style.width = `${REVIEW_PREVIEW_BASE_WIDTH}px`;
      preview.style.transform = `scale(${scale})`;
      preview.style.transformOrigin = 'top left';
      wrap.style.height = `${(297 / 210) * width}px`;
    });
  }

  function updateAllPreviews() {
    const sections = activeSections();
    document.querySelectorAll('[data-preview]').forEach((container) => {
      EuGeroPreview.updatePreview(container, state, state.template, sections);
    });
    updateMobilePreviewDock();
    updateTemplatePreviewMinis();
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
    handleExport,
    debouncedUpdatePreviews
  };

  document.addEventListener('DOMContentLoaded', init);
})();
