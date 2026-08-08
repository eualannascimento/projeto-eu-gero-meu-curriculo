/**
 * Valida PDFs reais das cinco famílias de layout.
 * Executar com: node tests/pdf-layout-validation.js
 */

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');

function loadScript(relativePath) {
  const filePath = path.join(__dirname, '..', relativePath);
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInThisContext(code, { filename: filePath });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pdfText(filePath) {
  return childProcess.execFileSync('pdftotext', [filePath, '-'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function pdfInfo(filePath) {
  return childProcess.execFileSync('pdfinfo', [filePath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

loadScript('js/utils.js');
loadScript('js/config.js');
loadScript('js/dates.js');
global.jspdf = require(path.join(__dirname, '..', 'js/vendor/jspdf.umd.min.js'));
loadScript('js/vendor/fonts-barlow.js');
loadScript('js/pdf-export.js');

const state = {
  ...EuGeroConfig.createEmptyState(),
  personal: {
    fullName: 'Maria da Silva',
    headline: 'Analista de Dados',
    email: 'maria@exemplo.com.br',
    phone: '(11) 99999-0000',
    location: 'São Paulo, SP',
    linkedinUrl: 'https://www.linkedin.com/in/maria-da-silva'
  },
  summary: 'Analista de dados com experiência em produtos digitais, métricas de negócio e melhoria de processos.',
  experiences: [{
    title: 'Analista de Dados',
    company: 'Empresa Exemplo',
    startDate: '2021-01',
    endDate: '',
    endCurrent: true,
    description: 'Analisei indicadores, construí relatórios e apoiei decisões de produto com resultados mensuráveis.'
  }],
  education: [{
    degree: 'Bacharelado em Sistemas de Informação',
    institution: 'Universidade Exemplo',
    startDate: '2017-01',
    endDate: '2020-12'
  }],
  skillsText: 'SQL; Python; Excel; Power BI',
  languages: [{ language: 'Inglês', level: 'Intermediário' }]
};

const layouts = {
  centered: 'classic',
  left: 'minimal',
  banner: 'executive',
  sidebar: 'modern',
  creative: 'creative'
};

const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eugero-pdf-layout-'));

try {
  const sections = EuGeroConfig.getActiveSections(state.enabledSections);
  Object.entries(layouts).forEach(([layout, template]) => {
    const doc = EuGeroPdfExport.generatePdf(
      state,
      sections,
      template,
      state.margin,
      state.density,
      state.pageMode
    );
    const filePath = path.join(outputDir, `${layout}.pdf`);
    fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')));

    const info = pdfInfo(filePath);
    const text = pdfText(filePath);
    assert(/^Pages:\s+1$/m.test(info), `${layout}: o PDF deveria ter uma página`);
    assert(/^Page size:\s+595\.28 x 841\.89 pts \(A4\)$/m.test(info), `${layout}: o PDF deveria usar A4`);
    const normalizedText = text.toLocaleLowerCase('pt-BR');
    assert(normalizedText.includes('maria da silva') && normalizedText.includes('analista de dados'), `${layout}: o texto deveria ser extraível`);
    console.log(`  ✓ ${layout}: A4, uma página e texto extraível`);
  });
} finally {
  fs.rmSync(outputDir, { recursive: true, force: true });
}

console.log('PDFs reais dos cinco layouts validados.');
