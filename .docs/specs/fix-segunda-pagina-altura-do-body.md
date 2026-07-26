# Segunda página em branco: a altura vinha do body, não do currículo

**Status:** Aprovado
**Data:** 2026-07-26

## 1. Resumo e Objetivo

O currículo sai em duas páginas no Safari, com a segunda em branco, e em uma página no Chrome. Cinco rodadas de correção mexeram em `#print-cv` sem resolver. A medição mostra que `#print-cv` ocupa no máximo 242,4 mm nas 80 combinações de personagem e modelo, bem abaixo de qualquer orçamento de folha: quem passa do limite é o `body`, que herda `min-height: 100vh` de `base.css` e não é neutralizado no bloco de impressão.

## 2. User Stories (Requisitos Funcionais)

* **US01:** Como candidato, quero que o currículo saia em uma página em qualquer navegador quando o conteúdo couber em uma página, para não entregar um PDF com folha em branco no fim.
* **US02:** Como candidato, quero que o documento impresso continue com as mesmas margens da prévia, para o PDF não sair cortado nem com espaçamento diferente do que vi na tela.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

* **Regra 01:** Na mídia de impressão, `html` e `body` não podem impor altura mínima. `min-height` e `height` voltam a `0` e `auto`.
* **Regra 02:** `@page` continua sem margem e a margem visual continua vindo do `--doc-padding` do documento (12/16/20 mm). Declarar a margem no `@page` e zerar o padding foi testado em 2026-07-26 e cortou o conteúdo: `.cv-executive .cv-banner` usa margem negativa de -2,444em para sangrar até perto da borda, e com padding zero essa sangria caía fora da caixa, onde `overflow: hidden` a recorta.
* **Regra 03:** Nada de altura fixa em milímetros na caixa de impressão. Foi assim que nasceu o defeito anterior (`min-height: 297mm` em `templates.css`, que a 96 dpi vira 297,13 mm).
* **Falha 01:** Se o conteúdo do candidato não couber em uma folha, o documento usa quantas folhas precisar. Recortar o excedente esconderia experiência sem o candidato perceber.
* **Limite 01:** `vh` na mídia de impressão não tem comportamento acordado entre motores. O Chrome resolve pela altura da folha; o Safari e a emulação de impressão do Chromium resolvem pela altura da janela. Nenhuma regra do projeto pode depender de `vh` na impressão.

## 4. Estrutura de Dados e Componentes

* **Alterado:** `css/print-preview.css` (bloco `@media print`).
* **Alterado:** `tests/smoke-test.js` (asserção sobre a regra nova).
* **Sem alteração:** `css/base.css` mantém `min-height: 100vh` para a tela, que é onde a regra faz sentido.

## 5. Critérios de Aceite (verificáveis por teste)

* [x] CA01: Dado o bloco de impressão, quando o CSS for lido, então `html, body` recebe `min-height: 0 !important`.
* [x] CA02: Dada a página de revisão em uma janela de 1600 px de altura, quando a mídia for `print`, então a altura do `body` é igual à do conteúdo, e não à da janela.
* [x] CA03: Dadas as 80 combinações de personagem e modelo, quando a mídia for `print`, então a altura total da página fica abaixo de 271,6 mm, que é a área útil de um A4 com a margem de 12,7 mm que o Safari aplica por padrão.
* [x] CA04: Dado um currículo com 12 experiências longas, quando a mídia for `print`, então nenhuma experiência desaparece.

## 6. Fora de Escopo

* Trocar o mecanismo de exportação. A impressão nativa continua sendo o caminho, e a decisão de descartar o jsPDF permanece registrada em `feat-pdf-direto-como-unico-caminho.md`.
* Controlar a margem que o usuário escolhe no diálogo do navegador.
* Reduzir o conteúdo do currículo para forçar uma página.
