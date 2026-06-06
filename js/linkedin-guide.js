/**
 * Guia LinkedIn - textos prontos por campo.
 */
const EuGeroLinkedInGuide = (function () {
  function isEmpty(val) {
    if (!val) return true;
    if (typeof val === 'string') return val.trim().length === 0;
    return false;
  }

  function buildEntries(state) {
    const entries = [];
    const p = state.personal || {};

    if (!isEmpty(p.headline)) {
      entries.push({
        title: 'Título profissional',
        hint: 'Clique em "Editar perfil" → campo "Título" abaixo do seu nome',
        content: p.headline
      });
    }

    if (!isEmpty(p.location)) {
      entries.push({
        title: 'Localização',
        hint: 'Editar perfil → seção "Informações de contato" → Localização',
        content: p.location
      });
    }

    if (!isEmpty(state.summary)) {
      entries.push({
        title: 'Sobre',
        hint: 'Perfil → seção "Sobre" → editar (ícone de lápis)',
        content: state.summary
      });
    }

    (state.experiences || []).forEach((e, i) => {
      if (!isEmpty(e.company) || !isEmpty(e.title)) {
        const parts = [];
        if (e.title) parts.push(`Cargo: ${e.title}`);
        if (e.company) parts.push(`Empresa: ${e.company}`);
        if (e.startDate || e.endDate) parts.push(`Período: ${e.startDate || ''} - ${e.endDate || 'Atual'}`);
        if (e.description) parts.push(`\nDescrição:\n${e.description}`);
        entries.push({
          title: `Experiência ${i + 1}: ${e.title || e.company}`,
          hint: 'Perfil → Experiência → adicionar/editar experiência',
          content: parts.join('\n')
        });
      }
    });

    (state.education || []).forEach((e, i) => {
      if (!isEmpty(e.institution) || !isEmpty(e.degree)) {
        entries.push({
          title: `Formação ${i + 1}: ${e.degree || e.institution}`,
          hint: 'Perfil → Formação acadêmica → adicionar formação',
          content: `Instituição: ${e.institution}\nCurso: ${e.degree}\nPeríodo: ${e.startDate || ''} - ${e.endDate || ''}`
        });
      }
    });

    EuGeroConfig.getSkillsFromState(state).forEach(s => {
      const name = s.name || s;
      if (!isEmpty(name)) {
        entries.push({
          title: `Competência: ${name}`,
          hint: 'Perfil → Competências → adicionar competência',
          content: name
        });
      }
    });

    (state.languages || []).forEach((l, i) => {
      if (!isEmpty(l.language)) {
        entries.push({
          title: `Idioma ${i + 1}: ${l.language}`,
          hint: 'Perfil → Idiomas → adicionar idioma',
          content: `${l.language}\nNível: ${l.level || ''}`
        });
      }
    });

    (state.certifications || []).forEach((c, i) => {
      if (!isEmpty(c.name)) {
        entries.push({
          title: `Certificado ${i + 1}: ${c.name}`,
          hint: 'Perfil → Licenças e certificados → adicionar',
          content: `Nome: ${c.name}\nEmissor: ${c.issuer || ''}\nData: ${c.date || ''}${c.url ? `\nURL: ${c.url}` : ''}`
        });
      }
    });

    (state.projects || []).forEach((proj, i) => {
      if (!isEmpty(proj.name)) {
        entries.push({
          title: `Projeto ${i + 1}: ${proj.name}`,
          hint: 'Perfil → Projetos → adicionar projeto',
          content: `Nome: ${proj.name}\n${proj.description || ''}${proj.url ? `\nURL: ${proj.url}` : ''}`
        });
      }
    });

    (state.volunteering || []).forEach((v, i) => {
      if (!isEmpty(v.organization)) {
        entries.push({
          title: `Voluntariado ${i + 1}: ${v.organization}`,
          hint: 'Perfil → Voluntariado → adicionar experiência',
          content: `Organização: ${v.organization}\nFunção: ${v.role || ''}\nPeríodo: ${v.startDate || ''} - ${v.endDate || 'Atual'}\n${v.description || ''}`
        });
      }
    });

    (state.publications || []).forEach((pub, i) => {
      if (!isEmpty(pub.title)) {
        entries.push({
          title: `Publicação ${i + 1}: ${pub.title}`,
          hint: 'Perfil → Publicações → adicionar publicação',
          content: `Título: ${pub.title}\nVeículo: ${pub.publisher || ''}\nData: ${pub.date || ''}${pub.url ? `\nURL: ${pub.url}` : ''}`
        });
      }
    });

    (state.awards || []).forEach((a, i) => {
      if (!isEmpty(a.title)) {
        entries.push({
          title: `Prêmio ${i + 1}: ${a.title}`,
          hint: 'Perfil → Prêmios e honrarias → adicionar',
          content: `Prêmio: ${a.title}\nEmissor: ${a.issuer || ''}\nData: ${a.date || ''}\n${a.description || ''}`
        });
      }
    });

    (state.organizations || []).forEach((o, i) => {
      if (!isEmpty(o.name)) {
        entries.push({
          title: `Organização ${i + 1}: ${o.name}`,
          hint: 'Perfil → Organizações → adicionar',
          content: `Organização: ${o.name}\nCargo: ${o.role || ''}\nPeríodo: ${o.startDate || ''} - ${o.endDate || ''}`
        });
      }
    });

    (state.courses || []).forEach((c, i) => {
      if (!isEmpty(c.name)) {
        entries.push({
          title: `Curso ${i + 1}: ${c.name}`,
          hint: 'Perfil → Cursos → adicionar curso',
          content: `Curso: ${c.name}\nInstituição: ${c.institution || ''}\nData: ${c.date || ''}`
        });
      }
    });

    return entries;
  }

  function renderGuide(container, state) {
    if (!container) return;
    const entries = buildEntries(state);

    if (entries.length === 0) {
      container.innerHTML = '<p class="guide-empty">Preencha o currículo para gerar o guia LinkedIn com textos prontos.</p>';
      return;
    }

    container.innerHTML = entries.map((entry, index) => `
      <article class="guide-entry" data-index="${index}">
        <h3 class="guide-entry-title">${escapeHtml(entry.title)}</h3>
        <p class="guide-entry-hint">${escapeHtml(entry.hint)}</p>
        <textarea class="guide-entry-content" readonly rows="4" data-index="${index}"></textarea>
        <button type="button" class="btn btn-secondary btn-copy-guide" data-index="${index}">Copiar</button>
        <span class="copy-feedback" aria-live="polite"></span>
      </article>
    `).join('');

    container.querySelectorAll('.guide-entry-content').forEach(ta => {
      ta.value = entries[parseInt(ta.dataset.index, 10)].content;
    });

    container.querySelectorAll('.btn-copy-guide').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        const content = entries[index].content;
        navigator.clipboard.writeText(content).then(() => {
          const feedback = btn.nextElementSibling;
          if (feedback) {
            feedback.textContent = 'Copiado!';
            setTimeout(() => { feedback.textContent = ''; }, 2000);
          }
        });
      });
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    buildEntries,
    renderGuide
  };
})();
