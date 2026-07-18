# Ajustes de Textos para Currículos Favoráveis a ATS

**Status:** Aprovado (ditado pelo usuário em 2026-07-18)
**Data:** 2026-07-18

## 1. Resumo e Objetivo

Ajustar textos e adicionar sinalizações de "Leitura por ATS" em várias telas do site (start, review, galeria de modelos, modal de ajuda de IA), sem nunca prometer aprovação ou classificação em plataformas de recrutamento, e reforçando a revisão humana dos dados apos importacao.

## 2. User Stories (Requisitos Funcionais)

* **US01:** Como candidato na tela `/start`, quero ver logo abaixo do nome do modelo se a estrutura escolhida facilita ou dificulta a leitura por ATS.
* **US02:** Como candidato na tela `/review`, quero um painel dedicado "Leitura por ATS" com status, descricao e uma checklist "Antes de enviar".
* **US03:** Como candidato, ao exportar o PDF, quero orientacao clara sobre como confirmar que o texto e selecionavel e sobre revisar os campos importados pela plataforma de vagas.
* **US04:** Como candidato preenchendo secoes do curriculo, quero dicas de campo revisadas que me orientem a usar termos verdadeiros e claros, sem repeticao artificial de palavras-chave.
* **US05:** Como candidato usando o modal de ajuda de IA, quero poder colar a descricao da vaga (campo opcional) para que o prompt gerado compare meu curriculo aos requisitos sem inventar informacoes.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)

* **Regra 01:** A orientacao de ATS nunca deve afirmar que o curriculo sera aprovado, classificado ou selecionado.
* **Regra 02:** O selo de ATS considera principalmente a estrutura do modelo (uma coluna, ordem linear de leitura, ausencia de informacoes essenciais em imagens), nao o conteudo do curriculo.
* **Regra 03:** Nome, contato, cargo, datas e titulos de secao nao podem existir somente em cabecalhos, rodapes, icones ou elementos graficos do PDF exportado; o texto deve permanecer selecionavel, pesquisavel e em ordem coerente de leitura.
* **Regra 04:** A correspondencia com a vaga (campo opcional de descricao da vaga e prompts de IA) deve valorizar clareza e relevancia sem incentivar repeticao artificial de palavras-chave nem invencao de experiencias, ferramentas, resultados ou qualificacoes.
* **Regra 05:** O campo "Descricao da vaga" no modal de IA e opcional, permanece somente no dispositivo do usuario e so e compartilhado quando o prompt for copiado.
* **Falha 01:** apos a importacao do curriculo em qualquer plataforma de vagas, a pessoa deve ser orientada a revisar e completar os campos preenchidos automaticamente (cargos, empresas, datas, formacao, descricoes).

## 4. Estrutura de Dados e Componentes

* `index.html`: previa do start (rotulo "Leitura por ATS" abaixo do nome do modelo); painel "Leitura por ATS" na tela de review; textos da galeria de modelos; campo "Descricao da vaga" no modal de ajuda de IA.
* `js/app.js`: logica de `printCv` (toast de exportacao e orientacao pos-download); renderizacao do painel de ATS na review e da previa no start.
* `js/config.js`: dicas (`tip`) e descricoes de campos das secoes (dados pessoais, resumo, experiencia, formacao, habilidades, certificacoes, projetos); catalogo de modelos (selos e notas de ATS).
* `js/prompts.js`: introducao geral do prompt, instrucoes de secao (resumo, experiencia, habilidades), frase-guia de montagem do prompt final; suporte ao novo campo opcional de descricao da vaga.

## 5. Criterios de Aceite (verificaveis por teste)

* [ ] CA01: nenhum texto novo afirma aprovacao, classificacao ou selecao automatica em plataformas de recrutamento.
* [ ] CA02: a previa do `/start` exibe o rotulo "Leitura por ATS" com o texto correto conforme o modelo seja favoravel ou exija atencao.
* [ ] CA03: a tela de review exibe o painel "Leitura por ATS" com status, descricao e a checklist "Antes de enviar" completa (6 itens).
* [ ] CA04: a galeria de modelos usa os textos "Estrutura favoravel a ATS" e "Pode dificultar a leitura por ATS" (sem os textos antigos).
* [ ] CA05: `printCv` exibe o novo toast de orientacao sobre "Salvar como PDF" e a orientacao pos-download sobre revisar campos importados.
* [ ] CA06: as dicas de campo listadas na secao 7 do spec batem com o texto renderizado em `config.js` para cada campo citado.
* [ ] CA07: o modal de ajuda de IA tem o campo opcional "Descricao da vaga" com placeholder, dica e nota de privacidade conforme especificado.
* [ ] CA08: os prompts gerados (introducao geral, resumo, experiencia, habilidades, frase-guia) incluem as instrucoes revisadas sobre uso da descricao da vaga sem invencao ou repeticao artificial.

## 6. Fora de Escopo

* Alteracoes no calculo de completude/pontuacao ja existente (`scoring.js`) alem do necessario para exibir o painel de ATS.
* Novos modelos de curriculo ou mudancas visuais fora dos textos e do novo campo do modal de IA.
* Traducao para outros idiomas alem do PT-BR.
