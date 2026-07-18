/**
 * Tela de revisão: pontuação, galeria de templates e exportação.
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

  function renderReview() {
    const state = ctx.getState();
    const sections = ctx.activeSections();
    const results = EuGeroScoring.scoreState(state, sections, ACTION_VERBS);
    const pageFit = EuGeroScoring.scorePageFit(state, sections);
    const aggregate = EuGeroScoring.aggregateScore(results, pageFit);

    const pct = aggregate.overall;
    let scoreLabel = 'Em andamento';
    let scoreMsg = 'Algumas seções ainda podem ser preenchidas ou revisadas.';
    if (pct >= 80) {
      scoreLabel = 'Muito bem preenchido';
      scoreMsg = 'As principais seções estão preenchidas. Faça uma última revisão antes de enviar.';
    } else if (pct >= 55) {
      scoreLabel = 'Bem preenchido';
      scoreMsg = 'O currículo está organizado. Revise os pontos indicados antes de finalizar.';
    }

    const muted = 'color-mix(in srgb, var(--color-text) 55%, transparent)';
    let html = `
      <p style="font-size: 12.5px; line-height: 1.5; color: ${muted}; margin: 0 0 16px;">Esta análise considera apenas o preenchimento do currículo. Ela não avalia seu perfil nem garante resultados em processos seletivos.</p>
      <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
        <div>
          <div style="font-family: var(--font-heading); font-weight: 600; font-size: 44px; line-height: 1; color: var(--color-accent-700);">${ctx.escapeHtml(scoreLabel)}</div>
          <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: ${muted}; margin-top: 4px;">Nível de preenchimento</div>
        </div>
        <div style="flex: 1; min-width: 240px;">
          <div style="height: 8px; background: var(--color-neutral-200); position: relative; overflow: hidden; margin-bottom: 12px;">
            <div style="position: absolute; inset: 0 auto 0 0; width: ${pct}%; background: var(--color-accent);"></div>
          </div>
          <p style="font-size: 14px; line-height: 1.5; color: color-mix(in srgb, var(--color-text) 78%, transparent); margin: 0;">${ctx.escapeHtml(scoreMsg)}</p>
        </div>
      </div>`;

    // Quadro por secao: o que ja esta preenchido e o que reforcar, com dica especifica.
    const feedback = EuGeroScoring.buildSectionFeedback(state, sections, ACTION_VERBS);
    const STATUS_META = {
      otimo: { label: 'Bem preenchida', cls: 'rf-otimo' },
      bom: { label: 'Parcialmente preenchida', cls: 'rf-bom' },
      fraco: { label: 'Pouco preenchida', cls: 'rf-fraco' },
      vazio: { label: 'Sem conteúdo', cls: 'rf-vazio' }
    };

    html += `
      <div style="margin-top: 18px; border-top: 1px solid var(--color-divider); padding-top: 14px;">
        <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: ${muted}; margin: 0 0 10px;">Preenchimento por seção</p>
        <div class="review-feedback">
          ${feedback.map((f) => {
            const meta = STATUS_META[f.status] || STATUS_META.bom;
            const stepIndex = sections.findIndex((s) => s.id === f.sectionId);
            const tips = f.tips.map((t) =>
              `<button type="button" class="rf-tip link-btn" data-step="${stepIndex}">${ctx.escapeHtml(t.label)}: ${ctx.escapeHtml(t.advice)}</button>`
            ).join('');
            return `
              <div class="review-feedback-row">
                <button type="button" class="rf-head link-btn" data-step="${stepIndex}">
                  <span class="rf-badge ${meta.cls}">${meta.label}</span>
                  <span class="rf-title">${ctx.escapeHtml(f.title)}</span>
                </button>
                ${tips ? `<div class="rf-tips">${tips}</div>` : ''}
              </div>`;
          }).join('')}
        </div>
      </div>`;

    // Painel de leitura por ATS: considera apenas a estrutura do modelo escolhido.
    const currentTemplate = TEMPLATES[state.template];
    const atsStatusLabel = currentTemplate?.atsFriendly ? 'Estrutura favorável' : 'Revise a estrutura';
    const atsStatusDesc = currentTemplate?.atsFriendly
      ? 'O modelo escolhido usa uma organização simples, que costuma facilitar a leitura automática.'
      : 'Para plataformas de recrutamento, um modelo de uma coluna e sem elementos gráficos costuma ser mais seguro.';
    const atsChecklist = [
      'Use títulos claros para cada seção.',
      'Mantenha as datas no formato mês e ano.',
      'Use o mesmo idioma da vaga.',
      'Evite foto e informações importantes dentro de imagens.',
      'Confirme se o texto do PDF pode ser selecionado e copiado.',
      'Depois do envio, revise os dados importados pela plataforma.'
    ];
    html += `
      <div style="margin-top: 18px; border-top: 1px solid var(--color-divider); padding-top: 14px;">
        <p style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: ${muted}; margin: 0 0 6px;">Leitura por ATS</p>
        <p style="font-size: 12.5px; line-height: 1.5; color: ${muted}; margin: 0 0 10px;">Esta verificação considera apenas a estrutura e a organização do currículo. Ela não garante aprovação nem substitui o preenchimento dos campos da plataforma.</p>
        <div style="display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
          <span class="rf-badge ${currentTemplate?.atsFriendly ? 'rf-otimo' : 'rf-fraco'}">${ctx.escapeHtml(atsStatusLabel)}</span>
          <span style="font-size: 13.5px; color: color-mix(in srgb, var(--color-text) 78%, transparent);">${ctx.escapeHtml(atsStatusDesc)}</span>
        </div>
        <p style="font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: ${muted}; margin: 0 0 6px;">Antes de enviar</p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.7; color: color-mix(in srgb, var(--color-text) 78%, transparent);">
          ${atsChecklist.map((item) => `<li>${ctx.escapeHtml(item)}</li>`).join('')}
        </ul>
      </div>`;

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
  /** Nome-base do arquivo: CV_<NOME>_<CARGO>, sem acento nem simbolo. */

  function cvFileBaseName() {
    const state = ctx.getState();
    const clean = (t) => (t || '')
      .normalize('NFD').replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const nome = clean(state.personal?.fullName) || 'Curriculo';
    const cargo = clean(state.personal?.headline);
    return cargo ? `CV_${nome}_${cargo}` : `CV_${nome}`;
  }

  function printCv() {
    const state = ctx.getState();
    const el = document.getElementById('print-cv');
    if (!el) return;
    el.innerHTML = EuGeroPreview.render(state, state.template, ctx.activeSections(), 'export');
    el.className = `preview-content template-${state.template} cv-margin-${state.margin || 'padrao'} cv-density-${state.density || 'normal'}`;
    // O nome sugerido no "Salvar como PDF" vem do titulo da pagina: CV_<NOME>_<CARGO>.
    const prevTitle = document.title;
    document.title = cvFileBaseName();
    const restore = () => {
      document.title = prevTitle;
      window.removeEventListener('afterprint', restore);
      ctx.showToast('Ao enviar o currículo para uma plataforma de vagas, revise os campos preenchidos automaticamente, principalmente cargos, empresas, datas, formação e descrições.', { duration: 7000 });
    };
    window.addEventListener('afterprint', restore);
    ctx.showToast('Na janela de impressão, selecione “Salvar como PDF”. Depois, abra o arquivo e confirme se o texto pode ser selecionado e copiado.', { duration: 5000 });
    setTimeout(() => window.print(), 150);
  }

  function renderReviewTemplateGallery() {
    const state = ctx.getState();
    if (!ctx.els.reviewTemplateGallery) return;
    const sections = ctx.activeSections();

    ctx.els.reviewTemplateGallery.innerHTML = TEMPLATE_IDS.map((id) => {
      const t = TEMPLATES[id];
      const selected = state.template === id;
      const atsBadge = t.atsFriendly
        ? '<span class="badge badge-ats">Estrutura favorável a ATS</span>'
        : '<span class="badge badge-ats-warn">Pode dificultar a leitura por ATS</span>';
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

  function syncGalleryToTemplate() {
    const state = ctx.getState();
    const idx = TEMPLATE_IDS.indexOf(state.template);
    reviewGalleryIndex = idx >= 0 ? idx : 0;
  }

  function galleryStep(dir) {
    const state = ctx.getState();
    // Navegar ja aplica o modelo (sem precisar de "Usar este").
    const total = TEMPLATE_IDS.length;
    reviewGalleryIndex = ((reviewGalleryIndex + dir) % total + total) % total;
    state.template = TEMPLATE_IDS[reviewGalleryIndex];
    ctx.saveState();
    ctx.updateTemplateIndicators();
    ctx.debouncedUpdatePreviews();
    renderReviewGallery();
  }
  return {
    init,
    syncGalleryToTemplate,
    galleryStep,
    renderReview,
    renderReviewGallery,
    renderReviewTemplateGallery,
    cvFileBaseName,
    printCv
  };
})();
