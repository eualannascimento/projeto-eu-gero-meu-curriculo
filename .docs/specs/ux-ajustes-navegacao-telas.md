# Ajustes de Navegação e Telas (Home, Characters, Start, Wizard)

**Status:** Aprovado (requisitos ditados pelo usuário em 2026-07-17)
**Data:** 2026-07-17

## 1. Resumo e Objetivo

Um pacote de ajustes de UX pedido pelo usuário: corrigir a rota inicial, deixar a homepage minimalista sem scroll, e melhorar navegação/limpeza nas telas de personagens, configuração (start) e wizard.

## 2. User Stories (Requisitos Funcionais)

* **US01:** Como visitante, quero que abrir o site me leve à home (`#/`), não ao meio do fluxo.
* **US02:** Como visitante no celular ou desktop, quero uma home enxuta que caiba na tela, com os mesmos textos nas duas larguras.
* **US03:** Como candidato, quero ver "Em branco" como a primeira opção de ponto de partida.
* **US04:** Como candidato na configuração, quero uma lista de seções compacta, sem botões de exemplo/limpeza, e um "Voltar" para escolher outro ponto de partida.
* **US05:** Como candidato no wizard, quero voltar à configuração e poder remover do currículo uma seção opcional que habilitei antes.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

* **Regra 01 (Rota inicial):** sem hash na URL, a view inicial é sempre `home`. Deep links por hash (`#/wizard/...`) continuam funcionando.
* **Regra 02 (Sem sample automático):** o estado inicial de um visitante novo é vazio (`createEmptyState`), não mais o exemplo "Rafael Nunes". O exemplo real de conteúdo passa a vir da tela de personagens.
* **Regra 03 (Home minimalista):** título em no máximo 2 linhas; "Como funciona" vira um gatilho compacto (tooltip/`?`) em vez de uma seção; sem versões curtas só-mobile - os textos são os mesmos nas duas larguras.
* **Regra 04 (Em branco primeiro):** no mobile, a barra "Em branco" que ocupa a linha inteira aparece no topo do grid.
* **Regra 05 (Start):** remover botões "Ver com exemplo pronto" (`btn-fill-sample`) e "Limpar tudo" (`btn-clear-all`) e suas funções órfãs; reduzir o padding vertical dos itens do checklist; adicionar "Voltar" que leva a `characters`.
* **Regra 06 (Wizard):** botão "Voltar" sempre visível levando a `start`; para seções não obrigatórias, uma ação "Remover esta seção" que desabilita a seção e reposiciona o passo atual. Seções obrigatórias (`personal`, `summary`, `skills`) não têm essa ação.
* **Falha 01:** ao remover a última seção opcional ativa estando no último passo, o wizard reajusta `currentStep` para um passo válido.

## 4. Estrutura de Dados e Componentes

* `js/router.js` / `js/app.js`: `init` força `home` sem hash.
* `js/storage.js`: `initialState` retorna estado vazio.
* `js/characters.js`: ordem do array `CHARACTERS`.
* `index.html` + `css/style.css`: home, start (botões, checklist), wizard (voltar).
* `js/app.js`: handlers, `renderWizardStep` (ações da seção), `renderSectionChecklist` (espaçamento).

## 5. Critérios de Aceite (verificáveis por teste)

* [x] CA01: sem hash, `EuGeroRouter`/init resultam em view `home`; estado inicial de visitante novo não contém "Rafael Nunes".
* [x] CA02: em 390x730, a home não gera scroll e mostra os mesmos textos do desktop.
* [x] CA03: o primeiro item de `CHARACTERS` é o `blank`.
* [x] CA04: a tela start não tem `btn-fill-sample` nem `btn-clear-all`, e tem um botão de voltar para characters.
* [x] CA05: no wizard, uma seção opcional exibe ação de remover que a desabilita; seção obrigatória não exibe.

## 6. Fora de Escopo

* Mudanças nas telas de review e guia.
* Alterar o conteúdo dos personagens de exemplo.
