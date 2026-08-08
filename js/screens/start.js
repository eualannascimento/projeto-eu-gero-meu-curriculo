/**
 * Telas de entrada: seleção de personagens, escolha de template e seções.
 * Recebe o contexto compartilhado do app via init(ctx).
 */
const EuGeroStartScreen = (function () {
  'use strict';

  const {
    SECTIONS, TEMPLATES, TEMPLATE_IDS,
    normalizeEnabledSections, isSectionMandatory, moveEnabledSection
  } = EuGeroConfig;

  let ctx = null;

  function init(context) {
    ctx = context;
  }

  function renderCharacterGrid() {
    const grid = document.getElementById('character-grid');
    if (!grid || typeof EuGeroCharacters === 'undefined') return;
    const corners = `<i class="corner tl" aria-hidden="true"></i><i class="corner tr" aria-hidden="true"></i><i class="corner bl" aria-hidden="true"></i><i class="corner br" aria-hidden="true"></i>`;
    const cards = EuGeroCharacters.CHARACTERS.map((c) => `
      <button type="button" class="character-card${c.state ? '' : ' character-card-blank'}" data-character="${c.id}">
        ${corners}
        <span class="character-avatar" aria-hidden="true"${c.avatarColor ? ` data-avatar-color="${ctx.escapeAttr(c.avatarColor)}"` : ''}>${ctx.escapeHtml(c.initials)}</span>
        <span class="character-kicker">${ctx.escapeHtml(c.tagline)}</span>
        <span class="character-name">${ctx.escapeHtml(c.name)}</span>
        <span class="character-role">${ctx.escapeHtml(c.role)}</span>
        <span class="character-cta">Escolher →</span>
      </button>
    `);
    const draft = EuGeroStorage.loadDraft();
    const resumeDraftCard = EuGeroStorage.hasContent(draft) ? `
      <button type="button" class="character-card character-card-blank" id="btn-resume-draft">
        ${corners}
        <span class="character-avatar" aria-hidden="true">↺</span>
        <span class="character-kicker">Rascunho neste dispositivo</span>
        <span class="character-name">Continuar de onde parei</span>
        <span class="character-role">Retome o currículo salvo neste navegador.</span>
        <span class="character-cta">Continuar →</span>
      </button>
    ` : '';
    const importedDraftCard = ctx.hasPendingImportedDraft?.() ? `
      <button type="button" class="character-card character-card-blank" id="btn-continue-imported-draft">
        ${corners}
        <span class="character-avatar" aria-hidden="true">&#8593;</span>
        <span class="character-kicker">Rascunho importado</span>
        <span class="character-name">Continuar rascunho importado</span>
        <span class="character-role">Revise e complete os dados carregados do arquivo.</span>
        <span class="character-cta">Continuar &#8594;</span>
      </button>
    ` : '';
    const importDraftCard = `
      <button type="button" class="character-card character-card-blank" id="btn-import-characters">
        ${corners}
        <span class="character-avatar" aria-hidden="true">↑</span>
        <span class="character-kicker">Já tenho um rascunho</span>
        <span class="character-name">Continuar de onde parei</span>
        <span class="character-role">Carregue um rascunho salvo (.json) e continue de onde parou.</span>
        <span class="character-cta">Carregar arquivo →</span>
      </button>
    `;
    cards.splice(1, 0, importedDraftCard, resumeDraftCard, importDraftCard);
    grid.innerHTML = cards.join('');
    grid.querySelectorAll('[data-avatar-color]').forEach((el) => {
      el.style.background = el.dataset.avatarColor;
    });
    grid.querySelectorAll('.character-card[data-character]').forEach((card) => {
      card.addEventListener('click', () => pickCharacter(card.dataset.character));
    });
    grid.querySelector('#btn-resume-draft')?.addEventListener('click', () => ctx.resumeDraft());
    grid.querySelector('#btn-continue-imported-draft')?.addEventListener('click', () => ctx.continueImportedDraft());
  }

  function pickCharacter(id) {
    const character = EuGeroCharacters.getById(id);
    if (!character) return;
    if (character.state) {
      // Cópia profunda para não mutar o módulo de personagens.
      ctx.replaceState(EuGeroStorage.mergeWithDefaults(JSON.parse(JSON.stringify(character.state))));
    } else {
      ctx.replaceState(EuGeroStorage.mergeWithDefaults(EuGeroConfig.createEmptyState()));
    }
    ctx.saveState();
    ctx.goToStart();
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

  function renderTemplatePickers() {
    // A cor de destaque e a unica coisa dinamica da miniatura. Ela vai num
    // data-* e e aplicada depois por CSSOM (aplicarAcentoDasMiniaturas), porque
    // atributo style e barrado pela CSP e elemento.style nao e. A geometria toda
    // mora em css/screens.css.
    const getThumbMarkup = (layout, id) => {
      const accent = TEMPLATES[id]?.thumbAccent || '#334155';
      const raiz = `data-thumb-accent="${ctx.escapeAttr(accent)}"`;
      if (layout === 'sidebar') {
        return `
          <div class="thumb-sidebar thumb-accent-bg" ${raiz}></div>
          <div class="thumb-main">
            <div class="thumb-line thumb-line-h4 thumb-line-strong thumb-line-w80"></div>
            <div class="thumb-line thumb-line-soft thumb-line-w100"></div>
            <div class="thumb-line thumb-line-soft thumb-line-w90"></div>
            <div class="thumb-line thumb-line-soft thumb-line-w40"></div>
          </div>
        `;
      }
      if (layout === 'banner') {
        return `
          <div class="thumb-col">
            <div class="thumb-banner thumb-accent-bg" ${raiz}></div>
            <div class="thumb-main">
              <div class="thumb-line thumb-line-strong thumb-line-w60"></div>
              <div class="thumb-line thumb-line-soft thumb-line-w90"></div>
              <div class="thumb-line thumb-line-soft thumb-line-w40"></div>
            </div>
          </div>
        `;
      }
      if (layout === 'left') {
        return `
          <div class="thumb-col thumb-col-pad thumb-col-left">
            <div class="thumb-line thumb-line-h5 thumb-accent-bg thumb-line-w50 thumb-line-gap" ${raiz}></div>
            <div class="thumb-line thumb-line-strong thumb-line-w90"></div>
            <div class="thumb-line thumb-line-soft thumb-line-w80"></div>
            <div class="thumb-line thumb-line-soft thumb-line-w95"></div>
          </div>
        `;
      }
      // A família Clássico usa a estrutura centralizada.
      const isCreative = layout === 'creative';
      const topo = isCreative
        ? `<div class="thumb-creative-head">
             <div class="thumb-creative-mark thumb-accent-bg" ${raiz}></div>
             <div class="thumb-line thumb-line-h5 thumb-accent-bg thumb-line-w34px" ${raiz}></div>
           </div>`
        : `<div class="thumb-line thumb-line-h5 thumb-accent-bg thumb-line-w60 thumb-line-gap" ${raiz}></div>`;
      return `
        <div class="thumb-col thumb-col-pad ${isCreative ? 'thumb-col-left' : 'thumb-col-center'}">
          ${topo}
          <div class="thumb-line thumb-line-strong thumb-line-w40"></div>
          <div class="thumb-line thumb-line-soft thumb-line-w80 thumb-line-top"></div>
          <div class="thumb-line thumb-line-soft thumb-line-w90"></div>
        </div>
      `;
    };

    const cardHtml = (t) => {
      const atsBadge = t.atsFriendly
        ? '<span class="badge badge-ats">Estrutura favorável a ATS</span>'
        : `<span class="badge badge-ats-warn" title="${ctx.escapeAttr(t.atsNote || 'A leitura pode variar conforme o sistema ATS.')}">Pode dificultar a leitura por ATS</span>`;
      return `
        <button type="button" class="template-card" data-template="${t.id}" aria-label="Template ${ctx.escapeAttr(t.name)}">
          <div class="template-thumb ${t.thumbClass}">${getThumbMarkup(t.layout, t.id)}</div>
          <span class="template-card-name">${ctx.escapeHtml(t.name)} ${atsBadge}</span>
          <small class="template-card-desc">${ctx.escapeHtml(t.description)}</small>
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
        const atsNote = t.atsFriendly ? 'Estrutura simples e favorável à leitura por ATS' : (t.atsNote || 'Pode dificultar a leitura por ATS');
        return `<button type="button" class="modal-template-option" data-template="${t.id}"><strong>${ctx.escapeHtml(t.name)}</strong><span>${ctx.escapeHtml(t.description)} - ${ctx.escapeHtml(atsNote)}</span></button>`;
      }).join('');
    }

    aplicarAcentoDasMiniaturas();

    document.querySelectorAll('.template-card').forEach((card) => {
      card.addEventListener('click', () => pickTemplate(card.dataset.template));
    });

    updateTemplatePreviewMinis();
  }

  // A CSP barra o atributo style, inclusive quando ele chega por innerHTML,
  // mas nao barra elemento.style. Por isso a cor sai do markup e entra aqui.
  function aplicarAcentoDasMiniaturas() {
    document.querySelectorAll('[data-thumb-accent]').forEach((el) => {
      el.style.setProperty('--thumb-accent', el.dataset.thumbAccent);
    });
  }

  function updateTemplatePreviewMinis() {
    const state = ctx.getState();
    document.querySelectorAll('[data-template-preview]').forEach((container) => {
      EuGeroPreview.updatePreview(container, state, container.dataset.templatePreview, ctx.activeSections());
    });
  }

  function pickTemplate(templateId) {
    const state = ctx.getState();
    state.template = templateId;
    document.querySelectorAll('.template-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.template === templateId);
    });
    ctx.updateTemplateIndicators();
    ctx.debouncedUpdatePreviews();
    ctx.saveState();
  }

  function renderSectionChecklist() {
    const state = ctx.getState();
    if (!ctx.els.sectionChecklist) return;
    const orderedSections = EuGeroConfig.getActiveSections(state.enabledSections)
      .concat(SECTIONS.filter((section) => !state.enabledSections.includes(section.id)));
    ctx.els.sectionChecklist.innerHTML = orderedSections.map((section) => {
      const mandatory = isSectionMandatory(section.id);
      const checked = state.enabledSections.includes(section.id) || mandatory;
      return `
        <label class="section-check ${mandatory ? 'section-check-mandatory' : ''} ${checked ? 'section-check-enabled' : ''}" data-section-row="${section.id}" ${!mandatory && checked ? 'draggable="true"' : ''}>
          ${!mandatory && checked ? '<span class="section-drag-handle" aria-label="Arraste para reordenar" title="Arraste para reordenar">⠿</span>' : '<span class="section-drag-spacer" aria-hidden="true"></span>'}
          <input type="checkbox" data-section-id="${section.id}" ${checked ? 'checked' : ''} ${mandatory ? 'disabled checked' : ''} class="section-check-box">
          <span class="section-check-label section-check-row">
            <strong class="section-check-title">${section.title}</strong>
            <span class="section-check-tag">${mandatory ? 'Sempre incluída' : 'Opcional'}</span>
          </span>
          ${!mandatory && checked ? `<span class="section-move-actions"><button type="button" data-move-section="${section.id}" data-direction="up" aria-label="Subir ${section.title}">↑</button><button type="button" data-move-section="${section.id}" data-direction="down" aria-label="Descer ${section.title}">↓</button></span>` : ''}
        </label>
      `;
    }).join('');

    ctx.els.sectionChecklist.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.addEventListener('change', () => toggleSection(input.dataset.sectionId, input.checked));
    });
    ctx.els.sectionChecklist.querySelectorAll('[data-move-section]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        moveSection(button.dataset.moveSection, button.dataset.direction);
      });
    });
    bindSectionReorder();
  }

  function moveSection(sectionId, direction) {
    const state = ctx.getState();
    const active = state.enabledSections;
    const index = active.indexOf(sectionId);
    const targetId = active[index + (direction === 'up' ? -1 : 1)];
    if (!targetId || targetId === 'personal') return;
    state.enabledSections = moveEnabledSection(state.enabledSections, sectionId, targetId, direction === 'down');
    ctx.saveState();
    renderSectionChecklist();
    ctx.debouncedUpdatePreviews();
  }

  function bindSectionReorder() {
    const list = ctx.els.sectionChecklist;
    let draggedId = null;
    list.querySelectorAll('[data-section-row]').forEach((row) => {
      row.addEventListener('dragstart', (event) => {
        draggedId = row.dataset.sectionRow;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedId);
        row.classList.add('section-check-dragging');
      });
      row.addEventListener('dragend', () => {
        draggedId = null;
        list.querySelectorAll('.section-check-drop-before, .section-check-drop-after, .section-check-dragging').forEach((item) => item.classList.remove('section-check-drop-before', 'section-check-drop-after', 'section-check-dragging'));
      });
      row.addEventListener('dragover', (event) => {
        if (!draggedId || row.dataset.sectionRow === 'personal' || !row.classList.contains('section-check-enabled')) return;
        event.preventDefault();
        const after = event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
        row.classList.toggle('section-check-drop-before', !after);
        row.classList.toggle('section-check-drop-after', after);
      });
      row.addEventListener('dragleave', () => row.classList.remove('section-check-drop-before', 'section-check-drop-after'));
      row.addEventListener('drop', (event) => {
        event.preventDefault();
        const targetId = row.dataset.sectionRow;
        if (!draggedId || !targetId || draggedId === targetId || targetId === 'personal') return;
        const state = ctx.getState();
        const after = event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
        state.enabledSections = moveEnabledSection(state.enabledSections, draggedId, targetId, after);
        ctx.saveState();
        renderSectionChecklist();
        ctx.debouncedUpdatePreviews();
      });
    });
  }

  function toggleSection(sectionId, checked) {
    const state = ctx.getState();
    if (isSectionMandatory(sectionId)) return;
    let enabled = [...state.enabledSections];
    if (checked && !enabled.includes(sectionId)) {
      enabled.push(sectionId);
    } else if (!checked) {
      enabled = enabled.filter((id) => id !== sectionId);
    }
    state.enabledSections = normalizeEnabledSections(enabled);
    const maxStep = ctx.activeSections().length - 1;
    if (state.currentStep > maxStep) state.currentStep = Math.max(0, maxStep);
    ctx.saveState();
    renderSectionChecklist();
    ctx.debouncedUpdatePreviews();
  }
  return {
    init,
    renderCharacterGrid,
    pickCharacter,
    renderTemplatePickers,
    updateTemplatePreviewMinis,
    pickTemplate,
    renderSectionChecklist,
    toggleSection
  };
})();
