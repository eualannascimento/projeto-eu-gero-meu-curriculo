/**
 * Geracao de prompts para IA externa - modulo puro testavel.
 */
const EuGeroPrompts = (function () {
  const SECTION_PROMPTS = {
    personal: 'Ajude-me a preencher meus Dados Pessoais para currículo e LinkedIn. Sugira um título profissional impactante, formatação de contato e dicas para URL do LinkedIn.',
    summary: 'Ajude-me a escrever um Resumo/Sobre profissional para LinkedIn. O texto deve ter 3-4 parágrafos, usar verbos de ação, incluir conquistas mensuráveis e transmitir minha proposta de valor.',
    experiences: 'Ajude-me a escrever descrições de Experiências Profissionais. Para cada experiência, use verbos de ação no passado (implementei, liderei, desenvolvi), inclua resultados quantificáveis e destaque impacto gerado.',
    education: 'Ajude-me a formatar minha Formação Acadêmica para currículo. Inclua instituição, curso, período e destaque relevante como honras ou projetos acadêmicos.',
    skills: 'Sugira uma lista de Habilidades relevantes para meu perfil profissional. Priorize competências técnicas e comportamentais alinhadas ao cargo desejado.',
    languages: 'Ajude-me a listar meus Idiomas com níveis de proficiência adequados para currículo e LinkedIn.',
    certifications: 'Ajude-me a formatar meus Certificados e Licenças de forma profissional para currículo.',
    projects: 'Ajude-me a descrever meus Projetos profissionais. Inclua objetivo, minha contribuição, tecnologias usadas e resultados alcançados.',
    volunteering: 'Ajude-me a descrever minhas experiências de Voluntariado de forma impactante para currículo.',
    publications: 'Ajude-me a formatar minhas Publicações para perfil LinkedIn e currículo.',
    awards: 'Ajude-me a descrever meus Prêmios e Honrarias de forma profissional.',
    organizations: 'Ajude-me a listar minhas participações em Organizações profissionais.',
    courses: 'Ajude-me a formatar meus Cursos complementares para currículo e LinkedIn.'
  };

  const GENERAL_INTRO = `Você é um especialista em recrutamento e otimização de currículos para o mercado brasileiro. 
Ajude-me a criar/melhorar meu currículo completo e perfil LinkedIn.
Siga estas diretrizes:
- Use verbos de ação em português (implementei, liderei, desenvolvi, gerenciei, otimizei)
- Inclua resultados mensuráveis sempre que possível (%, números, prazos)
- Seja conciso e profissional
- Adapte o tom ao cargo desejado
- Responda organizado por seções do currículo`;

  const TRANSLATION_INTRO = `Traduza meu currículo completo do português para inglês profissional.
Mantenha formatação por seções. Adapte termos técnicos corretamente.
Use verbos de ação no passado em inglês (implemented, led, developed, managed).
Preserve nomes próprios de empresas e instituições.
Responda com o currículo traduzido, seção por seção.`;

  function formatPersonalData(state) {
    const p = state.personal || {};
    return `Nome: ${p.fullName || '(não preenchido)'}
Cargo desejado: ${p.headline || '(não preenchido)'}
E-mail: ${p.email || '(não preenchido)'}
Telefone: ${p.phone || '(não preenchido)'}
Localização: ${p.location || '(não preenchido)'}
LinkedIn: ${p.linkedinUrl || '(não preenchido)'}`;
  }

  function formatListSection(items, formatter) {
    if (!items || items.length === 0) return '(não preenchido)';
    return items.map((item, i) => `--- Item ${i + 1} ---\n${formatter(item)}`).join('\n\n');
  }

  function formatStateData(state) {
    const parts = [];

    parts.push(`## Dados Pessoais\n${formatPersonalData(state)}`);

    if (state.summary) {
      parts.push(`## Resumo/Sobre\n${state.summary}`);
    }

    if (state.experiences?.length) {
      parts.push(`## Experiências\n${formatListSection(state.experiences, e =>
        `Empresa: ${e.company}\nCargo: ${e.title}\nPeríodo: ${e.startDate} - ${e.endDate || 'Atual'}\nDescrição: ${e.description}`
      )}`);
    }

    if (state.education?.length) {
      parts.push(`## Formação\n${formatListSection(state.education, e =>
        `Instituição: ${e.institution}\nCurso: ${e.degree}\nPeríodo: ${e.startDate || ''} - ${e.endDate || ''}`
      )}`);
    }

    const skills = EuGeroConfig.getSkillsFromState(state);
    if (skills.length) {
      parts.push(`## Habilidades\n${skills.map(s => s.name || s).filter(Boolean).join(', ')}`);
    }

    if (state.languages?.length) {
      parts.push(`## Idiomas\n${formatListSection(state.languages, l =>
        `${l.language}: ${l.level}`
      )}`);
    }

    if (state.certifications?.length) {
      parts.push(`## Certificados\n${formatListSection(state.certifications, c =>
        `${c.name} - ${c.issuer} (${c.date || ''})`
      )}`);
    }

    if (state.projects?.length) {
      parts.push(`## Projetos\n${formatListSection(state.projects, p =>
        `${p.name}: ${p.description}`
      )}`);
    }

    if (state.volunteering?.length) {
      parts.push(`## Voluntariado\n${formatListSection(state.volunteering, v =>
        `${v.organization} - ${v.role}: ${v.description || ''}`
      )}`);
    }

    if (state.publications?.length) {
      parts.push(`## Publicações\n${formatListSection(state.publications, p =>
        `"${p.title}" - ${p.publisher} (${p.date || ''})`
      )}`);
    }

    if (state.awards?.length) {
      parts.push(`## Prêmios\n${formatListSection(state.awards, a =>
        `${a.title} - ${a.issuer}: ${a.description || ''}`
      )}`);
    }

    if (state.organizations?.length) {
      parts.push(`## Organizações\n${formatListSection(state.organizations, o =>
        `${o.name} - ${o.role}`
      )}`);
    }

    if (state.courses?.length) {
      parts.push(`## Cursos\n${formatListSection(state.courses, c =>
        `${c.name} - ${c.institution} (${c.date || ''})`
      )}`);
    }

    return parts.join('\n\n');
  }

  function formatSectionData(sectionId, state) {
    switch (sectionId) {
      case 'personal':
        return formatPersonalData(state);
      case 'summary':
        return state.summary || '(não preenchido)';
      case 'skills':
        return EuGeroConfig.skillsToText(state) || '(não preenchido)';
      default:
        if (Array.isArray(state[sectionId])) {
          const section = EuGeroConfig.SECTIONS.find(s => s.id === sectionId);
          if (!section) return '(não preenchido)';
          return formatListSection(state[sectionId], item =>
            section.itemFields.map(f => `${f.label}: ${item[f.key] || ''}`).join('\n')
          );
        }
        return '(não preenchido)';
    }
  }

  function buildGeneralPrompt(state, includeData) {
    let prompt = GENERAL_INTRO;
    if (includeData) {
      prompt += '\n\n--- MEUS DADOS ATUAIS ---\n\n' + formatStateData(state);
    } else {
      prompt += '\n\n(Não incluí meus dados pessoais - forneça sugestões genéricas baseadas nas informações que eu fornecer em seguida.)';
    }
    return prompt;
  }

  function buildSectionPrompt(sectionId, state, includeData) {
    const instruction = SECTION_PROMPTS[sectionId] || 'Ajude-me com esta seção do currículo.';
    let prompt = `${instruction}\n\nForneça sugestões de texto prontas para copiar e colar.`;
    if (includeData) {
      prompt += '\n\n--- MEUS DADOS DESTA SEÇÃO ---\n\n' + formatSectionData(sectionId, state);
    } else {
      prompt += '\n\n(Não incluí meus dados - aguardo fornecer as informações necessárias.)';
    }
    return prompt;
  }

  function buildTranslationPrompt(state, includeData) {
    let prompt = TRANSLATION_INTRO;
    if (includeData) {
      prompt += '\n\n--- CURRÍCULO EM PORTUGUÊS ---\n\n' + formatStateData(state);
    } else {
      prompt += '\n\n(Preciso fornecer o conteúdo do currículo em português para tradução.)';
    }
    return prompt;
  }

  function containsPersonalData(prompt) {
    const patterns = [
      /@\w+\.\w+/,
      /\+?\d{10,}/,
      /linkedin\.com/i,
      /MEUS DADOS/i,
      /CURRÍCULO EM PORTUGUÊS/i
    ];
    return patterns.some(p => p.test(prompt));
  }

  return {
    SECTION_PROMPTS,
    buildGeneralPrompt,
    buildSectionPrompt,
    buildTranslationPrompt,
    formatStateData,
    formatSectionData,
    containsPersonalData
  };
})();
