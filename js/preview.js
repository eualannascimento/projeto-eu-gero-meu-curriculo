/**
 * Preview ao vivo do currículo nos templates Clássico e Moderno.
 */
const EuGeroPreview = (function () {
  const { getSkillsFromState, getActiveSections, SECTION_LABELS } = EuGeroConfig;

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatPeriod(start, end, isCurrent) {
    if (typeof EuGeroDates !== 'undefined') {
      return EuGeroDates.formatPeriod(start, end, isCurrent);
    }
    if (!start && !end) return '';
    return `${start || ''}${start && end ? ' - ' : ''}${isCurrent ? 'Atual' : (end || '')}`;
  }

  function fmtDate(value) {
    if (typeof EuGeroDates !== 'undefined') return EuGeroDates.formatDisplayDate(value, false);
    return value || '';
  }

  function renderSection(title, content) {
    if (!content) return '';
    return `<section class="cv-section"><h2>${escapeHtml(title)}</h2>${content}</section>`;
  }

  function renderSkeletonSection(title) {
    return `<section class="cv-section cv-section-skeleton"><h2>${escapeHtml(title)}</h2><div class="cv-skeleton-lines"><span></span><span></span></div></section>`;
  }

  function hasExperienceData(items) {
    return items?.some(e => e.company || e.title || e.description);
  }

  function hasEducationData(items) {
    return items?.some(e => e.institution || e.degree);
  }

  function hasListData(items, keys) {
    return items?.some(item => keys.some(k => item[k]?.trim?.()));
  }

  function renderExperiences(items, showSkeleton) {
    if (hasExperienceData(items)) {
      const html = items.filter(e => e.company || e.title).map(e => `
        <article class="cv-item">
          <div class="cv-item-header">
            <strong>${escapeHtml(e.title || 'Cargo')}</strong>
            <span class="cv-period">${escapeHtml(formatPeriod(e.startDate, e.endDate, e.endCurrent))}</span>
          </div>
          <div class="cv-item-sub">${escapeHtml(e.company || '')}</div>
          ${e.description ? `<p class="cv-desc">${escapeHtml(e.description).replace(/\n/g, '<br>')}</p>` : ''}
        </article>
      `).join('');
      return renderSection('Experiência Profissional', html);
    }
    return showSkeleton ? renderSkeletonSection('Experiência Profissional') : '';
  }

  function renderEducation(items, showSkeleton) {
    if (hasEducationData(items)) {
      const html = items.filter(e => e.institution || e.degree).map(e => `
        <article class="cv-item">
          <strong>${escapeHtml(e.degree || 'Curso')}</strong>
          <div class="cv-item-sub">${escapeHtml(e.institution || '')}</div>
          <span class="cv-period">${escapeHtml(formatPeriod(e.startDate, e.endDate))}</span>
        </article>
      `).join('');
      return renderSection('Formação Acadêmica', html);
    }
    return showSkeleton ? renderSkeletonSection('Formação Acadêmica') : '';
  }

  function renderSkills(state, showSkeleton) {
    const skills = getSkillsFromState(state);
    if (skills.length) {
      const html = `<div class="cv-skills">${skills.map(s => `<span class="cv-skill-tag">${escapeHtml(s.name || s)}</span>`).join('')}</div>`;
      return renderSection('Habilidades', html);
    }
    return showSkeleton ? renderSkeletonSection('Habilidades') : '';
  }

  function renderLanguages(items, showSkeleton) {
    if (hasListData(items, ['language'])) {
      const html = items.filter(l => l.language).map(l => `<div class="cv-item"><strong>${escapeHtml(l.language)}</strong> - ${escapeHtml(l.level || '')}</div>`).join('');
      return renderSection('Idiomas', html);
    }
    return showSkeleton ? renderSkeletonSection('Idiomas') : '';
  }

  function renderGenericList(title, items, keys, formatter, showSkeleton) {
    if (hasListData(items, keys)) {
      const html = items.filter(item => keys.some(k => item[k]?.trim?.())).map(formatter).join('');
      return renderSection(title, html);
    }
    return showSkeleton ? renderSkeletonSection(title) : '';
  }

  function isSectionEnabled(enabledSet, id) {
    return !enabledSet || enabledSet.has(id);
  }

  function buildContent(state, enabledSections, options) {
    const modernLayout = options?.modernLayout === true;
    const enabled = enabledSections || getActiveSections(state.enabledSections);
    const enabledSet = new Set(enabled.map(s => s.id));
    const p = state.personal || {};
    let content = '';

    if (isSectionEnabled(enabledSet, 'summary')) {
      if (state.summary?.trim()) {
        content += renderSection('Resumo', `<p class="cv-summary">${escapeHtml(state.summary).replace(/\n/g, '<br>')}</p>`);
      } else {
        content += renderSkeletonSection('Resumo');
      }
    }

    if (isSectionEnabled(enabledSet, 'experiences')) {
      content += renderExperiences(state.experiences, true);
    }
    if (isSectionEnabled(enabledSet, 'education')) {
      content += renderEducation(state.education, true);
    }
    if (isSectionEnabled(enabledSet, 'skills') && !modernLayout) {
      content += renderSkills(state, true);
    }
    if (isSectionEnabled(enabledSet, 'languages') && !modernLayout) {
      content += renderLanguages(state.languages, true);
    }

    if (isSectionEnabled(enabledSet, 'certifications')) {
      content += renderGenericList('Certificados e Licenças', state.certifications, ['name'], c => `
        <article class="cv-item"><strong>${escapeHtml(c.name)}</strong><div class="cv-item-sub">${escapeHtml(c.issuer || '')}${c.date ? ` · ${escapeHtml(fmtDate(c.date))}` : ''}</div></article>
      `, true);
    }
    if (isSectionEnabled(enabledSet, 'projects')) {
      content += renderGenericList('Projetos', state.projects, ['name'], p => `
        <article class="cv-item"><strong>${escapeHtml(p.name)}</strong>${p.description ? `<p class="cv-desc">${escapeHtml(p.description).replace(/\n/g, '<br>')}</p>` : ''}</article>
      `, true);
    }
    if (isSectionEnabled(enabledSet, 'volunteering')) {
      content += renderGenericList('Voluntariado', state.volunteering, ['organization'], v => `
        <article class="cv-item"><strong>${escapeHtml(v.role || 'Função')}</strong> - ${escapeHtml(v.organization)}<span class="cv-period">${escapeHtml(formatPeriod(v.startDate, v.endDate, v.endCurrent))}</span></article>
      `, true);
    }
    if (isSectionEnabled(enabledSet, 'publications')) {
      content += renderGenericList('Publicações', state.publications, ['title'], pub => `
        <article class="cv-item"><strong>${escapeHtml(pub.title)}</strong><div class="cv-item-sub">${escapeHtml(pub.publisher || '')}</div></article>
      `, true);
    }
    if (isSectionEnabled(enabledSet, 'awards')) {
      content += renderGenericList('Prêmios e Honrarias', state.awards, ['title'], a => `
        <article class="cv-item"><strong>${escapeHtml(a.title)}</strong> - ${escapeHtml(a.issuer || '')}</article>
      `, true);
    }
    if (isSectionEnabled(enabledSet, 'organizations')) {
      content += renderGenericList('Organizações', state.organizations, ['name'], o => `
        <article class="cv-item"><strong>${escapeHtml(o.name)}</strong> - ${escapeHtml(o.role || '')}</article>
      `, true);
    }
    if (isSectionEnabled(enabledSet, 'courses')) {
      content += renderGenericList('Cursos', state.courses, ['name'], c => `
        <article class="cv-item"><strong>${escapeHtml(c.name)}</strong><div class="cv-item-sub">${escapeHtml(c.institution || '')}</div></article>
      `, true);
    }

    return { personal: p, content };
  }

  function renderSidebarLayout(state, enabledSections, templateId) {
    const { personal, content } = buildContent(state, enabledSections, { modernLayout: true });
    const skills = getSkillsFromState(state);
    const enabled = enabledSections || getActiveSections(state.enabledSections);
    const enabledSet = new Set(enabled.map(s => s.id));
    const contactLines = [
      personal.email || 'seu@email.com',
      personal.phone || '(00) 00000-0000',
      personal.location || 'Cidade, UF'
    ];

    return `
      <div class="cv cv-sidebar-layout template-${templateId}">
        <aside class="cv-sidebar">
          <h1 class="cv-name">${escapeHtml(personal.fullName) || 'Seu Nome'}</h1>
          <p class="cv-headline">${escapeHtml(personal.headline) || 'Título profissional'}</p>
          <div class="cv-sidebar-section">
            <h3>Contato</h3>
            ${contactLines.map(c => `<p>${escapeHtml(c)}</p>`).join('')}
            ${personal.linkedinUrl ? `<p class="cv-link">${escapeHtml(personal.linkedinUrl)}</p>` : ''}
          </div>
          ${enabledSet.has('skills') ? `
            <div class="cv-sidebar-section">
              <h3>Habilidades</h3>
              ${skills.length ? skills.map(s => `<p>${escapeHtml(s.name || s)}</p>`).join('') : '<p class="cv-muted">Suas habilidades</p>'}
            </div>
          ` : ''}
          ${enabledSet.has('languages') ? `
            <div class="cv-sidebar-section">
              <h3>Idiomas</h3>
              ${state.languages?.length
                ? state.languages.map(l => `<p>${escapeHtml(l.language)} - ${escapeHtml(l.level)}</p>`).join('')
                : '<p class="cv-muted">Seus idiomas</p>'}
            </div>
          ` : ''}
        </aside>
        <main class="cv-main">${content}</main>
      </div>
    `;
  }

  function renderCenteredLayout(state, enabledSections, templateId) {
    const { personal, content } = buildContent(state, enabledSections, { modernLayout: false });
    const contacts = [personal.email, personal.phone, personal.location, personal.linkedinUrl].filter(Boolean);
    const extraClass = templateId === 'elegant' ? ' cv-elegant' : '';

    return `
      <div class="cv cv-classic cv-centered${extraClass} template-${templateId}">
        <header class="cv-header-classic">
          <h1 class="cv-name">${escapeHtml(personal.fullName) || 'Seu Nome'}</h1>
          <p class="cv-headline">${escapeHtml(personal.headline) || 'Título profissional'}</p>
          <p class="cv-contacts">${contacts.length ? contacts.map(c => escapeHtml(c)).join(' · ') : 'e-mail · telefone · cidade'}</p>
        </header>
        <div class="cv-body">${content}</div>
      </div>
    `;
  }

  function renderBannerLayout(state, enabledSections) {
    const { personal, content } = buildContent(state, enabledSections, { modernLayout: false });
    const contacts = [personal.email, personal.phone, personal.location].filter(Boolean);

    return `
      <div class="cv cv-executive template-executive">
        <header class="cv-banner">
          <h1 class="cv-name">${escapeHtml(personal.fullName) || 'Seu Nome'}</h1>
          <p class="cv-headline">${escapeHtml(personal.headline) || 'Título profissional'}</p>
          <p class="cv-contacts">${contacts.map(c => escapeHtml(c)).join(' · ')}</p>
        </header>
        <div class="cv-body">${content}</div>
      </div>
    `;
  }

  function renderLeftLayout(state, enabledSections) {
    const { personal, content } = buildContent(state, enabledSections, { modernLayout: false });
    const contacts = [personal.email, personal.phone, personal.location, personal.linkedinUrl].filter(Boolean);

    return `
      <div class="cv cv-minimal template-minimal">
        <header class="cv-header-left">
          <h1 class="cv-name">${escapeHtml(personal.fullName) || 'Seu Nome'}</h1>
          <p class="cv-headline">${escapeHtml(personal.headline) || 'Título profissional'}</p>
          <p class="cv-contacts">${contacts.length ? contacts.map(c => escapeHtml(c)).join(' · ') : 'contato@email.com · cidade'}</p>
        </header>
        <div class="cv-body">${content}</div>
      </div>
    `;
  }

  function render(state, templateId, enabledSections) {
    const meta = EuGeroConfig.getTemplateMeta(templateId);
    switch (meta.layout) {
      case 'sidebar': return renderSidebarLayout(state, enabledSections, templateId);
      case 'banner': return renderBannerLayout(state, enabledSections);
      case 'left': return renderLeftLayout(state, enabledSections);
      default: return renderCenteredLayout(state, enabledSections, templateId);
    }
  }

  function updatePreview(container, state, templateId, enabledSections) {
    if (!container) return;
    const sections = enabledSections || getActiveSections(state.enabledSections);
    const inner = render(state, templateId, sections);
    const pageFit = typeof EuGeroScoring !== 'undefined'
      ? EuGeroScoring.scorePageFit(state, sections)
      : { level: 'ok' };
    const overflowClass = pageFit.level !== 'ok' ? ' preview-overflow' : '';
    container.innerHTML = `
      <div class="preview-a4-body${overflowClass}">${inner}</div>
      <div class="cv-page-limit" aria-hidden="true"><span>Limite de 1 pagina A4</span></div>
    `;
    container.className = `preview-content preview-paper template-${templateId}`;
  }

  return {
    render,
    updatePreview,
    buildContent,
    escapeHtml
  };
})();
