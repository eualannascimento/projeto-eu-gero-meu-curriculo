# Chore: Utilitario compartilhado (escapeHtml/escapeAttr/debounce)

**Status:** Aprovado
**Data:** 2026-07-18

## 1. Resumo e Objetivo
`escapeHtml` esta duplicada em `js/app.js`, `js/preview.js` e `js/linkedin-guide.js` (a versao de `linkedin-guide.js` nem escapa aspas simples). `debounce` so existe em `js/app.js`. Este chore extrai as tres para um modulo unico `js/utils.js`, eliminando divergencia de implementacao sem mudar comportamento visivel.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como mantenedor, quero uma unica implementacao de escape de HTML/atributo, para nao correr risco de uma copia divergir e virar brecha de escaping.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01 (Sem mudanca de comportamento):** a saida de `escapeHtml`/`escapeAttr`/`debounce` deve ser identica a atual para os mesmos inputs.
* **Regra 02 (Padrao existente):** `EuGeroUtils` como IIFE global, carregado antes de `config.js` em `index.html`.

## 4. Estrutura de Dados e Componentes
* **Novo:** `js/utils.js` exporta `EuGeroUtils.escapeHtml`, `EuGeroUtils.escapeAttr`, `EuGeroUtils.debounce`.
* **Alterados:** `js/app.js`, `js/preview.js`, `js/linkedin-guide.js` passam a usar `EuGeroUtils.*` e removem suas copias locais.
* **`index.html`:** adiciona `<script src="js/utils.js">` antes de `js/config.js`.

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: `EuGeroUtils.escapeHtml` escapa `&`, `<`, `>`, `"` e aspas simples corretamente.
* [ ] CA02: `EuGeroUtils.escapeAttr` escapa `&`, `"`, `<`, `>`.
* [ ] CA03: `EuGeroUtils.debounce` atrasa a chamada e cancela chamadas anteriores dentro da janela.
* [ ] CA04: `node tests/smoke-test.js` continua passando sem alteracao de asercoes preexistentes.

## 6. Fora de Escopo
* Qualquer outra extracao de modulo (tratada em specs proprias).
