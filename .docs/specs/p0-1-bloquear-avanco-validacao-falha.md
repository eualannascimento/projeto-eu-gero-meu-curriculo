# P0.1 - Bloquear avanco quando ha erro de validacao

**Status:** Aprovado
**Data:** 2026-07-18

## 1. Resumo e Objetivo
`nextStep()` em `js/app.js` chama `validateCurrentStep()` mas descarta o retorno booleano, avancando de etapa mesmo com campos obrigatorios invalidos. O objetivo e impedir o avanco quando a etapa atual tiver erro de validacao.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como usuario preenchendo o wizard, quando clico em "Proximo" com um campo obrigatorio invalido, quero permanecer na etapa atual com o erro visivel, para nao chegar na revisao ou no PDF com dados incompletos.
* **US02:** Como usuario que corrige o campo apontado, quero conseguir avancar normalmente na proxima tentativa.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01:** `nextStep()` so avanca de etapa (ou vai para revisao) quando `validateCurrentStep()` retorna `true`.
* **Regra 02:** Quando a validacao falha, o comportamento ja existente de `validateCurrentStep()` deve continuar ocorrendo sem alteracao: toast de erro, foco no primeiro campo invalido, `aria-describedby` ligado a mensagem de erro (ja implementado em `setFieldInvalid`, `js/app.js:799`).
* **Regra 03:** A ultima etapa do wizard tambem respeita a regra: `goToReview()` so e chamado se a validacao passar.
* **Falha 01:** Se a etapa atual nao existir (`section` undefined) ou nao houver escopo de DOM (`els.wizardSteps` ausente), `validateCurrentStep()` ja retorna `true` (comportamento existente, mantido).

## 4. Estrutura de Dados e Componentes
* **Arquivo:** `js/app.js`, funcao `nextStep()` (linha ~566).
* Nenhuma mudanca de dados ou API. Alteracao puramente de controle de fluxo.

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: Dado um campo obrigatorio vazio na etapa atual, quando o usuario aciona `nextStep()`, entao `state.currentStep` nao muda.
* [ ] CA02: Dado todos os campos obrigatorios validos na etapa atual, quando o usuario aciona `nextStep()`, entao `state.currentStep` avanca em 1 (ou vai para revisao na ultima etapa).
* [ ] CA03: Teste de regressao no `tests/smoke-test.js` cobrindo os dois casos acima.

## 6. Fora de Escopo
* Redesenho de mensagens de erro, foco ou aria-live (ja implementados e fora desta spec).
* Revisao em quatro dimensoes (P1).
