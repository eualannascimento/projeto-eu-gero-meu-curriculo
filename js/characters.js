/**
 * Personagens de exemplo para a tela de seleção (estilo "escolha seu personagem").
 * Figuras de domínio público, com contatos reservados para exemplo
 * (@exemplo.com.br e telefones de preenchimento) - risco zero.
 */
const EuGeroCharacters = (function () {
  'use strict';

  const SHERLOCK = {
    version: '1.0.0',
    template: 'executive',
    margin: 'padrao',
    density: 'condensado',
    currentStep: 0,
    enabledSections: ['personal', 'summary', 'experiences', 'education', 'skills', 'languages'],
    personal: {
      fullName: 'Sherlock Holmes',
      headline: 'Analista de Inteligência | Investigação e Dados',
      email: 'sherlock.holmes@exemplo.com.br',
      phone: '(11) 99999-0001',
      location: 'Londres, Reino Unido',
      linkedinUrl: 'linkedin.com/in/sholmes-deduction'
    },
    summary: 'Profissional sênior com vasta experiência em inteligência analítica, resolução de problemas complexos e reconhecimento de padrões. Especialista em cruzar grandes volumes de dados (evidências) para gerar insights precisos e acionáveis. Histórico comprovado de redução de tempo na resolução de incidentes críticos em parceria com o setor público.',
    skillsText: 'Pensamento Crítico; Análise Preditiva; Resolução de Problemas; Investigação de Fraudes; Atenção a Detalhes; Comunicação Estratégica',
    experiences: [
      {
        company: 'Prática Privada (221B Baker St.)',
        title: 'Consultor Investigativo Sênior',
        period: '2016 - Atual',
        startDate: '', endDate: '', endCurrent: true,
        description: 'Desenvolveu e implementou metodologias de dedução lógica que aumentaram a taxa de elucidação de casos em 95%. Liderou a investigação independente de mais de 100 incidentes de alta complexidade, elaborando relatórios técnicos detalhados para tomada de decisão.'
      },
      {
        company: 'Scotland Yard',
        title: 'Consultor Técnico Especialista',
        period: '2018 - Atual',
        startDate: '', endDate: '', endCurrent: true,
        description: 'Presta consultoria técnica sob demanda para diretores e inspetores. Otimizou processos de análise de cenas, reduzindo o tempo de triagem inicial de evidências pela metade através de protocolos inovadores.'
      }
    ],
    education: [
      {
        institution: 'Universidade de Oxford (Christ Church)',
        degree: 'Especialização em Química Forense e Metodologias Analíticas',
        period: '2008 - 2012',
        startDate: '', endDate: '', endCurrent: false
      }
    ],
    skills: [
      { name: 'Análise de Dados Complexos' },
      { name: 'Reconhecimento de Padrões' },
      { name: 'Gestão de Crises' },
      { name: 'Criminologia Aplicada' },
      { name: 'Engenharia Social' },
      { name: 'Elaboração de Relatórios Técnicos' }
    ],
    languages: [
      { language: 'Inglês', level: 'Nativo' },
      { language: 'Francês', level: 'Fluente' },
      { language: 'Alemão', level: 'Intermediário' }
    ],
    certifications: [],
    projects: [
      {
        name: 'Classificação Analítica de Evidências Residuais',
        description: 'Criação de um banco de dados empírico catalogando 140 variáveis de resíduos de tabaco, padronizando a coleta de provas no setor investigativo.',
        url: ''
      }
    ]
  };

  const MULAN = {
    version: '1.0.0',
    template: 'executive',
    margin: 'padrao',
    density: 'condensado',
    currentStep: 0,
    enabledSections: ['personal', 'summary', 'experiences', 'education', 'skills', 'languages'],
    personal: {
      fullName: 'Hua Mulan',
      headline: 'Gerente de Operações | Liderança de Equipes',
      email: 'mulan.hua@exemplo.com.br',
      phone: '(11) 99999-0002',
      location: 'Vale do Rio Amarelo, China',
      linkedinUrl: ''
    },
    summary: 'Gerente de operações com experiência em liderança de equipes de alto desempenho em ambientes de pressão extrema. Reconhecida por assumir desafios acima da própria função e entregar resultados consistentes. Forte atuação em planejamento estratégico, logística de campo e desenvolvimento de pessoas.',
    skillsText: 'Liderança de Equipes; Planejamento Estratégico; Logística de Campo; Adaptabilidade; Disciplina e Consistência; Comunicação Interpessoal',
    experiences: [
      {
        company: 'Guarda Imperial',
        title: 'Gerente de Operações de Campo',
        period: '2019 - Atual',
        startDate: '', endDate: '', endCurrent: true,
        description: 'Lidera uma equipe de 40 pessoas em operações críticas com metas agressivas. Reestruturou a rotina de treinamento e logística, elevando a prontidão operacional da unidade em 60% e reduzindo desperdício de suprimentos em 25%.'
      },
      {
        company: 'Negócios da Família Hua',
        title: 'Coordenadora de Produção e Logística',
        period: '2015 - 2019',
        startDate: '', endDate: '', endCurrent: false,
        description: 'Coordenou a produção agrícola e a distribuição local dos produtos da família. Organizei rotas de entrega e controle de estoque, aumentando a margem das vendas em 30% em duas temporadas.'
      }
    ],
    education: [
      {
        institution: 'Academia Imperial de Estratégia',
        degree: 'Formação em Estratégia, Tática e Gestão de Pessoas',
        period: '2011 - 2015',
        startDate: '', endDate: '', endCurrent: false
      }
    ],
    skills: [
      { name: 'Liderança pelo Exemplo' },
      { name: 'Gestão de Operações' },
      { name: 'Tomada de Decisão sob Pressão' },
      { name: 'Treinamento e Mentoria' },
      { name: 'Resolução de Conflitos' },
      { name: 'Precisão Técnica (Arquearia)' }
    ],
    languages: [
      { language: 'Mandarim', level: 'Nativo' },
      { language: 'Português', level: 'Fluente' }
    ],
    certifications: [],
    projects: [
      {
        name: 'Programa de Prontidão da Unidade',
        description: 'Desenhou um programa de treinamento progressivo que levou uma equipe iniciante ao nível de elite em 12 meses, com zero desistências.',
        url: ''
      }
    ]
  };

  const HERCULES = {
    version: '1.0.0',
    template: 'executive',
    margin: 'padrao',
    density: 'condensado',
    currentStep: 0,
    enabledSections: ['personal', 'summary', 'experiences', 'education', 'skills', 'languages'],
    personal: {
      fullName: 'Hércules (Heracles)',
      headline: 'Gerente de Projetos | Execução de Alta Complexidade',
      email: 'heracles.projetos@exemplo.com.br',
      phone: '(11) 99999-0003',
      location: 'Monte Olimpo, Grécia',
      linkedinUrl: ''
    },
    summary: 'Gerente de Projetos focado na execução de iniciativas de altíssima complexidade e prazos agressivos. Reconhecido pela resiliência, capacidade de lidar com pressão extrema e foco inabalável na entrega. Especialista em reverter cenários adversos, gerenciar riscos severos e otimizar infraestruturas físicas através de soluções não convencionais.',
    skillsText: 'Gerenciamento de Projetos (Cascata/Ágil); Resolução de Problemas; Gestão de Crises; Alta Resiliência; Otimização de Processos; Foco em Entregáveis',
    experiences: [
      {
        company: 'Micenas S.A. (Governo de Euristeu)',
        title: 'Project Manager Sênior (Portfólio 12 Trabalhos)',
        period: '2014 - 2022',
        startDate: '', endDate: '', endCurrent: false,
        description: "Gerenciou e entregou com sucesso 12 projetos classificados como de 'Risco Nível Máximo', cumprindo 100% do escopo original. Atuou ativamente na mitigação de ameaças biológicas (ex: controle populacional da Hidra) e na logística complexa de transporte de ativos internacionais."
      },
      {
        company: 'Expedição Argonautas',
        title: 'Coordenador de Segurança Operacional',
        period: '2012 - 2014',
        startDate: '', endDate: '', endCurrent: false,
        description: 'Responsável pela integridade física da equipe e pela proteção dos ativos da embarcação durante expedição de longo prazo. Garantiu a continuidade dos negócios frente a incidentes climáticos e operacionais imprevisíveis.'
      }
    ],
    education: [
      {
        institution: 'Academia Quíron de Excelência',
        degree: 'Bacharelado em Estratégia de Combate e Gestão de Sobrevivência',
        period: '2006 - 2010',
        startDate: '', endDate: '', endCurrent: false
      }
    ],
    skills: [
      { name: 'Entrega Focada em Resultados' },
      { name: 'Trabalho sob Alta Pressão' },
      { name: 'Resolução de Conflitos Físicos/Táticos' },
      { name: 'Adaptação Rápida a Mudanças' },
      { name: 'Pensamento Criativo (Out-of-the-box)' },
      { name: 'Liderança pelo Exemplo' }
    ],
    languages: [
      { language: 'Grego Antigo', level: 'Nativo' }
    ],
    certifications: [
      {
        name: 'Certificação PMP (Project Management Professional) - Equivalência Olimpo',
        issuer: 'Conselho do Monte Olimpo',
        year: '2015'
      }
    ],
    projects: [
      {
        name: 'Otimização Sanitária das Cavalariças de Áugias',
        description: 'Redesenhou a arquitetura hídrica local desviando o curso de dois rios, automatizando o processo de limpeza e reduzindo um backlog de 30 anos para apenas 24 horas.',
        url: ''
      }
    ]
  };

  const CHAPEUZINHO = {
    version: '1.0.0',
    template: 'executive',
    margin: 'padrao',
    density: 'condensado',
    currentStep: 0,
    enabledSections: ['personal', 'summary', 'experiences', 'education', 'skills', 'languages'],
    personal: {
      fullName: 'Chapeuzinho Vermelho',
      headline: 'Coordenadora de Logística | Entregas e Atendimento',
      email: 'chapeuzinho.logistica@exemplo.com.br',
      phone: '(11) 99999-0004',
      location: 'Vila da Floresta',
      linkedinUrl: ''
    },
    summary: "Profissional dinâmica focada em operações logísticas de 'última milha' (last-mile) e atendimento a clientes prioritários. Experiência comprovada no transporte seguro de cargas sensíveis (alimentos e itens de saúde) garantindo SLAs rigorosos. Altamente adaptável e treinada em gestão de crises e protocolos de segurança em ambientes de alto risco.",
    skillsText: 'Logística Last-Mile; Mapeamento de Rotas; Gestão de Prazos (SLA); Atendimento Humanizado; Gerenciamento de Riscos; Resolução Rápida de Problemas',
    experiences: [
      {
        company: 'Distribuidora Florestal / Contrato Familiar',
        title: 'Coordenadora de Entregas Prioritárias',
        period: '2021 - Atual',
        startDate: '', endDate: '', endCurrent: true,
        description: 'Responsável pela ponta da cadeia de suprimentos, garantindo a entrega de kits de saúde e nutrição para o público sênior em zonas remotas. Mantém uma taxa de 100% de precisão nos pedidos despachados e forte relacionamento com os clientes finais.'
      },
      {
        company: 'Comitê de Segurança da Rota dos Lenhadores',
        title: 'Analista de Mitigação de Riscos',
        period: '2023 - Atual',
        startDate: '', endDate: '', endCurrent: true,
        description: 'Mapeou vulnerabilidades na rota de entrega principal, elaborando um plano de contingência focado em desvios seguros e comunicação de emergência. A iniciativa reduziu a exposição da equipe a abordagens não autorizadas (predadores locais).'
      }
    ],
    education: [
      {
        institution: 'Ensino Domiciliar Aplicado',
        degree: 'Formação em Logística Básica, Botânica e Orientação Geográfica',
        period: '2020',
        startDate: '', endDate: '', endCurrent: false
      }
    ],
    skills: [
      { name: 'Otimização de Rotas (Routing)' },
      { name: 'Atendimento a Clientes VIP/Sênior' },
      { name: 'Aderência a Procedimentos de Segurança' },
      { name: 'Trabalho Autônomo e Proatividade' },
      { name: 'Controle de Qualidade de Produtos Perecíveis' },
      { name: 'Inteligência Emocional sob Estresse' }
    ],
    languages: [
      { language: 'Português', level: 'Nativo' }
    ],
    certifications: [
      {
        name: 'Workshop de Compliance e Prevenção a Fraudes de Identidade',
        issuer: 'Instituto de Segurança da Floresta',
        year: '2023'
      }
    ],
    projects: [
      {
        name: 'Protocolo de Verificação de Identidade (PVI)',
        description: 'Desenvolveu um checklist de 3 etapas (Orelhas, Olhos e Dentes) para validar a identidade do recebedor final, erradicando tentativas de fraude na entrega.',
        url: ''
      }
    ]
  };

  const CHARACTERS = [
    {
      id: 'blank',
      name: 'Em branco',
      role: 'Crie seu currículo do zero',
      initials: '+',
      tagline: 'Página em branco',
      avatarColor: null,
      state: null
    },
    {
      id: 'sherlock',
      name: 'Sherlock Holmes',
      role: 'Análise, pesquisa e solução de problemas',
      initials: 'SH',
      tagline: 'Exemplo pronto',
      avatarColor: '#3E5F73',
      state: SHERLOCK
    },
    {
      id: 'mulan',
      name: 'Hua Mulan',
      role: 'Liderança, planejamento e trabalho em equipe',
      initials: 'HM',
      tagline: 'Exemplo pronto',
      avatarColor: '#8E4A54',
      state: MULAN
    },
    {
      id: 'hercules',
      name: 'Hércules',
      role: 'Execução de projetos e resolução de desafios',
      initials: 'HC',
      tagline: 'Exemplo pronto',
      avatarColor: '#A3813F',
      state: HERCULES
    },
    {
      id: 'chapeuzinho',
      name: 'Chapeuzinho Vermelho',
      role: 'Organização, comunicação e atendimento',
      initials: 'CV',
      tagline: 'Exemplo pronto',
      avatarColor: '#7A5E8C',
      state: CHAPEUZINHO
    }
  ];

  function getById(id) {
    return CHARACTERS.find((c) => c.id === id) || null;
  }

  return { CHARACTERS, getById };
})();
