# P0.3 - Remover skeletons/placeholders do PDF exportado

**Status:** Aprovado
**Data:** 2026-07-18

## 1. Resumo e Objetivo
`printCv()` (`js/app.js`) chama `EuGeroPreview.render(state, state.template, activeSections())`, a mesma funcao usada pela previa ao vivo do editor. Secoes habilitadas mas vazias sao renderizadas com skeletons (`cv-section-skeleton`, linhas cinzas de preenchimento) e, no layout sidebar, com textos de placeholder ("Suas habilidades", "Seus idiomas"). Como a impressao usa o mesmo HTML, esses elementos de preenchimento podem ir parar no PDF final.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como usuario exportando o PDF, quando uma secao habilitada nao tem conteudo preenchido, quero que ela simplesmente nao apareca no documento, sem linhas cinzas de placeholder.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01:** `EuGeroPreview.render(state, templateId, enabledSections, mode)` aceita um quarto parametro `mode`, com `'editor'` como padrao (preserva o comportamento atual em todos os pontos de chamada existentes, que nao passam `mode`).
* **Regra 02:** Quando `mode === 'export'`, nenhuma secao vazia gera skeleton (`cv-section-skeleton`) nem texto de placeholder; a secao e omitida do HTML.
* **Regra 03:** `printCv()` em `js/app.js` passa `mode: 'export'` na chamada de `EuGeroPreview.render`.
* **Regra 04:** No layout sidebar (`renderSidebarLayout`), os blocos de Habilidades e Idiomas dentro da barra lateral tambem respeitam a regra 02: sem dados e em modo `export`, o bloco inteiro (titulo + placeholder) nao e renderizado.
* **Falha 01:** Uma secao com dados parciais (ex.: uma experiencia preenchida entre varias vazias) continua exibindo normalmente os itens preenchidos; a regra vale apenas para a secao inteiramente vazia.

## 4. Estrutura de Dados e Componentes
* **Arquivo:** `js/preview.js` - funcoes `render`, `buildContent`, `renderExperiences`, `renderEducation`, `renderSkills`, `renderLanguages`, `renderGenericList`, `renderSidebarLayout`, `updatePreview`.
* **Arquivo:** `js/app.js` - funcao `printCv()` (linha ~1514).
* Modos: `editor` (mostra skeleton, comportamento atual), `export` (nunca mostra skeleton/placeholder). O modo `review` citado no documento de evolucao geral fica fora desta spec (ver Fora de Escopo).

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: `EuGeroPreview.render(state, templateId, enabledSections, 'export')` com uma secao habilitada e vazia nao inclui `cv-section-skeleton` nem o titulo da secao vazia no HTML resultante.
* [ ] CA02: `EuGeroPreview.render(state, templateId, enabledSections)` (sem `mode`, comportamento padrao) continua incluindo `cv-section-skeleton` para secoes vazias, preservando o editor.
* [ ] CA03: `printCv()` chama `EuGeroPreview.render` com `'export'` como quarto argumento (teste de regressao por varredura de texto em `js/app.js`).

## 6. Fora de Escopo
* Modo `review` (revisao) com regras proprias de skeleton, conforme o documento geral de evolucao - tratar em spec futura de P1 (revisao em quatro dimensoes).
* Compositor de paginas por medicao real do DOM (P0.4).
