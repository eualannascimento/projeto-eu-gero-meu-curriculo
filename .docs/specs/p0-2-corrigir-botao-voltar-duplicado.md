# P0.2 - Corrigir o botao de voltar duplicado (btn-back-start)

**Status:** Aprovado
**Data:** 2026-07-18

## 1. Resumo e Objetivo
O elemento `#btn-back-start` (botao "Voltar" da tela de configuracao/inicio) recebe dois listeners de clique em `bindGlobalEvents()`, em `js/app.js`: um chama `navigateTo('characters')` (linha 180) e outro chama `goToStart()` (linha 196), que navega para `'start'`, a propria tela atual. No clique, os dois disparam na ordem de registro e o segundo sobrescreve o efeito do primeiro, fazendo o botao "Voltar" nao sair da tela de configuracao.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como usuario na tela de configuracao (escolha de secoes e modelo), quando clico em "Voltar", quero retornar a tela de escolha do ponto de partida ("characters"), para poder revisar minha selecao inicial.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01:** Cada id de botao de navegacao recebe exatamente um `addEventListener('click', ...)` em `bindGlobalEvents()`. Nao deve existir binding duplicado para o mesmo id.
* **Regra 02:** O mapeamento de navegacao "voltar" definido no documento de evolucao e mantido: configuracao -> pontos de partida; pontos de partida -> pagina inicial; wizard -> configuracao (ja correto via `btn-wizard-to-start`, linha 190); revisao -> wizard (ja correto via `btn-back-review`, linha 195).
* **Falha 01 (causa raiz):** O segundo listener em `js/app.js:196` (`btn-back-start` -> `goToStart`) e residuo de codigo e deve ser removido; nao corresponde a nenhum botao adicional no DOM (existe apenas um elemento com id `btn-back-start` em `index.html:92`).

## 4. Estrutura de Dados e Componentes
* **Arquivo:** `js/app.js`, funcao `bindGlobalEvents()` (linhas 172-196).
* Remover a linha 196 (`document.getElementById('btn-back-start')?.addEventListener('click', goToStart);`).
* Nenhuma mudanca de HTML ou CSS.

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: O id `btn-back-start` aparece no maximo uma vez como alvo de `addEventListener` em `js/app.js` (teste de regressao por varredura de texto, seguindo o padrao ja usado em `tests/smoke-test.js` para outras checagens de codigo-fonte).
* [ ] CA02: Verificacao manual no navegador: clicar em "Voltar" na tela de configuracao leva a tela de escolha do ponto de partida.

## 6. Fora de Escopo
* Redesenho da tela de "pontos de partida" (personagens) proposto no documento de evolucao (P1).
* Revisao do botao "Voltar" em outras telas (ja funcionam corretamente).
