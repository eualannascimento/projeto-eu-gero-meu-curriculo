# P0.4 - Unificar tipografia previa/PDF e medir paginas pelo DOM real

**Status:** Aprovado
**Data:** 2026-07-18

## 1. Resumo e Objetivo
A previa usa fonte-base em `px` (9px normal, 8px condensado) dentro de uma "maquete" de 370px de largura representando a pagina A4. A impressao reconverte esse valor com `calc(210mm * 9 / 370)`, o que produz ~14,5pt (normal) e ~12,9pt (condensado) no PDF real - bem maior do que o pretendido e maior do que a previa sugere. Isso faz um conteudo aparentemente cabendo em 1 pagina na previa ocupar 2 paginas no PDF. Alem disso, o indicador de "encaixe de 1 pagina" no painel de previa usava contagem de caracteres (`PAGE_CHAR_SOFT_LIMIT`/`PAGE_CHAR_HARD_LIMIT`) em vez de medir a altura real renderizada.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como usuario preenchendo o curriculo, quero que o numero de paginas mostrado na previa corresponda ao PDF exportado, para nao ser surpreendido por uma segunda pagina inesperada.
* **US02:** Como usuario, quero que a fonte do meu curriculo nunca fique menor que o limite seguro de legibilidade (10pt), tanto na previa quanto no PDF.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01:** Previa e impressao usam as mesmas unidades fisicas (`mm`/`pt`) para fonte, entrelinha, margens e altura de pagina - sem fator de conversao (`calc(210mm * X / 370)`) entre os dois contextos.
* **Regra 02:** Fonte-base nunca abaixo de 10pt: `--doc-font-size` normal = 10.5pt; condensado = 10pt (piso do guardrail, nao mais 8px/~12,9pt).
* **Regra 03:** Entrelinha nunca abaixo de 1,2: condensado passa de 1.18 para 1.2.
* **Regra 04:** Margens (padding da pagina) nunca abaixo de 12mm: estreita = 12mm, padrao = 16mm, confortavel = 20mm (substituindo os pares px assimetricos anteriores).
* **Regra 05:** O painel de previa principal (dentro de `.preview-a4-wrap`) mede a altura real renderizada (`scrollHeight`) contra a altura fisica de uma pagina A4 (297mm convertido em px via `96/25.4`) para decidir se o conteudo excede 1 pagina, em vez de usar a contagem de caracteres.
* **Regra 06:** Miniaturas de template (galeria de revisao, seletor de modelo) continuam usando a estimativa por caracteres (`EuGeroScoring.scorePageFit`) como fallback, pois nao sao renderizadas na largura fisica real da pagina.
* **Falha 01:** Se `container.scrollHeight` nao estiver disponivel (contexto sem DOM real, ex.: testes em Node), o calculo cai automaticamente para a estimativa por caracteres existente.

## 4. Estrutura de Dados e Componentes
* **Arquivo:** `css/style.css` - `.preview-content` e variantes (`cv-margin-*`, `cv-density-*`, `condensed-mode`), bloco `@media print`, `.preview-a4-wrap > .preview-content`, `.cv-page-limit`, `.preview-a4-body.preview-overflow::after`.
* **Arquivo:** `js/app.js` - constante `A4_BASE_WIDTH` (de `370` px arbitrario para `210 * 96 / 25.4`, equivalente fisico real) e `scaleReviewPreviews()`.
* **Arquivo:** `js/preview.js` - `updatePreview()` passa a medir a altura real (`isOverflowing`) em vez de so consultar `EuGeroScoring.scorePageFit`.

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: `css/style.css` nao contem mais o padrao `calc(210mm * ` (conversao removida) - teste de regressao por varredura de texto.
* [ ] CA02: `js/app.js` nao declara mais `A4_BASE_WIDTH = 370` (valor px arbitrario) - teste de regressao por varredura de texto.
* [ ] CA03: Fonte-base normal e condensada em `css/style.css` nunca ficam abaixo de 10pt - teste de regressao por varredura de texto/regex sobre os valores declarados.
* [ ] CA04: Verificacao manual no navegador: preencher conteudo suficiente para ultrapassar 1 pagina fisica e confirmar que (a) a previa mostra o indicador de overflow no ponto correto e (b) o PDF exportado (`printCv`) tem a mesma quantidade de paginas que a previa sugere.

## 6. Fora de Escopo
* Compositor de paginas com distribuicao automatica de blocos entre paginas, `break-inside: avoid` por item e paginacao com `data-page` (secao 10 do documento de evolucao) - fica para trabalho futuro de P1, por ser uma reestruturacao maior do HTML de renderizacao.
* Substituir `EuGeroScoring.scorePageFit` (estimativa por caracteres) no calculo do score agregado da tela de revisao - mantido como esta; a mudanca desta spec afeta apenas o indicador visual do painel de previa principal.
* Espera por `document.fonts.ready` antes de medir - nao implementado nesta spec; fontes tipicamente ja estao carregadas quando o usuario interage com o formulario.
