# Chore: Content-Security-Policy (defesa em profundidade)

**Status:** Aprovado
**Data:** 2026-07-18

## 1. Resumo e Objetivo
O app roda 100% client-side, sem CSP declarada. Adicionar uma `Content-Security-Policy` restritiva reduz a superficie de ataque em caso de um XSS nao previsto (ex.: bloqueia `<script>` injetado ou `eval`), mesmo o app ja escapando corretamente todo dado do usuario hoje.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como mantenedor, quero uma CSP restritiva declarada, para que scripts externos ou inline injetados por um XSS nao previsto sejam bloqueados pelo navegador.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01 (Sem quebrar Google Fonts):** `style-src` e `font-src` devem permitir `fonts.googleapis.com`/`fonts.gstatic.com`.
* **Regra 02 (script-src restrito):** `script-src 'self'` - o app nao usa `<script>` inline nem `eval`, entao nenhuma excecao e necessaria.
* **Regra 03 (estilo inline necessario):** o app gera `style="..."` inline extensivamente via JS (sem nonce possivel em app estatico sem servidor); `style-src` mantem `'unsafe-inline'` para nao quebrar a UI.
* **Falha 01:** se a CSP bloquear um recurso legitimo (ex. fonte), o teste manual no Chrome deve pegar isso antes do merge.

## 4. Estrutura de Dados e Componentes
* **Alterado:** `index.html` - adiciona `<meta http-equiv="Content-Security-Policy" content="...">` no `<head>`.

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: `index.html` contem uma meta tag CSP com `default-src 'self'`, `script-src 'self'`, `object-src 'none'`.
* [ ] CA02: `node tests/smoke-test.js` continua passando.
* [ ] CA03: app carrega no Chrome sem erros de CSP no console (fontes, estilos e scripts carregam normalmente).

## 6. Fora de Escopo
* CSP via header HTTP real (exige servidor/configuracao de hosting; GitHub Pages so serve estatico, entao a meta tag e a unica opcao disponivel).
* Nonces ou hashes para estilo inline (exigiria build step, fora da stack vanilla sem bundler).
