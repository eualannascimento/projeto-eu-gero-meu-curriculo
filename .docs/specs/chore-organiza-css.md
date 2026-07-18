# Chore: Divide css/style.css em arquivos por dominio

**Status:** Aprovado
**Data:** 2026-07-18

## 1. Resumo e Objetivo
`css/style.css` chegou a 3090 linhas concentrando tokens, layout de tela, os 20 templates de curriculo, impressao/modais e media queries. O `.docs/specs/refactor-modularizacao-app.md` ja registrava essa divisao como "fora de escopo, avaliar em spec propria". Este chore divide o arquivo em 5 arquivos coesos, sem mudar nenhum seletor, valor ou ordem de regra.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como mantenedor, quero localizar o CSS de uma area (ex: templates de curriculo) sem abrir um arquivo de 3090 linhas.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01 (Sem mudanca visual):** a divisao preserva a ordem exata das regras. A concatenacao dos 5 arquivos na ordem carregada em `index.html` e byte-a-byte identica ao `css/style.css` original (verificado com `diff`).
* **Regra 02 (Cascata preservada):** os `<link rel="stylesheet">` em `index.html` mantêm a mesma ordem relativa das secoes no arquivo original, para que a cascata CSS produza o mesmo resultado.
* **Falha 01:** se qualquer teste ou verificacao visual manual detectar diferenca, reverter a divisao.

## 4. Estrutura de Dados e Componentes
* **Novo:** `css/base.css` (tokens, header, botoes, blueprint cards, formularios, grids, home antiga)
* **Novo:** `css/layout.css` (telas, split layout, wizard e timeline, campos e listas)
* **Novo:** `css/templates.css` (preview A4, unidades fisicas de impressao, os 20 templates de curriculo)
* **Novo:** `css/print-preview.css` (impressao, moldura A4, chips de habilidade, controles de pagina, review, guia LinkedIn, modais, toast)
* **Novo:** `css/responsive.css` (media queries, acessibilidade, ajustes mobile, homepage minimalista)
* **Removido:** `css/style.css`
* **Alterado:** `index.html` (5 `<link>` no lugar de 1), `tests/smoke-test.js` (le todos os `css/*.css` concatenados), `README.md` (estrutura do projeto atualizada)

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: `node tests/smoke-test.js` passa sem nenhuma asserção alterada (apenas a fonte lida passa a ser a concatenacao de `css/*.css`).
* [ ] CA02: nenhum arquivo `css/*.css` novo excede 950 linhas.
* [ ] CA03: verificacao manual no Chrome confirma que a previa, os 20 templates e o PDF exportado renderizam identicos ao estado anterior.

## 6. Fora de Escopo
* Reduzir o uso de `!important` ou reorganizar regras (apenas mover, nao editar).
* Introduzir pre-processador (Sass/PostCSS) ou bundler.
