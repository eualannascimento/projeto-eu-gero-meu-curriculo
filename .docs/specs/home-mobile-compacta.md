# Home Mobile Compacta (sem scroll)

**Status:** Aprovado (requisitos ditados pelo usuário em 2026-07-16)
**Data:** 2026-07-16

## 1. Resumo e Objetivo

No mobile, a homepage exige rolagem para ver as ações principais. Esta entrega compacta a home em telas pequenas para que todo o conteúdo útil caiba em uma tela, sem alterar o desktop.

## 2. User Stories (Requisitos Funcionais)

* **US01:** Como candidato no celular, quero ver as duas ações principais (criar e continuar) sem rolar a página.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

* **Regra 01 (Espaço do topo):** manter respiro entre o cabeçalho e o título, porém menor que o atual.
* **Regra 02 (Ações lado a lado):** as duas caixas de ação ficam em duas colunas no mobile; as descrições internas são ocultadas para caber.
* **Regra 03 (Como funciona):** a seção some no mobile (a orientação já existe dentro do wizard); desktop permanece igual.
* **Regra 04 (Privacidade):** no mobile o texto vira uma linha curta; desktop mantém o texto completo.
* **Regra 05 (Desktop intacto):** nenhuma mudança visual acima do breakpoint de 768px.

## 4. Estrutura de Dados e Componentes

* `index.html`: classes de gancho nas seções da home (`home-hero`, `home-actions`, `home-action-card`, `home-how`, `home-privacy`) e variante curta do texto de privacidade.
* `css/style.css`: bloco `@media (max-width: 768px)` com as regras de compactação.

## 5. Critérios de Aceite (verificáveis por teste)

* [x] CA01: em viewport 390x844, `#screen-home` não gera scroll vertical (scrollHeight <= innerHeight).
* [x] CA02: em viewport mobile, as duas caixas de ação ficam lado a lado e a seção "Como funciona" não aparece.
* [x] CA03: em viewport desktop (>= 769px), o layout permanece o atual (grid auto-fit, "Como funciona" visível, texto de privacidade completo).

## Revisão (2026-07-17): distribuição estética

Feedback do usuário sobre a primeira entrega: design bom, distribuição ruim. Correções:

* **Colisão de classe:** `home-hero` colidia com CSS morto da "Homepage (Antiga)" (`text-align: center`), centralizando o hero indevidamente em todas as larguras. Classe renomeada para `home-intro`.
* **Camada dupla de compactação:** as regras antigas da home no bloco `@media 900px` (PR #17) foram removidas; a compactação vive em um único bloco.
* **Distribuição vertical:** no mobile a home ocupa `100dvh` menos o cabeçalho; o bloco de introdução centraliza verticalmente no espaço livre e ações + privacidade ancoram na base (sem vazio no rodapé).
* **CA04:** botões dos dois cartões alinhados na mesma base (`margin-top: auto`); hero alinhado à esquerda em todas as larguras.

## 6. Fora de Escopo

* Mudanças nas demais telas (wizard, review, guia).
* Alterações de conteúdo/texto no desktop.
