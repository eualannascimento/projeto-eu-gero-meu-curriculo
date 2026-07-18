/**
 * Geração de prompts para IA externa - módulo puro testável.
 */
const EuGeroPrompts = (function () {
  const SECTION_PROMPTS = {
    personal: 'Revise os dados que escolhi incluir no currículo e no LinkedIn. Sugira um título profissional claro, uma forma simples de apresentar os contatos e melhorias para a URL do LinkedIn. Não sugira informações pessoais que não sejam necessárias.',
    summary: 'Ajude a escrever um resumo profissional curto, com duas ou três frases, destacando experiência, habilidades e objetivo. Se eu fornecer uma descrição de vaga, use termos compatíveis com ela somente quando forem verdadeiros para o meu perfil. Não invente informações.',
    experiences: 'Ajude a melhorar as descrições das minhas experiências. Use verbos de ação e deixe claras as atividades, ferramentas, conhecimentos e resultados. Se eu fornecer uma descrição de vaga, destaque apenas as relações que forem verdadeiras e não repita palavras-chave de forma artificial.',
    education: 'Ajude a organizar minha formação, incluindo curso, instituição, período e outras informações relevantes que eu já tenha fornecido.',
    skills: 'Sugira habilidades técnicas e formas de trabalhar coerentes com as informações fornecidas. Se eu incluir uma descrição de vaga, compare os requisitos com meu perfil e separe o que já está confirmado do que ainda preciso validar.',
    languages: 'Ajude a apresentar meus idiomas e níveis de forma clara e adequada ao currículo e ao LinkedIn.',
    certifications: 'Ajude a organizar minhas certificações e meus cursos, com nome, instituição e ano de conclusão.',
    projects: 'Ajude a descrever meus projetos, destacando objetivo, participação, tecnologias e resultados já informados.',
    volunteering: 'Ajude-me a descrever minhas experiências de Voluntariado de forma impactante para currículo.',
    publications: 'Ajude-me a formatar minhas Publicações para perfil LinkedIn e currículo.',
    awards: 'Ajude-me a descrever meus Prêmios e Honrarias de forma profissional.',
    organizations: 'Ajude-me a listar minhas participações em Organizações profissionais.',
    courses: 'Ajude-me a formatar meus Cursos complementares para currículo e LinkedIn.'
  };

  const GENERAL_INTRO = `Atue como especialista em recrutamento e melhoria de currículos para o mercado brasileiro.

Ajude a revisar e melhorar meu currículo e meu perfil no LinkedIn.

Siga estas orientações:
- use verbos de ação em português;
- inclua números e resultados apenas quando houver informações suficientes;
- escreva de forma clara, curta e profissional;
- adapte o conteúdo ao cargo ou à área de interesse;
- organize a resposta pelas seções do currículo;
- não invente experiências, resultados ou qualificações;
- use linguagem respeitosa e inclusiva;
- avalie somente informações relacionadas à oportunidade e não faça suposições sobre gênero, identidade de gênero, idade, raça ou cor, origem, religião, deficiência, aparência, orientação sexual, estado civil, situação familiar ou outras características pessoais;
- se eu fornecer uma descrição de vaga, compare o currículo com os requisitos;
- identifique habilidades e termos relevantes que já estejam presentes no meu histórico;
- use o mesmo idioma da vaga;
- não repita palavras-chave de forma artificial;
- não invente experiências, ferramentas, resultados ou qualificações;
- indique separadamente qualquer requisito que eu ainda precise confirmar.`;

  const TRANSLATION_INTRO = `Traduza meu currículo do português para um inglês profissional e natural.

Mantenha a organização por seções, adapte os termos técnicos e preserve os nomes de empresas e instituições.

Use verbos de ação adequados ao contexto e não acrescente informações que não estejam no texto original. Quando o idioma permitir, não presuma gênero nem outras características pessoais que não tenham sido informadas.

Apresente a tradução seção por seção.`;

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
        `Cargo: ${e.title}\nOnde: ${e.company}\nPeríodo: ${e.period || `${e.startDate || ''} - ${e.endDate || 'Atual'}`}\nDescrição: ${e.description}`
      )}`);
    }

    if (state.education?.length) {
      parts.push(`## Formação\n${formatListSection(state.education, e =>
        `Curso: ${e.degree}\nInstituição: ${e.institution}\nPeríodo: ${e.period || `${e.startDate || ''} - ${e.endDate || ''}`}`
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
        `${c.name} - ${c.issuer} (${c.year || c.date || ''})`
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

  function appendJobDescription(prompt, jobDescription) {
    if (!jobDescription || !jobDescription.trim()) return prompt;
    return prompt + '\n\n--- DESCRIÇÃO DA VAGA (use apenas como referência para destacar informações verdadeiras e relevantes, sem inventar nem repetir palavras-chave de forma artificial) ---\n\n' + jobDescription.trim();
  }

  function buildGeneralPrompt(state, includeData, jobDescription) {
    let prompt = GENERAL_INTRO;
    if (includeData) {
      prompt += '\n\n--- MEUS DADOS ATUAIS ---\n\n' + formatStateData(state);
    } else {
      prompt += '\n\n(Não incluí meus dados pessoais. Forneça sugestões genéricas baseadas nas informações que eu fornecer em seguida.)';
    }
    return appendJobDescription(prompt, jobDescription);
  }

  function buildSectionPrompt(sectionId, state, includeData, jobDescription) {
    const label = EuGeroConfig.SECTION_LABELS?.[sectionId]
      || EuGeroConfig.SECTIONS.find(s => s.id === sectionId)?.title
      || 'esta seção';
    const instruction = SECTION_PROMPTS[sectionId] || 'Ajude-me com esta seção do currículo.';
    let prompt = `Estou preenchendo a seção "${label}" do meu currículo.\n\n${instruction}\n\nSe houver uma descrição de vaga, use-a apenas como referência para destacar informações verdadeiras e relevantes. Não invente experiências nem repita palavras-chave de forma artificial. Caso falte algo importante, faça perguntas objetivas antes de sugerir a versão final. Apresente textos claros, curtos e prontos para copiar e colar.`;
    if (includeData) {
      prompt += '\n\n--- MEU CURRÍCULO COMPLETO ATÉ AGORA (foque na seção "' + label + '", mas use o restante como contexto) ---\n\n' + formatStateData(state);
    } else {
      prompt += '\n\n(Não incluí meus dados. Aguardo fornecer as informações necessárias.)';
    }
    return appendJobDescription(prompt, jobDescription);
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
