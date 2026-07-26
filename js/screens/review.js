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
      <p class="review-intro">Esta análise considera apenas o preenchimento do currículo. Ela não avalia seu perfil nem garante resultados em processos seletivos.</p>
      <div class="review-score-row">
        <div>
          <div class="review-score-value">${ctx.escapeHtml(scoreLabel)}</div>
          <div class="review-score-caption">Nível de preenchimento</div>
        </div>
        <div class="review-score-bar-wrap">
          <div class="review-progress-track">
            <div class="review-progress-fill" data-pct="${pct}"></div>
          </div>
          <p class="review-score-text">${ctx.escapeHtml(scoreMsg)}</p>
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
      <div class="review-block">
        <p class="review-block-title">Preenchimento por seção</p>
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

    const currentTemplate = TEMPLATES[state.template];
    const pageTitle = pageFit.level === 'ok' ? 'Cabe em uma página' : pageFit.level === 'detailed' ? 'Modo detalhado: até duas páginas' : 'Revise a extensão';
    const pageText = pageFit.level === 'ok'
      ? 'O conteúdo está em uma extensão adequada para uma página.'
      : pageFit.level === 'detailed'
        ? 'Duas páginas são aceitáveis quando a experiência e os resultados forem relevantes para a vaga.'
        : 'Prefira cortar repetições e conteúdo pouco relevante. Se tudo for necessário, escolha "Até 2 páginas".';
    const checklist = [
      state.personal.email ? 'E-mail preenchido' : 'Revise o e-mail de contato',
      state.personal.location ? 'Cidade informada sem endereço completo' : 'Informe cidade e estado',
      currentTemplate?.atsFriendly ? 'Modelo com estrutura favorável a ATS' : 'Considere um modelo de uma coluna para ATS',
      state.summary ? 'Resumo incluído' : 'Inclua um resumo curto e específico',
      pageTitle
    ];
    html += `<div class="review-block">
      <p class="review-block-title-tight">Extensão e checagem final</p>
      <p class="review-block-text">${ctx.escapeHtml(pageText)}</p>
      <ul class="review-block-list">${checklist.map((item) => `<li>${ctx.escapeHtml(item)}</li>`).join('')}</ul>
    </div>`;

    // Painel de leitura por ATS: considera apenas a estrutura do modelo escolhido.
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
      <div class="review-block">
        <p class="review-block-title-tight">Leitura por ATS</p>
        <p class="review-block-note">Esta verificação considera apenas a estrutura e a organização do currículo. Ela não garante aprovação nem substitui o preenchimento dos campos da plataforma.</p>
        <div class="review-ats-row">
          <span class="rf-badge ${currentTemplate?.atsFriendly ? 'rf-otimo' : 'rf-fraco'}">${ctx.escapeHtml(atsStatusLabel)}</span>
          <span class="review-ats-desc">${ctx.escapeHtml(atsStatusDesc)}</span>
        </div>
        <p class="review-ats-title">Antes de enviar</p>
        <ul class="review-block-list">
          ${atsChecklist.map((item) => `<li>${ctx.escapeHtml(item)}</li>`).join('')}
        </ul>
      </div>`;

    ctx.els.reviewContent.innerHTML = html;
    // A largura da barra e o unico valor calculado do bloco. Ela chega por
    // data-pct e e aplicada aqui por CSSOM: a CSP barra o atributo style,
    // inclusive vindo de innerHTML, mas nao barra elemento.style.
    ctx.els.reviewContent.querySelectorAll('[data-pct]').forEach((barra) => {
      barra.style.width = `${barra.dataset.pct}%`;
    });

    ctx.els.reviewContent.querySelectorAll('.link-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        ctx.goToWizard(parseInt(btn.dataset.step, 10));
      });
    });

    renderReviewGallery();
    syncPrintCv();
  }

  /** Mantém a área de impressão idêntica ao conteúdo da prévia. */
  function syncPrintCv() {
    const el = document.getElementById('print-cv');
    if (!el) return;
    const state = ctx.getState();
    el.innerHTML = EuGeroPreview.render(state, state.template, ctx.activeSections(), 'export');
    el.className = `preview-content template-${state.template} cv-margin-${state.margin || 'padrao'} cv-density-${state.density || 'normal'}`;
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
    syncPrintCv();
    window.print();
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
    syncPrintCv();
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
