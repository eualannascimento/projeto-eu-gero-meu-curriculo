# Arquitetura do sistema

## Escopo

A aplicação cria currículos brasileiros no navegador. O fluxo contém oito seções: dados pessoais, resumo, experiências, formação, habilidades, idiomas, certificações e projetos. O PDF A4 é gerado localmente, cabe em uma página por padrão e aceita até duas quando o conteúdo exigir.

Não há conta, backend, analytics, sincronização, IA, Word, TXT ou QR Code.

## Estrutura

```text
index.html
css/
  base.css, layout.css, screens.css, responsive.css
  templates.css, print-preview.css, fonts.css
js/
  app.js, config.js, router.js, storage.js
  validation.js, scoring.js, preview.js, pdf-export.js
  dates.js, utils.js, a11y.js, sample-data.js, characters.js
  screens/start.js, screens/wizard.js, screens/review.js
  vendor/jspdf.umd.min.js, vendor/fonts-barlow.js
```

`app.js` mantém o estado da SPA e coordena as telas. `config.js` define os campos, as oito seções e as cinco famílias estruturais. `storage.js` mantém o rascunho e o backup JSON no dispositivo. `validation.js` fornece o gate compartilhado pelo wizard, revisão e download. `preview.js` e `pdf-export.js` usam o mesmo estado para mostrar e gerar o currículo.

## Fluxo de dados

1. A pessoa começa em branco, retoma um rascunho local ou importa JSON.
2. O estado em memória é normalizado e salvo no `localStorage` após cada alteração confirmada.
3. O wizard atualiza a prévia com as seções ativas e a ordem escolhida.
4. A revisão aplica o mesmo gate de validação e mede as páginas do PDF.
5. O download usa jsPDF local, fontes locais e uma das cinco famílias estruturais.

## Famílias visuais

`config.js` mantém uma entrada por estrutura: Clássico, Minimalista, Marinho, Petróleo e Criativo. Cada entrada informa o layout e a cor de destaque. A prévia e o PDF consultam esses metadados, evitando regras duplicadas por cor.

O Clássico é o padrão e usa uma coluna, indicada para leitura por ATS. Petróleo e Criativo mostram uma orientação quando a estrutura pode dificultar essa leitura.

## Qualidade

`node tests/smoke-test.js` executa os testes puros. A suíte cobre validação, persistência, segurança de URLs, catálogo, geração de PDF e o limite de duas páginas.
