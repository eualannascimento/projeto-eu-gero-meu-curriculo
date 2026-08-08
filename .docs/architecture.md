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

`npm run syntax` valida a sintaxe de todos os arquivos JavaScript do projeto. `npm run smoke` executa os testes puros de validação, persistência, segurança de URLs, catálogo, geração de PDF e limite de duas páginas. `npm run pdf` gera PDFs reais para as cinco famílias e depende de `pdfinfo` e `pdftotext` do Poppler.

`npm run e2e` usa Playwright e sobe o servidor estático local quando `E2E_BASE_URL` não é informado. A jornada crítica percorre início em branco, persistência e retomada local, validação, revisão e download do PDF. A jornada responsiva cobre desktop e 320 CSS px. O script verifica `@playwright/test` e o Chromium antes de executar. Se um dos dois estiver ausente, falha com mensagem específica; isso evita reportar E2E como executável sem ambiente de navegador.

`.github/workflows/ci.yml` roda em Pull Requests e por acionamento manual. Ela instala Poppler, as dependências declaradas e o Chromium do Playwright antes de chamar `npm run ci`. O repositório ainda não versiona `package-lock.json`, portanto a instalação da CI não fixa dependências transitivas. Esta limitação está documentada e deve ser removida com um lockfile versionado.

`npm run postdeploy-check` recebe `POST_DEPLOY_URL`. Ele busca a página publicada, confirma a raiz da aplicação e valida os CSS, scripts do HTML e scripts de PDF carregados sob demanda. O job `postdeploy` usa o input manual `postdeploy_url` ou a variável de repositório `POST_DEPLOY_URL`. Se nenhum valor estiver configurado, o job registra explicitamente que a verificação foi ignorada.

O Playwright permanece restrito ao ambiente de desenvolvimento e teste, sob a licença Apache-2.0. O navegador real é necessário para verificar foco, download, persistência, alvos de toque e o viewport de 320 CSS px. O pacote e os binários do Chromium não fazem parte da aplicação estática publicada.

## Limitações conhecidas

A indicação de ATS avalia a estrutura do currículo, não simula nem certifica sistemas de recrutamento. O aplicativo funciona sem rede depois que os arquivos estáticos são carregados, mas fontes, scripts e o HTML precisam estar disponíveis no primeiro acesso. Autosave, backup e exclusão permanecem locais ao navegador; não há sincronização entre dispositivos.
