# Task 8: CI, documentação e validação pós-deploy

## Entrega

1. Criado `package.json` com scripts para sintaxe, smoke, PDF, E2E, CI e verificação pós-deploy.
2. Criada a workflow de Pull Request em `.github/workflows/ci.yml`. Ela instala as dependências declaradas, instala o Chromium e roda `npm run ci`.
3. Criados `scripts/check-syntax.js`, `scripts/run-e2e.js`, `scripts/serve-static.js` e `scripts/check-published-site.js`.
4. Criado `tests/e2e/critical-flow.spec.js`, que cobre começar em branco, persistir e retomar rascunho, encontrar validação de resumo, revisar e baixar o PDF.
5. Atualizados `README.md` e `.docs/architecture.md` com comandos, escopo, limites de ATS, funcionamento offline e verificação pós-deploy.

## TDD e validação

1. Red: `node tests/e2e/critical-flow.spec.js` falhou com `MODULE_NOT_FOUND: @playwright/test`, confirmando que não havia ambiente E2E local.
2. `npm run syntax` passou e validou 28 arquivos JavaScript.
3. `npm run smoke` passou com 309 testes e nenhuma falha.
4. `npm run pdf` validou PDF A4 de uma página e texto extraível nos cinco layouts.
5. `npm run ci` completou sintaxe, smoke e PDF. No E2E, terminou com a falha prevista e explícita: `@playwright/test não está instalado`.
6. `POST_DEPLOY_URL=http://127.0.0.1:4173/ npm run postdeploy-check` validou a página e 26 recursos locais publicados.
7. `git diff --check` passou.

## Limitações

1. Não há `package-lock.json`, pois a geração exigiria acesso ao registro npm, não autorizado nesta execução. A CI usa `npm install --ignore-scripts --no-package-lock`, portanto não fixa dependências transitivas.
2. Playwright e seu Chromium não estão instalados no worktree. A execução real de E2E local permanece pendente até `npm install` e `npx playwright install chromium`.
3. A checagem pós-deploy foi executada contra o servidor local. A URL de produção ainda precisa ser validada após o próximo deploy.
