/**
 * Telas de entrada: seleção de personagens, escolha de template e seções.
 * Recebe o contexto compartilhado do app via init(ctx).
 */
const EuGeroStartScreen = (function () {
  'use strict';

  const {
    SECTIONS, TEMPLATES, TEMPLATE_IDS,
    normalizeEnabledSections, isSectionMandatory
  } = EuGeroConfig;

  let ctx = null;

  function init(context) {
    ctx = context;
  }

  function renderCharacterGrid() {
    const grid = document.getElementById('character-grid');
    if (!grid || typeof EuGeroCharacters === 'undefined') return;
    grid.innerHTML = EuGeroCharacters.CHARACTERS.map((c) => `
      <button type="button" class="character-card${c.state ? '' : ' character-card-blank'}" data-character="${c.id}">
        <span class="character-avatar" aria-hidden="true">${ctx.escapeHtml(c.initials)}</span>
        <span class="character-kicker">${ctx.escapeHtml(c.tagline)}</span>
        <span class="character-name">${ctx.escapeHtml(c.name)}</span>
        <span class="character-role">${ctx.escapeHtml(c.role)}</span>
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
      ctx.replaceState(EuGeroStorage.mergeWithDefaults(JSON.parse(JSON.stringify(character.state))));
      ctx.showToast(`Currículo de exemplo carregado: ${character.name}. Edite à vontade!`);
    } else {
      ctx.replaceState(EuGeroStorage.mergeWithDefaults(EuGeroConfig.createEmptyState()));
      ctx.showToast('Página em branco pronta. Vamos montar o seu!');
    }
    ctx.saveState();
    ctx.goToStart();
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
        : `<span class="badge badge-ats-warn" title="${ctx.escapeAttr(t.atsNote || 'Layout pode afetar leitura ATS')}">Atenção ATS</span>`;
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
        const atsNote = t.atsFriendly ? 'Compativel com ATS' : (t.atsNote || 'Atenção ATS');
        return `<button type="button" class="modal-template-option" data-template="${t.id}"><strong>${ctx.escapeHtml(t.name)}</strong><span>${ctx.escapeHtml(t.description)} - ${ctx.escapeHtml(atsNote)}</span></button>`;
      }).join('');
    }

    document.querySelectorAll('.template-card').forEach((card) => {
      card.addEventListener('click', () => pickTemplate(card.dataset.template));
    });

    updateTemplatePreviewMinis();
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
    const els = ctx.els;
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

  function toggleSection(sectionId, checked) {
    if (isSectionMandatory(sectionId)) return;
    const state = ctx.getState();
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
    renderTemplatePickers,
    updateTemplatePreviewMinis,
    renderSectionChecklist
  };
})();
