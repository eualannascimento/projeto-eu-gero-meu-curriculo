# Polish Geral: Textos, Espaçamentos, Wizard em Tabs e Review Acionável

**Status:** Aprovado (requisitos ditados pelo usuário em 2026-07-17)
**Data:** 2026-07-17

## 1. Resumo e Objetivo

Pacote de refinamento em todo o site: tom de texto discreto, direto e encorajador sem travessões; espaçamentos menores; personagens com cores próprias e galeria 3x2 no mobile; prévia do start com setas sobrepostas; wizard com itens em tabs numeradas (sem crescer o scroll); review com qualidade acionável por seção.

## 2. User Stories (Requisitos Funcionais)

* **US01:** Como visitante, quero textos diretos e encorajadores, sem travessões, iguais em qualquer tela.
* **US02:** Como candidato no wizard, quero adicionar experiências/formações/certificações/projetos sem a página crescer: navego pelos itens em bolinhas numeradas.
* **US03:** Como candidato na review, quero saber exatamente o que ficou bom e o que preciso reforçar, seção por seção.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

* **Regra 01 (Textos):** sem travessão (U+2014/U+2013) em nenhum texto visível; hífen como pausa também evitado (usar ponto ou dois pontos). Privacidade vira uma frase: "Nada é enviado a servidores."
* **Regra 02 (Home):** espaçamentos reduzidos (header/body, principalmente mobile); "Como funciona" ao abrir no mobile vira popover sobreposto (não empurra o layout, não gera scroll).
* **Regra 03 (Personagens):** cada personagem tem cor própria de avatar (paleta discreta); no mobile o grid tem 3 colunas x 2 linhas com o "Em branco" como card normal (primeiro).
* **Regra 04 (Start):** dock de prévia mobile não aparece na tela start; no desktop as setas de modelo ficam sobrepostas no meio da prévia (como na review) com o nome do modelo abaixo.
* **Regra 05 (Wizard, seções em lista com formulário):** experiências, formação, certificações e projetos mostram UM item por vez, com tabs em bolinhas numeradas (1, 2, 3...) e uma bolinha "+" para adicionar. Remover um item ajusta a tab ativa. Idiomas continua em linhas simples.
* **Regra 06 (Wizard, campos):** e-mail válido não mostra dica (só o aviso quando inválido); textarea do resumo maior (7 linhas); título "Sugestões" das habilidades some quando não restam sugestões; nível de idioma é dropdown (Básico, Intermediário, Avançado, Fluente, Nativo); botão remover de idioma é compacto (x), sem ocupar a linha no mobile.
* **Regra 07 (Nomenclatura):** a seção "Certificados" passa a se chamar "Certificações" (títulos, labels e checklist).
* **Regra 08 (Review):** a qualidade geral ganha um detalhamento fixo (sem IA) por seção: status (Ótimo/Bom/Reforce) e dica específica por campo fraco (ex.: "comece com um verbo de ação", "inclua um número"). Botão de baixar PDF em destaque (largura total no mobile). Botão do guia com ícone do LinkedIn.
* **Falha 01:** remover o último item de uma lista em tabs recria um item vazio (comportamento atual preservado).

## 4. Estrutura de Dados e Componentes

* `js/config.js`: nível de idioma como select; rows do resumo; textos "Certificações".
* `js/scoring.js`: nova função pura `buildSectionFeedback(state, sections, actionVerbs)` com status por seção e dicas específicas.
* `js/app.js`: tabs de itens de lista, dicas de campo, sugestões de skills, review.
* `index.html` / `css/style.css`: textos, espaçamentos, popover, avatares, prévia do start, botões da review.

## 5. Critérios de Aceite (verificáveis por teste)

* [x] CA01: nenhum travessão em textos visíveis de `index.html` e nos textos de UI de `js/`.
* [x] CA02: `buildSectionFeedback` retorna, para um estado com resumo fraco, uma dica específica citando verbo de ação (coberto no smoke-test).
* [x] CA03: no wizard, adicionar item em experiências não empilha um segundo formulário: há tabs numeradas e um formulário por vez.
* [x] CA04: nível de idioma renderiza como select com os 5 níveis.
* [x] CA05: home mobile 390x730 sem scroll, inclusive com "Como funciona" aberto.

## 6. Fora de Escopo

* Mudanças de template/preview do currículo em si.
* Guia LinkedIn (fora textos com travessão).
