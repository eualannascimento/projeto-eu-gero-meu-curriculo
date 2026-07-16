# Refactor: Modularização do app.js

**Status:** Aprovado
**Data:** 2026-07-16

## 1. Resumo e Objetivo

O `js/app.js` chegou a ~1800 linhas concentrando orquestração, renderização do wizard, tela inicial, personagens, review e preview embutido. Este refactor extrai módulos coesos sem mudar comportamento, para reduzir custo de manutenção e risco de regressão em mudanças de UI.

## 2. User Stories (Requisitos Funcionais)

* **US01:** Como mantenedor, quero módulos por tela (start, wizard, review), para localizar e alterar uma área sem ler o arquivo inteiro.
* **US02:** Como mantenedor, quero que a suíte `node tests/smoke-test.js` continue passando sem alteração de asserções, para garantir refactor sem mudança de comportamento.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

* **Regra 01 (Sem mudança de comportamento):** nenhuma alteração visual ou funcional; apenas movimentação de código e fronteiras de módulo.
* **Regra 02 (Padrão existente):** manter o padrão IIFE `EuGeroXxx` com script tags em `index.html` (sem bundler, conforme stack).
* **Regra 03 (Ordem de carga):** a ordem dos scripts em `index.html` deve respeitar as dependências entre módulos.
* **Falha 01:** se qualquer teste falhar após uma extração, reverter o passo antes de seguir (micro-commits por módulo extraído).

## 4. Estrutura de Dados e Componentes

Extrações candidatas (uma por commit):
* `js/screens/start.js`: tela inicial, seleção de template e personagens.
* `js/screens/wizard.js`: renderização de campos, timeline/fichas, chips de skills.
* `js/screens/review.js`: revisão, galeria de templates e exportação.
* `js/screens/prompt-modal.js`: modal de prompts IA, aviso de privacidade e cópia (necessário para cumprir o CA02).
* `js/app.js` restante: estado, roteamento entre telas e persistência.

## 5. Critérios de Aceite (verificáveis por teste)

* [ ] CA01: `node tests/smoke-test.js` passa sem nenhuma asserção alterada.
* [ ] CA02: `js/app.js` fica abaixo de 700 linhas.
* [ ] CA03: nenhum módulo novo acessa `localStorage` diretamente (somente via `EuGeroStorage`).

## 6. Fora de Escopo

* Divisão do `css/style.css` (avaliar em spec própria).
* Introdução de bundler, ESModules ou framework.
* Qualquer mudança de UX.
