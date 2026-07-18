# P0.5 - Corrigir o calculo de progresso de preenchimento

**Status:** Aprovado
**Data:** 2026-07-18

## 1. Resumo e Objetivo
`calculateProgress` (`js/scoring.js`) calcula a porcentagem de preenchimento como `filledRequired / totalRequired`. Para secoes de lista (experiencias, formacao, certificacoes, projetos, idiomas), o codigo so soma ao `totalRequired` os campos obrigatorios de itens que ja existem em `state[section.id]`. Se a secao esta habilitada mas o array esta vazio (`[]`), o `forEach` sobre os itens nunca executa e a secao inteira fica fora do denominador - como se nao existisse - permitindo uma porcentagem de preenchimento indevidamente alta mesmo com uma secao habilitada e completamente vazia.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como usuario que habilitou "Experiência" mas ainda nao adicionou nenhuma experiencia, quero que a barra de progresso reflita que essa secao esta pendente, em vez de ignora-la no calculo.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01:** Para cada secao de lista habilitada que tenha pelo menos um campo de item obrigatorio (`itemFields` com `required: true`), se o array de itens estiver vazio, a secao soma exatamente 1 ao `totalRequired` e 0 ao `filledRequired` (representa "precisa de pelo menos um item preenchido").
* **Regra 02:** Se a secao de lista ja tem itens, o calculo por campo obrigatorio de cada item continua como antes (nao muda o comportamento existente para secoes com conteudo).
* **Regra 03:** Secoes de lista sem nenhum campo obrigatorio em `itemFields` nao entram no calculo (comportamento preservado).
* **Falha 01:** Nenhuma secao ativa (`totalRequired === 0`): retorna 100, como antes.

## 4. Estrutura de Dados e Componentes
* **Arquivo:** `js/scoring.js`, funcao `calculateProgress` (linha ~310).
* Nenhuma mudanca de schema de dados.

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: Estado com apenas a secao "Experiência" habilitada (alem das obrigatorias), sem nenhum item em `state.experiences`, mas com dados pessoais/resumo/habilidades completos, tem progresso menor que 100% (a secao vazia conta como pendente).
* [ ] CA02: O mesmo estado, apos adicionar uma experiencia com todos os campos obrigatorios preenchidos, tem progresso maior que o caso CA01 (a secao deixa de contar como pendente).
* [ ] CA03: Com todos os campos obrigatorios preenchidos (incluindo a experiencia), o progresso e exatamente 100% (regressao do caso existente, sem falsos negativos introduzidos pela correcao).

## 6. Fora de Escopo
* Separar progresso de preenchimento, qualidade de conteudo, compatibilidade ATS e ajuste de paginas em indicadores distintos (revisao em quatro dimensoes) - fica para P1, conforme o documento geral de evolucao.
