/**
 * Configuração de seções, campos, dicas e verbos de ação.
 */
const EuGeroConfig = (function () {
  const ACTION_VERBS = [
    'implementei', 'liderei', 'desenvolvi', 'gerenciei', 'coordenei', 'otimizei',
    'criei', 'projetei', 'analisei', 'melhorei', 'reduzi', 'aumentei', 'automatizei',
    'organizei', 'treinei', 'mentorei', 'negociei', 'executei', 'conduzi', 'estabeleci',
    'planejei', 'supervisionei', 'revisei', 'documentei', 'apresentei', 'negociei',
    'alcancei', 'entreguei', 'construí', 'desenvolvi', 'implementei', 'realizei',
    'promovi', 'facilitei', 'resolvi', 'identifiquei', 'proponho', 'propus',
    'colabori', 'participei', 'contribuí', 'capacitei', 'estruturei', 'reestruturei'
  ];

  const REQUIRED_SECTION_IDS = ['personal'];
  const DEFAULT_ENABLED_SECTION_IDS = [
    'personal', 'summary', 'experiences', 'education', 'skills'
  ];

  const SECTION_LABELS = {
    personal: 'Dados Pessoais',
    summary: 'Resumo / Sobre',
    experiences: 'Experiências',
    education: 'Formação',
    skills: 'Habilidades',
    languages: 'Idiomas',
    certifications: 'Certificados',
    projects: 'Projetos',
    volunteering: 'Voluntariado',
    publications: 'Publicações',
    awards: 'Prêmios',
    organizations: 'Organizações',
    courses: 'Cursos'
  };

  const SECTIONS = [
    {
      id: 'personal',
      title: 'Dados Pessoais',
      description: 'Nome, contato e cargo desejado - base do currículo.',
      linkedinHint: 'Perfil → foto de capa → seção de introdução no topo do perfil',
      fields: [
        { key: 'fullName', label: 'Nome completo', type: 'text', required: true, minLength: 3, tip: 'Use seu nome como aparece em documentos oficiais. Evite apelidos.' },
        { key: 'headline', label: 'Cargo desejado / Título profissional', type: 'text', required: true, minLength: 10, tip: 'Descreva sua função e especialidade em uma linha. Ex: "Desenvolvedor Full Stack | React & Node.js"' },
        { key: 'email', label: 'E-mail', type: 'email', required: true, minLength: 5, tip: 'Use um e-mail profissional. Evite apelidos ou números aleatórios.' },
        { key: 'phone', label: 'Telefone', type: 'tel', required: false, minLength: 8, tip: 'Inclua DDD. Formato: (11) 99999-9999' },
        { key: 'location', label: 'Cidade / Estado', type: 'text', required: true, minLength: 3, tip: 'Informe cidade e estado. Ex: "São Paulo, SP"' },
        { key: 'linkedinUrl', label: 'URL do LinkedIn', type: 'url', required: false, minLength: 10, tip: 'Cole a URL completa do seu perfil. Será usada no QR Code do PDF.' }
      ]
    },
    {
      id: 'summary',
      title: 'Resumo / Sobre',
      description: 'Texto de apresentação profissional.',
      linkedinHint: 'Perfil → seção "Sobre" → editar',
      fields: [
        { key: 'summary', label: 'Resumo profissional', type: 'textarea', required: true, minLength: 100, actionVerbs: true, tip: 'Conte sua história em 3-4 parágrafos: quem você é, o que faz, principais conquistas e objetivo. Use verbos de ação e números quando possível.' }
      ]
    },
    {
      id: 'experiences',
      title: 'Experiências Profissionais',
      description: 'Histórico de trabalho e conquistas.',
      linkedinHint: 'Perfil → seção "Experiência" → adicionar experiência',
      list: true,
      itemFields: [
        { key: 'company', label: 'Empresa', type: 'text', required: true, minLength: 2, tip: 'Nome oficial da empresa.' },
        { key: 'title', label: 'Cargo', type: 'text', required: true, minLength: 3, tip: 'Título exato ou equivalente ao cargo exercido.' },
        { key: 'startDate', label: 'Início', type: 'monthYear', required: true, minLength: 4, tip: 'Selecione mês e ano de início.' },
        { key: 'endDate', label: 'Fim', type: 'monthYear', required: false, minLength: 0, tip: 'Marque "Até hoje" se ainda trabalha aqui.' },
        { key: 'description', label: 'Descrição das atividades', type: 'textarea', required: true, minLength: 50, actionVerbs: true, tip: 'Use bullet points mentais: verbos de ação + resultado mensurável. Ex: "Implementei sistema que reduziu tempo de processamento em 40%".' }
      ]
    },
    {
      id: 'education',
      title: 'Formação Acadêmica',
      description: 'Graduação, pós e cursos formais.',
      linkedinHint: 'Perfil → seção "Formação acadêmica" → adicionar formação',
      list: true,
      itemFields: [
        { key: 'institution', label: 'Instituição', type: 'text', required: true, minLength: 3, tip: 'Nome completo da universidade ou escola.' },
        { key: 'degree', label: 'Curso / Grau', type: 'text', required: true, minLength: 3, tip: 'Ex: Bacharelado em Ciência da Computação' },
        { key: 'startDate', label: 'Início', type: 'monthYear', required: false, minLength: 4, tip: 'Mês e ano de início.' },
        { key: 'endDate', label: 'Conclusão', type: 'monthYear', required: false, minLength: 4, tip: 'Marque "Até hoje" se ainda cursa.' }
      ]
    },
    {
      id: 'skills',
      title: 'Habilidades',
      description: 'Competências técnicas e comportamentais.',
      linkedinHint: 'Perfil → seção "Competências" → adicionar competência',
      fields: [
        { key: 'skillsText', label: 'Habilidades', type: 'skillsTags', required: false, minLength: 2, fullWidth: true, idealMax: 180, tip: 'Digite e pressione Enter ou ; para adicionar. Ex: JavaScript, React, Liderança', placeholder: 'Digite uma habilidade...' }
      ]
    },
    {
      id: 'languages',
      title: 'Idiomas',
      linkedinHint: 'Perfil → seção "Idiomas" → adicionar idioma',
      list: true,
      itemFields: [
        { key: 'language', label: 'Idioma', type: 'text', required: true, minLength: 2, tip: 'Ex: Inglês, Espanhol, Francês' },
        { key: 'level', label: 'Nível de proficiência', type: 'select', options: ['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'], required: true, minLength: 3, tip: 'Seja honesto - recrutadores podem testar em entrevistas.' }
      ]
    },
    {
      id: 'certifications',
      title: 'Certificados e Licenças',
      linkedinHint: 'Perfil → seção "Licenças e certificados" → adicionar',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do certificado', type: 'text', required: true, minLength: 3, tip: 'Nome oficial como aparece no certificado.' },
        { key: 'issuer', label: 'Emissor', type: 'text', required: true, minLength: 2, tip: 'Ex: AWS, Google, Coursera, Microsoft' },
        { key: 'date', label: 'Data de emissão', type: 'monthYear', required: false, minLength: 4, tip: 'Mês e ano de emissão.' },
        { key: 'url', label: 'URL (opcional)', type: 'url', required: false, minLength: 0, tip: 'Link para verificação do certificado, se disponível.' }
      ]
    },
    {
      id: 'projects',
      title: 'Projetos',
      linkedinHint: 'Perfil → seção "Projetos" → adicionar projeto',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do projeto', type: 'text', required: true, minLength: 3, tip: 'Nome claro que descreva o projeto.' },
        { key: 'description', label: 'Descrição', type: 'textarea', required: true, minLength: 30, actionVerbs: true, tip: 'Descreva objetivo, sua contribuição e resultados alcançados.' },
        { key: 'url', label: 'URL (opcional)', type: 'url', required: false, minLength: 0, tip: 'Link para repositório, demo ou portfólio.' }
      ]
    },
    {
      id: 'volunteering',
      title: 'Voluntariado',
      linkedinHint: 'Perfil → seção "Voluntariado" → adicionar experiência',
      list: true,
      itemFields: [
        { key: 'organization', label: 'Organização', type: 'text', required: true, minLength: 3, tip: 'Nome da ONG, instituição ou causa.' },
        { key: 'role', label: 'Cargo / Função', type: 'text', required: true, minLength: 3, tip: 'Sua função no voluntariado.' },
        { key: 'startDate', label: 'Início', type: 'monthYear', required: false, minLength: 4, tip: 'Mês e ano de início.' },
        { key: 'endDate', label: 'Fim', type: 'monthYear', required: false, minLength: 0, tip: 'Marque "Até hoje" se ainda atua.' },
        { key: 'description', label: 'Descrição', type: 'textarea', required: false, minLength: 20, actionVerbs: true, tip: 'Descreva suas contribuições e impacto gerado.' }
      ]
    },
    {
      id: 'publications',
      title: 'Publicações',
      linkedinHint: 'Perfil → seção "Publicações" → adicionar publicação',
      list: true,
      itemFields: [
        { key: 'title', label: 'Título', type: 'text', required: true, minLength: 5, tip: 'Título completo da publicação.' },
        { key: 'publisher', label: 'Publicação / Veículo', type: 'text', required: true, minLength: 2, tip: 'Revista, blog, conferência ou editora.' },
        { key: 'date', label: 'Data', type: 'monthYear', required: false, minLength: 4, tip: 'Mês e ano de publicação.' },
        { key: 'url', label: 'URL (opcional)', type: 'url', required: false, minLength: 0, tip: 'Link para a publicação online.' }
      ]
    },
    {
      id: 'awards',
      title: 'Prêmios e Honrarias',
      linkedinHint: 'Perfil → seção "Prêmios e honrarias" → adicionar',
      list: true,
      itemFields: [
        { key: 'title', label: 'Título do prêmio', type: 'text', required: true, minLength: 3, tip: 'Nome oficial do prêmio ou honraria.' },
        { key: 'issuer', label: 'Emissor', type: 'text', required: true, minLength: 2, tip: 'Organização que concedeu o prêmio.' },
        { key: 'date', label: 'Data', type: 'monthYear', required: false, minLength: 4, tip: 'Mês e ano do prêmio.' },
        { key: 'description', label: 'Descrição', type: 'textarea', required: false, minLength: 10, tip: 'Contexto e motivo do reconhecimento.' }
      ]
    },
    {
      id: 'organizations',
      title: 'Organizações',
      linkedinHint: 'Perfil → seção "Organizações" → adicionar',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome da organização', type: 'text', required: true, minLength: 3, tip: 'Associação, sindicato, grupo profissional etc.' },
        { key: 'role', label: 'Cargo / Função', type: 'text', required: true, minLength: 3, tip: 'Seu papel na organização.' },
        { key: 'startDate', label: 'Início', type: 'monthYear', required: false, minLength: 4, tip: 'Mês e ano de início.' },
        { key: 'endDate', label: 'Fim', type: 'monthYear', required: false, minLength: 0, tip: 'Marque "Até hoje" se ainda participa.' }
      ]
    },
    {
      id: 'courses',
      title: 'Cursos',
      linkedinHint: 'Perfil → seção "Cursos" → adicionar curso',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do curso', type: 'text', required: true, minLength: 3, tip: 'Nome do curso ou treinamento.' },
        { key: 'institution', label: 'Instituição', type: 'text', required: true, minLength: 2, tip: 'Plataforma ou instituição que ofereceu o curso.' },
        { key: 'date', label: 'Data de conclusão', type: 'monthYear', required: false, minLength: 4, tip: 'Mês e ano de conclusão.' }
      ]
    }
  ];

  const TEMPLATES = {
    classic: {
      id: 'classic', name: 'Clássico', description: 'Monocromático, limpo e profissional',
      layout: 'centered', thumbClass: 'template-thumb-classic',
      accentRgb: [30, 41, 59], textMuted: '#64748b', atsFriendly: true
    },
    modern: {
      id: 'modern', name: 'Moderno', description: 'Barra lateral azul',
      layout: 'sidebar', thumbClass: 'template-thumb-modern',
      sidebarRgb: [41, 98, 255], accentHex: '2962FF', atsFriendly: false,
      atsNote: 'Barra lateral: alguns ATS leem melhor layouts de coluna única.'
    },
    elegant: {
      id: 'elegant', name: 'Elegante', description: 'Tipografia serifada, acento dourado',
      layout: 'centered', thumbClass: 'template-thumb-elegant', serif: true,
      accentRgb: [146, 64, 14], accentHex: '92400E', atsFriendly: true
    },
    executive: {
      id: 'executive', name: 'Executivo', description: 'Faixa superior escura',
      layout: 'banner', thumbClass: 'template-thumb-executive',
      bannerRgb: [15, 23, 42], accentHex: '0F172A', atsFriendly: true
    },
    minimal: {
      id: 'minimal', name: 'Minimalista', description: 'Alinhado à esquerda, ultra limpo',
      layout: 'left', thumbClass: 'template-thumb-minimal',
      accentRgb: [100, 116, 139], accentHex: '64748B', atsFriendly: true
    },
    creative: {
      id: 'creative', name: 'Criativo', description: 'Barra lateral roxa',
      layout: 'sidebar', thumbClass: 'template-thumb-creative',
      sidebarRgb: [124, 58, 237], accentHex: '7C3AED', atsFriendly: false,
      atsNote: 'Barra lateral: prefira Clássico ou Minimalista para ATS rigorosos.'
    }
  };

  const TEMPLATE_IDS = Object.keys(TEMPLATES);

  function getTemplateMeta(templateId) {
    return TEMPLATES[templateId] || TEMPLATES.classic;
  }

  function isSidebarTemplate(templateId) {
    return getTemplateMeta(templateId).layout === 'sidebar';
  }

  const STORAGE_KEY = 'eugero-curriculo-state';
  const APP_VERSION = '1.0.0';

  function createEmptyState() {
    return {
      version: APP_VERSION,
      template: 'classic',
      currentStep: 0,
      enabledSections: [...DEFAULT_ENABLED_SECTION_IDS],
      personal: { fullName: '', headline: '', email: '', phone: '', location: '', linkedinUrl: '' },
      summary: '',
      skillsText: '',
      experiences: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
      projects: [],
      volunteering: [],
      publications: [],
      awards: [],
      organizations: [],
      courses: []
    };
  }

  function parseSkillsText(text) {
    if (!text || typeof text !== 'string') return [];
    return text.split(/[;,]/).map(s => s.trim()).filter(Boolean).map(name => ({ name }));
  }

  function skillsToText(state) {
    if (state.skillsText) return state.skillsText;
    if (state.skills?.length) {
      return state.skills.map(s => s.name || s).filter(Boolean).join('; ');
    }
    return '';
  }

  function getSkillsFromState(state) {
    if (state.skillsText) return parseSkillsText(state.skillsText);
    if (state.skills?.length) return state.skills;
    return [];
  }

  function normalizeEnabledSections(enabledSections) {
    const set = new Set([...REQUIRED_SECTION_IDS, ...(enabledSections || DEFAULT_ENABLED_SECTION_IDS)]);
    return SECTIONS.map(s => s.id).filter(id => set.has(id));
  }

  function getActiveSections(enabledSections) {
    const enabled = normalizeEnabledSections(enabledSections);
    return SECTIONS.filter(s => enabled.includes(s.id));
  }

  function isSectionMandatory(sectionId) {
    return REQUIRED_SECTION_IDS.includes(sectionId);
  }

  function createEmptyListItem(sectionId) {
    const section = SECTIONS.find(s => s.id === sectionId);
    if (!section || !section.itemFields) return {};
    const item = { endCurrent: false };
    section.itemFields.forEach(f => { item[f.key] = ''; });
    return item;
  }

  const SHORT_LABELS = {
    personal: 'Dados',
    summary: 'Resumo',
    experiences: 'Experiência',
    education: 'Formação',
    skills: 'Skills',
    languages: 'Idiomas',
    certifications: 'Certificados',
    projects: 'Projetos',
    volunteering: 'Voluntariado',
    publications: 'Publicações',
    awards: 'Prêmios',
    organizations: 'Organizações',
    courses: 'Cursos'
  };

  return {
    ACTION_VERBS,
    SECTIONS,
    SECTION_LABELS,
    TEMPLATES,
    TEMPLATE_IDS,
    getTemplateMeta,
    isSidebarTemplate,
    STORAGE_KEY,
    APP_VERSION,
    REQUIRED_SECTION_IDS,
    DEFAULT_ENABLED_SECTION_IDS,
    createEmptyState,
    createEmptyListItem,
    parseSkillsText,
    skillsToText,
    getSkillsFromState,
    normalizeEnabledSections,
    getActiveSections,
    isSectionMandatory,
    SHORT_LABELS
  };
})();
