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
    'personal', 'summary', 'experiences', 'education', 'skills', 'languages'
  ];

  const SECTION_LABELS = {
    personal: 'Dados pessoais',
    summary: 'Resumo',
    experiences: 'Experiência',
    education: 'Formação',
    skills: 'Habilidades',
    languages: 'Idiomas',
    certifications: 'Certificações',
    projects: 'Projetos'
  };

  const SECTIONS = [
    {
      id: 'personal',
      title: 'Dados pessoais',
      description: 'Comece pelas informações usadas para identificar seu currículo e entrar em contato com você.',
      linkedinHint: 'Perfil → foto de capa → seção de introdução no topo do perfil',
      fields: [
        { key: 'fullName', label: 'Nome para o currículo', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Digite o nome que deseja usar', tip: 'Use o nome pelo qual deseja ser apresentado. Não inclua números de documentos.' },
        { key: 'headline', label: 'Cargo ou área desejada', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Informe o cargo ou a área que busca', tip: 'Use um cargo ou uma área clara. Quando fizer sentido, use o mesmo termo adotado nas vagas que procura.' },
        { key: 'email', label: 'E-mail', type: 'email', required: true, minLength: 5, placeholder: 'Digite seu e-mail', tip: 'Use um e-mail que você acessa com frequência.' },
        { key: 'phone', label: 'Telefone', type: 'tel', required: false, minLength: 8, placeholder: 'Digite seu telefone com DDD', tip: 'Inclua o DDD e um número em que possa receber ligações ou mensagens.' },
        { key: 'location', label: 'Cidade', type: 'text', required: true, minLength: 3, placeholder: 'Digite sua cidade e estado', tip: 'Informe apenas a cidade e o estado. Não é necessário incluir o endereço completo.' },
        { key: 'linkedinUrl', label: 'LinkedIn (opcional)', type: 'url', required: false, minLength: 10, placeholder: 'Cole o link do seu perfil', tip: 'Adicione o endereço do seu perfil, caso queira incluí-lo.' }
      ]
    },
    {
      id: 'summary',
      title: 'Resumo',
      description: 'Escreva duas ou três frases sobre sua experiência, suas principais habilidades e o tipo de oportunidade que busca.',
      linkedinHint: 'Perfil → seção "Sobre" → editar',
      fields: [
        { key: 'summary', label: 'Um parágrafo curto sobre você', type: 'textarea', rows: 7, required: true, minLength: 45, actionVerbs: true, fullWidth: true, placeholder: 'Escreva um breve resumo sobre seu perfil', tip: 'Inclua sua área, experiências e habilidades mais relevantes. Use termos da vaga somente quando eles representarem de verdade o seu perfil.' }
      ]
    },
    {
      id: 'experiences',
      title: 'Experiência',
      description: 'Conte onde realizou suas atividades e o que fazia. Inclua efeitos ou resultados quando essa informação existir. Trabalhos formais, informais, por conta própria ou voluntários também podem ser incluídos.',
      linkedinHint: 'Perfil → seção "Experiência" → adicionar experiência',
      list: true,
      itemFields: [
        { key: 'title', label: 'Cargo ou função', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Informe seu cargo ou função', tip: 'Use um nome de função claro e conhecido. Se o título usado pela empresa for pouco comum, acrescente uma forma equivalente entre parênteses, sem alterar o sentido.' },
        { key: 'company', label: 'Empresa, organização ou projeto', type: 'text', required: true, minLength: 2, placeholder: 'Informe onde realizou essa atividade', tip: 'Informe o nome da empresa, organização ou projeto. Se foi por conta própria, escreva “Trabalho independente”.' },
        { key: 'period', label: 'Período', type: 'text', required: false, minLength: 0, placeholder: 'Mês e ano de início e fim', tip: 'Informe o mês e o ano de início e fim. Marque “Até hoje” se ainda realiza essa atividade.' },
        { key: 'description', label: 'Atividades e resultados', type: 'textarea', required: true, minLength: 45, actionVerbs: true, fullWidth: true, placeholder: 'Descreva o que você fez', tip: 'Descreva suas atividades, os conhecimentos ou as ferramentas usadas e os resultados relevantes. Use termos específicos e verdadeiros, sem repetir palavras apenas para aumentar a correspondência com a vaga.' }
      ]
    },
    {
      id: 'education',
      title: 'Formação',
      description: 'Inclua formações, cursos, oficinas ou outras atividades de aprendizagem relevantes. Comece pelo item mais recente.',
      linkedinHint: 'Perfil → seção "Formação acadêmica" → adicionar formação',
      list: true,
      itemFields: [
        { key: 'degree', label: 'Curso ou formação', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Digite o nome da formação', tip: 'Informe o nome completo do curso, da formação ou da atividade de aprendizagem. Evite abreviações pouco conhecidas.' },
        { key: 'institution', label: 'Instituição', type: 'text', required: true, minLength: 3, placeholder: 'Nome da instituição', tip: 'Informe o nome completo da escola, faculdade, plataforma ou instituição.' },
        { key: 'period', label: 'Período', type: 'text', required: false, minLength: 0, placeholder: 'Ano de conclusão ou período cursado', tip: 'Informe o ano de conclusão ou o período em que estudou.' }
      ]
    },
    {
      id: 'skills',
      title: 'Habilidades',
      description: 'Liste habilidades, ferramentas, tecnologias e formas de trabalhar que sejam relevantes para a oportunidade desejada.',
      linkedinHint: 'Perfil → seção "Competências" → adicionar competência',
      fields: [
        { key: 'skillsText', label: 'Digite uma habilidade', type: 'skillsTags', required: false, minLength: 2, fullWidth: true, tip: 'Priorize conhecimentos relacionados à vaga. Use os nomes mais conhecidos no mercado e adicione somente habilidades que você realmente possui.', placeholder: 'Digite uma habilidade…' }
      ]
    },
    {
      id: 'languages',
      title: 'Idiomas',
      description: 'Informe os idiomas que conhece e seu nível em cada um.',
      linkedinHint: 'Perfil → seção "Idiomas" → adicionar idioma',
      list: true,
      itemFields: [
        { key: 'language', label: 'Idioma', type: 'text', required: true, minLength: 2, placeholder: 'Digite o idioma', tip: 'Inclua os idiomas que deseja apresentar e escolha o nível que melhor representa seu uso atual.' },
        { key: 'level', label: 'Nível', type: 'select', required: false, minLength: 0, options: ['Básico', 'Intermediário', 'Avançado', 'Fluente'] }
      ]
    },
    {
      id: 'certifications',
      title: 'Certificações',
      description: 'Inclua cursos, certificações e treinamentos que você concluiu. Cursos online também contam.',
      linkedinHint: 'Perfil → seção "Licenças e certificados" → adicionar',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do curso ou certificação', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Nome do curso ou da certificação', tip: 'Informe o nome completo do curso, treinamento ou certificação. Evite siglas sem escrever também o nome por extenso.' },
        { key: 'issuer', label: 'Instituição', type: 'text', required: true, minLength: 2, placeholder: 'Instituição responsável', tip: 'Informe o nome completo da instituição ou plataforma responsável.' },
        { key: 'year', label: 'Ano', type: 'text', required: false, minLength: 0, placeholder: 'Ano de conclusão', tip: 'Informe o ano em que concluiu.' }
      ]
    },
    {
      id: 'projects',
      title: 'Projetos',
      description: 'Inclua projetos de estudo, da comunidade, do trabalho ou feitos por iniciativa própria.',
      linkedinHint: 'Perfil → seção "Projetos" → adicionar projeto',
      list: true,
      itemFields: [
        { key: 'name', label: 'Nome do projeto', type: 'text', required: true, minLength: 3, fullWidth: true, placeholder: 'Nome do projeto ou da iniciativa', tip: 'Informe o nome do projeto ou da iniciativa.' },
        { key: 'description', label: 'Sua participação', type: 'textarea', required: true, minLength: 30, actionVerbs: true, fullWidth: true, placeholder: 'Descreva o que você fez no projeto', tip: 'Explique sua participação, as ferramentas ou os conhecimentos usados e os resultados, quando houver. Inclua termos da área somente quando corresponderem ao que você fez.' },
        { key: 'url', label: 'Link (opcional)', type: 'url', required: false, minLength: 0, fullWidth: true, placeholder: 'Link para o projeto', tip: 'Adicione um link para o projeto, caso ele possa ser visto online.' }
      ]
    }
  ];

  // 20 modelos. Todos pensados para uma vaga real (estéticos e legíveis); os
  // marcados atsFriendly: false têm coluna/selo e são os mais "criativos".
  // thumbAccent tinge o cartão de escolha; a prévia e o PDF usam o CSS do tema.
  const TEMPLATES = {
    classic: {
      id: 'classic', name: 'Clássico', description: 'Limpo, discreto e profissional',
      layout: 'centered', thumbAccent: '#334155', atsFriendly: true
    },
    minimal: {
      id: 'minimal', name: 'Minimalista', description: 'Simples, leve e alinhado à esquerda',
      layout: 'left', thumbAccent: '#334155', atsFriendly: true
    },
    serifado: {
      id: 'serifado', name: 'Serifado', description: 'Tradicional, com letras serifadas',
      layout: 'centered', thumbAccent: '#2b2b2d', atsFriendly: true
    },
    elegant: {
      id: 'elegant', name: 'Elegante', description: 'Centralizado, leve e bem espaçado',
      layout: 'centered', thumbAccent: '#334155', atsFriendly: true
    },
    linha: {
      id: 'linha', name: 'Linha', description: 'Títulos com linhas finas e visual discreto',
      layout: 'centered', thumbAccent: '#334155', atsFriendly: true
    },
    pilar: {
      id: 'pilar', name: 'Pilar', description: 'Títulos com uma barra lateral de destaque',
      layout: 'left', thumbAccent: '#334155', atsFriendly: true
    },
    grafite: {
      id: 'grafite', name: 'Grafite', description: 'Tons de grafite e títulos mais marcantes',
      layout: 'left', thumbAccent: '#374151', atsFriendly: true
    },
    esmeralda: {
      id: 'esmeralda', name: 'Esmeralda', description: 'Centralizado, com detalhes em verde-esmeralda',
      layout: 'centered', thumbAccent: '#0f766e', atsFriendly: true
    },
    petroleo: {
      id: 'petroleo', name: 'Petróleo', description: 'Barra lateral em azul-petróleo',
      layout: 'sidebar', thumbAccent: '#155e75', atsFriendly: false,
      atsNote: 'Este modelo divide o conteúdo em mais de uma área visual. Alguns sistemas podem misturar a ordem das informações. Para uma leitura mais segura, prefira um modelo de uma coluna.'
    },
    marinho: {
      id: 'marinho', name: 'Marinho', description: 'Faixa superior em azul-marinho',
      layout: 'banner', thumbAccent: '#1e3a5f', atsFriendly: true
    },
    bordo: {
      id: 'bordo', name: 'Bordô', description: 'Centralizado, com tom bordô e estilo tradicional',
      layout: 'centered', thumbAccent: '#7a2230', atsFriendly: true
    },
    ambar: {
      id: 'ambar', name: 'Âmbar', description: 'Alinhado à esquerda, com detalhes em âmbar',
      layout: 'left', thumbAccent: '#92400e', atsFriendly: true
    },
    oliva: {
      id: 'oliva', name: 'Oliva', description: 'Barra lateral em verde-oliva',
      layout: 'sidebar', thumbAccent: '#256345', atsFriendly: false,
      atsNote: 'Este modelo divide o conteúdo em mais de uma área visual. Alguns sistemas podem misturar a ordem das informações. Para uma leitura mais segura, prefira um modelo de uma coluna.'
    },
    modern: {
      id: 'modern', name: 'Moderno', description: 'Barra lateral clara, com detalhes em azul',
      layout: 'sidebar', thumbAccent: '#5980a6', atsFriendly: false,
      atsNote: 'Este modelo divide o conteúdo em mais de uma área visual. Alguns sistemas podem misturar a ordem das informações. Para uma leitura mais segura, prefira um modelo de uma coluna.'
    },
    executive: {
      id: 'executive', name: 'Executivo', description: 'Faixa superior escura e visual formal',
      layout: 'banner', thumbAccent: '#1d2d3d', atsFriendly: true
    },
    carvao: {
      id: 'carvao', name: 'Carvão', description: 'Faixa superior em preto-carvão',
      layout: 'banner', thumbAccent: '#1f2937', atsFriendly: true
    },
    faixa: {
      id: 'faixa', name: 'Faixa Clara', description: 'Faixa superior suave em azul-claro',
      layout: 'banner', thumbAccent: '#c9dcf0', atsFriendly: true
    },
    violeta: {
      id: 'violeta', name: 'Violeta', description: 'Centralizado, com detalhes em violeta',
      layout: 'centered', thumbAccent: '#573a8a', atsFriendly: true
    },
    creative: {
      id: 'creative', name: 'Criativo', description: 'Coluna única, com selo de iniciais',
      layout: 'creative', thumbAccent: '#5980a6', atsFriendly: false,
      atsNote: 'Este modelo usa um elemento gráfico no topo. Alguns sistemas podem ignorar ou reorganizar essa parte do conteúdo.'
    },
    rosado: {
      id: 'rosado', name: 'Rosado', description: 'Selo de iniciais em tom rosé, indicado para portfólios',
      layout: 'creative', thumbAccent: '#9f2544', atsFriendly: false,
      atsNote: 'Este modelo usa um elemento gráfico no topo. Alguns sistemas podem ignorar ou reorganizar essa parte do conteúdo.'
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
      margin: 'padrao',
      density: 'normal',
      pageMode: 'compact',
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
    const validIds = new Set(SECTIONS.map(s => s.id));
    const ordered = (enabledSections || DEFAULT_ENABLED_SECTION_IDS)
      .filter((id, index, list) => validIds.has(id) && list.indexOf(id) === index && id !== 'personal');
    return ['personal', ...ordered];
  }

  function getActiveSections(enabledSections) {
    const enabled = normalizeEnabledSections(enabledSections);
    return enabled.map(id => SECTIONS.find(s => s.id === id)).filter(Boolean);
  }

  function moveEnabledSection(enabledSections, movedId, targetId, placeAfter) {
    const ordered = normalizeEnabledSections(enabledSections);
    if (movedId === 'personal' || targetId === 'personal' || movedId === targetId) return ordered;
    if (!ordered.includes(movedId) || !ordered.includes(targetId)) return ordered;
    const withoutMoved = ordered.filter(id => id !== movedId);
    const targetIndex = withoutMoved.indexOf(targetId);
    withoutMoved.splice(targetIndex + (placeAfter ? 1 : 0), 0, movedId);
    return normalizeEnabledSections(withoutMoved);
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
    skills: 'Habilidades',
    languages: 'Idiomas',
    certifications: 'Certificações',
    projects: 'Projetos'
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
    moveEnabledSection,
    isSectionMandatory,
    SHORT_LABELS
  };
})();
