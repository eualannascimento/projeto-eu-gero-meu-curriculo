/**
 * Modelo de dados do curriculo - fonte unica para preview e exportacao.
 */
const EuGeroCvData = (function () {
  const { getActiveSections, getSkillsFromState } = EuGeroConfig;

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

  function hasData(items, keys) {
    return items?.some(item => keys.some(k => String(item[k] || '').trim()));
  }

  function filterItems(items, keys) {
    return (items || []).filter(item => keys.some(k => String(item[k] || '').trim()));
  }

  function build(state, enabledSections) {
    const enabled = enabledSections || getActiveSections(state.enabledSections);
    const enabledIds = new Set(enabled.map(s => s.id));
    const p = state.personal || {};
    const skills = getSkillsFromState(state);

    const doc = {
      personal: {
        fullName: p.fullName || '',
        headline: p.headline || '',
        email: p.email || '',
        phone: p.phone || '',
        location: p.location || '',
        linkedinUrl: p.linkedinUrl || ''
      },
      sidebar: {
        contact: [p.email, p.phone, p.location, p.linkedinUrl].filter(Boolean),
        skills: enabledIds.has('skills') ? skills.map(s => s.name || s).filter(Boolean) : [],
        languages: enabledIds.has('languages')
          ? filterItems(state.languages, ['language']).map(l => ({ language: l.language, level: l.level || '' }))
          : []
      },
      sections: []
    };

    function pushSection(id, title, blocks) {
      if (!enabledIds.has(id) || !blocks.length) return;
      doc.sections.push({ id, title, blocks });
    }

    if (enabledIds.has('summary') && state.summary?.trim()) {
      pushSection('summary', 'Resumo', [{ type: 'text', text: state.summary.trim() }]);
    }

    if (enabledIds.has('experiences')) {
      const items = filterItems(state.experiences, ['company', 'title', 'description']);
      if (items.length) {
        pushSection('experiences', 'Experiência Profissional', items.map(e => ({
          type: 'entry',
          title: e.title || '',
          subtitle: e.company || '',
          period: formatPeriod(e.startDate, e.endDate, e.endCurrent),
          description: e.description || ''
        })));
      }
    }

    if (enabledIds.has('education')) {
      const items = filterItems(state.education, ['institution', 'degree']);
      if (items.length) {
        pushSection('education', 'Formação Acadêmica', items.map(e => ({
          type: 'entry',
          title: e.degree || '',
          subtitle: e.institution || '',
          period: formatPeriod(e.startDate, e.endDate, e.endCurrent),
          description: ''
        })));
      }
    }

    if (enabledIds.has('skills') && skills.length) {
      pushSection('skills', 'Habilidades', [{ type: 'tags', items: skills.map(s => s.name || s) }]);
    }

    if (enabledIds.has('languages')) {
      const items = filterItems(state.languages, ['language']);
      if (items.length) {
        pushSection('languages', 'Idiomas', items.map(l => ({
          type: 'line',
          text: `${l.language}${l.level ? ` - ${l.level}` : ''}`
        })));
      }
    }

    if (enabledIds.has('certifications')) {
      const items = filterItems(state.certifications, ['name']);
      if (items.length) {
        pushSection('certifications', 'Certificados e Licenças', items.map(c => ({
          type: 'entry',
          title: c.name,
          subtitle: [c.issuer, fmtDate(c.date)].filter(Boolean).join(' · '),
          period: '',
          description: c.url || ''
        })));
      }
    }

    if (enabledIds.has('projects')) {
      const items = filterItems(state.projects, ['name', 'description']);
      if (items.length) {
        pushSection('projects', 'Projetos', items.map(p => ({
          type: 'entry',
          title: p.name,
          subtitle: p.url || '',
          period: '',
          description: p.description || ''
        })));
      }
    }

    if (enabledIds.has('volunteering')) {
      const items = filterItems(state.volunteering, ['organization', 'role', 'description']);
      if (items.length) {
        pushSection('volunteering', 'Voluntariado', items.map(v => ({
          type: 'entry',
          title: v.role || '',
          subtitle: v.organization || '',
          period: formatPeriod(v.startDate, v.endDate, v.endCurrent),
          description: v.description || ''
        })));
      }
    }

    if (enabledIds.has('publications')) {
      const items = filterItems(state.publications, ['title']);
      if (items.length) {
        pushSection('publications', 'Publicações', items.map(pub => ({
          type: 'entry',
          title: pub.title,
          subtitle: [pub.publisher, pub.date].filter(Boolean).join(' · '),
          period: '',
          description: pub.url || ''
        })));
      }
    }

    if (enabledIds.has('awards')) {
      const items = filterItems(state.awards, ['title']);
      if (items.length) {
        pushSection('awards', 'Prêmios e Honrarias', items.map(a => ({
          type: 'entry',
          title: a.title,
          subtitle: a.issuer || '',
          period: a.date || '',
          description: a.description || ''
        })));
      }
    }

    if (enabledIds.has('organizations')) {
      const items = filterItems(state.organizations, ['name']);
      if (items.length) {
        pushSection('organizations', 'Organizações', items.map(o => ({
          type: 'entry',
          title: o.name,
          subtitle: o.role || '',
          period: formatPeriod(o.startDate, o.endDate, o.endCurrent),
          description: ''
        })));
      }
    }

    if (enabledIds.has('courses')) {
      const items = filterItems(state.courses, ['name']);
      if (items.length) {
        pushSection('courses', 'Cursos', items.map(c => ({
          type: 'entry',
          title: c.name,
          subtitle: [c.institution, c.date].filter(Boolean).join(' · '),
          period: '',
          description: ''
        })));
      }
    }

    return doc;
  }

  /** Seções para layout sidebar: habilidades/idiomas vão na sidebar */
  function getMainSections(doc, templateId) {
    if (EuGeroConfig.isSidebarTemplate(templateId)) {
      return doc.sections.filter(s => s.id !== 'skills' && s.id !== 'languages');
    }
    return doc.sections;
  }

  return { build, getMainSections, formatPeriod };
})();
