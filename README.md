# Eu Gero Meu Curriculo

Aplicação web estática para criar currículos em PDF de uma ou duas páginas. Os dados ficam neste dispositivo e não são enviados a servidores.

## Funcionalidades

- Wizard com oito seções: dados pessoais, resumo, experiências, formação, habilidades, idiomas, certificações e projetos.
- Cinco famílias estruturais: Clássico, Minimalista, Marinho, Petróleo e Criativo. O Clássico é o padrão.
- Prévia ao vivo e revisão com indicação estrutural de leitura por ATS.
- PDF A4 com texto selecionável, uma página por padrão e até duas quando o conteúdo exigir.
- Backup JSON, importação validada, autosave e exclusão explícita dos dados locais.
- Roteamento por hash, incluindo `#/wizard/experiences`.

## Como usar

Abra `index.html` no navegador. Opcionalmente sirva localmente:

```bash
python3 -m http.server 8080
# http://localhost:8080
```

### URLs (deep links)

| Hash | Tela |
|------|------|
| `#/` | Escolha do ponto de partida |
| `#/start` | Escolha de template e secoes |
| `#/wizard/personal` | Wizard (secao especifica) |
| `#/review` | Revisao e exportacao |
| `#/guide` | Guia LinkedIn |

## Estrutura do projeto

```
index.html
css/
  fonts.css         Barlow self-hosted (substitui o CDN do Google)
  base.css          Tokens, header, botoes, cards, formularios, home antiga
  layout.css        Telas, layout do wizard, timeline, campos e listas
  templates.css     Preview A4 e estilos das cinco famílias estruturais
  print-preview.css Impressao, chips, controles de pagina, review, modais, toast
  responsive.css    Media queries, acessibilidade e ajustes mobile
js/
  config.js         Seções, campos, cinco famílias e metadados ATS
  dates.js          Mes/ano e formatacao de periodos
  scoring.js        Pontuação por qualidade e indicação de extensão
  validation.js     E-mail, URL, campos obrigatorios
  storage.js        localStorage + JSON
  preview.js        Prévia ao vivo
  characters.js     Personagens de exemplo (estados completos)
  linkedin-guide.js Guia LinkedIn
  router.js         Hash routing
  a11y.js           Modais acessiveis (Esc, focus trap)
  sample-data.js    Dados de exemplo
  app.js            Orquestracao
  screens/          Telas de início, wizard e revisão
  utils.js          Escape de HTML, sanitizacao de URL e debounce
tests/smoke-test.js
tests/e2e/               Jornadas em navegador com Playwright
scripts/                 Sintaxe, E2E, servidor local e pós-deploy
```

## Privacidade e funcionamento local

O currículo, a prévia, o PDF e o backup JSON são processados no navegador. O rascunho usa `localStorage`. Não há conta, backend, analytics, sincronização ou recursos de IA.

## Testes

```bash
npm run syntax
npm run smoke
npm run pdf
npm run e2e
```

`npm run ci` executa os quatro comandos na mesma ordem. O smoke cobre regras de preenchimento, validação, datas, rotas, PDF, JSON, persistência local, cinco famílias estruturais e dados de exemplo. O teste de PDF requer `pdfinfo` e `pdftotext`, fornecidos pelo Poppler.

Os E2E cobrem a jornada de começar em branco, retomar o rascunho, validar, revisar e exportar o PDF, além dos cenários responsivos em 320 CSS px. Eles dependem de `@playwright/test` e do Chromium do Playwright. `npm run e2e` encerra com uma mensagem explícita quando um deles não está instalado. Para preparar o ambiente local, execute `npm install --no-package-lock` e `npx playwright install chromium`.

O Playwright é uma dependência apenas de desenvolvimento, sob a licença Apache-2.0. Ele foi escolhido porque os testes precisam de um Chromium real para verificar foco, downloads, persistência entre recargas, medidas de alvos de toque e o layout em 320 CSS px. O pacote e os binários de navegador não integram os arquivos publicados da aplicação.

O repositório ainda não possui `package-lock.json`. A CI instala a versão exata declarada de `@playwright/test` sem criar lockfile no checkout temporário. Antes de uma publicação estável, gere e versione o lockfile para fixar dependências transitivas.

### Verificação pós-deploy

Após publicar, execute:

```bash
POST_DEPLOY_URL=https://classificavagas.com/resume/ npm run postdeploy-check
```

O comando busca `index.html`, confirma a raiz da aplicação e verifica o carregamento dos CSS, scripts do HTML e scripts carregados sob demanda pelo PDF. Ele falha se a URL não for informada, se algum arquivo responder com erro HTTP, se a resposta estiver vazia ou se a página não contiver a aplicação.

A workflow aceita a URL pelo input manual `postdeploy_url` ou pela variável de repositório `POST_DEPLOY_URL`. Com uma URL configurada, o job `postdeploy` executa a verificação depois do job de validação. Sem uma URL, o job informa explicitamente que a verificação foi ignorada. A CI instala `poppler-utils` antes de `npm run pdf`.

## Deploy (GitHub Pages)

1. Abra uma Pull Request. A workflow `.github/workflows/ci.yml` instala Poppler e executa sintaxe, smoke, PDF e E2E em Chromium.
2. Faça o deploy aprovado em `main` pelo repositório do site.
3. Execute a workflow manual com `postdeploy_url` ou configure `POST_DEPLOY_URL` para validar a URL publicada.
4. URL de produção: https://classificavagas.com/resume/ (o repositório do site sincroniza este conteúdo no deploy; ver `scripts/sync-resume.py` lá).

## Stack

HTML, CSS e JavaScript puro - sem framework, sem bundler.

## Licenca

MIT. Ver [LICENSE](./LICENSE).
