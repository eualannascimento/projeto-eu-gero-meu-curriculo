/**
 * Tela de revisão: pontuação agregada, galeria de templates e exportação.
 * Recebe o contexto compartilhado do app via init(ctx).
 */
const EuGeroReviewScreen = (function () {
  'use strict';

  const { TEMPLATES, TEMPLATE_IDS, ACTION_VERBS } = EuGeroConfig;

  let ctx = null;
  let reviewGalleryIndex = 0;

  function init(context) {
    ctx = context;
  }

  function syncGalleryToTemplate() {
    const state = ctx.getState();
    const idx = TEMPLATE_IDS.indexOf(state.template);
    reviewGalleryIndex = idx >= 0 ? idx : 0;
  }

  function galleryStep(dir) {
    // Navegar ja aplica o modelo (sem precisar de "Usar este").
    const state = ctx.getState();
    const total = TEMPLATE_IDS.length;
    reviewGalleryIndex = ((reviewGalleryIndex + dir) % total + total) % total;
    state.template = TEMPLATE_IDS[reviewGalleryIndex];
    ctx.saveState();
    ctx.updateTemplateIndicators();
    ctx.debouncedUpdatePreviews();
    renderReviewGallery();
  }

  function renderReview() {
    const state = ctx.getState();
    const sections = ctx.activeSections();
    const results = EuGeroScoring.scoreState(state, sections, ACTION_VERBS);
    const pageFit = EuGeroScoring.scorePageFit(state, sections);
    const aggregate = EuGeroScoring.aggregateScore(results, pageFit);

    const pct = aggregate.overall;
    let scoreLabel = 'Em progresso';
    let scoreMsg = 'Vamos reforçar alguns pontos para dar mais peso ao seu currículo.';
    if (pct >= 80) {
      scoreLabel = 'Ótimo';
      scoreMsg = 'Seu currículo está forte e bem estruturado. Pronto para enviar!';
    } else if (pct >= 55) {
      scoreLabel = 'Bom';
      scoreMsg = 'Está bom! Uns pequenos ajustes deixam ele ainda mais forte.';
    }

    const muted = 'color-mix(in srgb, var(--color-text) 55%, transparent)';
    let html = `
      <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
        <div>
          <div style="font-family: var(--font-heading); font-weight: 600; font-size: 44px; line-height: 1; color: var(--color-accent-700);">${ctx.escapeHtml(scoreLabel)}</div>
          <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: ${muted}; margin-top: 4px;">Qualidade geral</div>
        </div>
        <div style="flex: 1; min-width: 240px;">
          <div style="height: 8px; background: var(--color-neutral-200); position: relative; overflow: hidden; margin-bottom: 12px;">
            <div style="position: absolute; inset: 0 auto 0 0; width: ${pct}%; background: var(--color-accent);"></div>
          </div>
          <p style="font-size: 14px; line-height: 1.5; color: color-mix(in srgb, var(--color-text) 78%, transparent); margin: 0;">${ctx.escapeHtml(scoreMsg)}</p>
        </div>
      </div>`;

    if (aggregate.weakFields.length > 0) {
      html += `
        <div style="margin-top: 18px; border-top: 1px solid var(--color-divider); padding-top: 16px;">
          <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: ${muted}; margin: 0 0 10px;">Sugestões para melhorar</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${aggregate.weakFields.map((f) => {
              const stepIndex = sections.findIndex((s) => s.id === f.sectionId);
              return `<button type="button" class="link-btn" data-step="${stepIndex}" style="display: flex; align-items: center; gap: 10px; text-align: left; background: none; border: 0; padding: 4px 0; cursor: pointer; color: inherit; font-size: 14px;"><span style="color: var(--color-accent);">→</span>Reforce: ${ctx.escapeHtml(f.displayName)}</button>`;
            }).join('')}
          </div>
        </div>`;
    }

    ctx.els.reviewContent.innerHTML = html;

    ctx.els.reviewContent.querySelectorAll('.link-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        ctx.goToWizard(parseInt(btn.dataset.step, 10));
      });
    });

    renderReviewGallery();
  }

  function renderReviewGallery() {
    const state = ctx.getState();
    const sections = ctx.activeSections();
    const total = TEMPLATE_IDS.length;
    reviewGalleryIndex = ((reviewGalleryIndex % total) + total) % total;
    const galId = TEMPLATE_IDS[reviewGalleryIndex];
    const galMeta = TEMPLATES[galId];
    const isSelected = state.template === galId;

    const preview = document.getElementById('review-gallery-preview');
    if (preview) EuGeroPreview.updatePreview(preview, state, galId, sections);
    const frame = document.getElementById('review-gallery-frame');
    if (frame) frame.style.outline = isSelected ? '2px solid var(--color-accent)' : '2px solid transparent';
    const labelEl = document.getElementById('review-gallery-label');
    if (labelEl) labelEl.textContent = galMeta.name;
    const counterEl = document.getElementById('review-gallery-counter');
    if (counterEl) counterEl.textContent = `${reviewGalleryIndex + 1} de ${total}`;
  }

  /**
   * PDF identico a previa: renderiza o mesmo HTML da previa em tamanho A4
   * e abre a impressao do navegador (Salvar como PDF).
   */
  function printCv() {
    const state = ctx.getState();
    const el = document.getElementById('print-cv');
    if (!el) return;
    el.innerHTML = EuGeroPreview.render(state, state.template, ctx.activeSections());
    el.className = `preview-content template-${state.template} cv-margin-${state.margin || 'padrao'} cv-density-${state.density || 'normal'}`;
    ctx.showToast('Na janela de impressão, escolha "Salvar como PDF".', { duration: 4000 });
    setTimeout(() => window.print(), 150);
  }

  async function handleExport(type, btn) {
    if (!btn) return;
    const state = ctx.getState();
    btn.disabled = true;
    btn.classList.add('is-loading');
    try {
      let result;
      if (type === 'pdf') result = await EuGeroExport.exportPdf(state, state.template);
      else if (type === 'docx') result = await EuGeroExport.exportDoc(state);
      else result = EuGeroExport.exportTxt(state);

      if (result?.ok) {
        ctx.showToast('Exportado com sucesso!');
      } else {
        ctx.showToast(result?.error || 'Falha na exportacao.', { error: true });
      }
    } catch (err) {
      ctx.showToast('Falha na exportacao.', { error: true });
    } finally {
      btn.disabled = false;
      btn.classList.remove('is-loading');
    }
  }

  function renderReviewTemplateGallery() {
    const state = ctx.getState();
    if (!ctx.els.reviewTemplateGallery) return;
    const sections = ctx.activeSections();

    ctx.els.reviewTemplateGallery.innerHTML = TEMPLATE_IDS.map((id) => {
      const t = TEMPLATES[id];
      const selected = state.template === id;
      const atsBadge = t.atsFriendly
        ? '<span class="badge badge-ats">ATS</span>'
        : '<span class="badge badge-ats-warn">Atencao ATS</span>';
      return `
        <button type="button" class="review-template-card${selected ? ' selected' : ''}" data-template="${t.id}" aria-pressed="${selected}">
          <span class="review-template-name">${ctx.escapeHtml(t.name)} ${atsBadge}</span>
          <div class="review-template-preview-wrap">
            <div class="review-template-preview" data-preview-template="${t.id}"></div>
          </div>
        </button>
      `;
    }).join('');

    ctx.els.reviewTemplateGallery.querySelectorAll('[data-preview-template]').forEach((container) => {
      EuGeroPreview.updatePreview(container, state, container.dataset.previewTemplate, sections);
    });

    ctx.els.reviewTemplateGallery.querySelectorAll('.review-template-card').forEach((card) => {
      card.addEventListener('click', () => {
        ctx.switchTemplate(card.dataset.template);
        renderReview();
      });
    });

    requestAnimationFrame(ctx.scaleReviewPreviews);
  }

  return {
    init,
    syncGalleryToTemplate,
    galleryStep,
    renderReview,
    renderReviewGallery,
    renderReviewTemplateGallery,
    printCv,
    handleExport
  };
})();
