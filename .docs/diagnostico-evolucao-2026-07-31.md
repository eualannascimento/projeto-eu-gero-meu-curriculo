# Diagnostico e Proposta de Evolucao - Eu Gero Meu Curriculo (v2)

**Status:** proposta para revisao
**Data:** 2026-07-31
**Escopo:** auditoria completa (UX, design visual, qualidade do resultado gerado, engenharia) sobre o estado atual do repositorio, complementando `diagnostico-evolucao-2026-07.md`

Este documento nao substitui o diagnostico de 2026-07-18: reafirma os itens dele que continuam validos (confirmados nesta auditoria via leitura de codigo), soma achados novos e eleva um item a prioridade maxima por pedido explicito do autor do produto. Assim como no diagnostico anterior, cada item aprovado aqui deve virar uma spec propria em `.docs/specs/` antes de qualquer implementacao, conforme `.rules/global.md`.

## Sintese executiva

O produto nao tem defeito critico: 192 testes de logica pura passam, a CSP e restritiva e correta, a sanitizacao contra `javascript:` e escape de HTML estao implementadas nos pontos verificados. Os problemas encontrados sao de precisao de produto (o resultado entregue ajuda menos do que poderia) e de decisoes tecnicas com uma tensao nao resolvida entre fidelidade visual e determinismo na exportacao de PDF.

## P-1 (prioridade maxima) - exportacao de PDF

Elevado a prioridade maxima por pedido direto do autor do produto em 2026-07-31: as dificuldades de geracao de PDF devem ser sanadas por completo, nao apenas mitigadas.

### Diagnostico

O repositorio ja tentou dois caminhos, documentados em specs proprias:

1. **Impressao nativa (`window.print()`)** - caminho ativo hoje (`js/screens/review.js:188-191`, ligado ao botao em `js/app.js:216`). Fiel ao CSS da previa por construcao, mas o resultado final depende do motor de impressao do navegador do usuario:
   - Safari ignora `@page { margin: 0 }` e aplica cerca de 12,7mm de margem propria por lado, reduzindo a area imprimivel.
   - O usuario pode alterar margem e escala na propria caixa de dialogo do sistema, tirando o resultado final do controle do produto.
   - Os 3 templates com barra lateral (`modern`, `oliva`, `petroleo`) saem sem a secao de experiencia por essa via (registrado como fora de escopo em `feat-pdf-direto-como-unico-caminho.md`, nunca corrigido).
   - Historico de segunda pagina em branco (`fix-segunda-pagina-altura-do-body.md`), com causa raiz ja identificada e corrigida uma vez (`min-height: 297mm` fora de media query em `templates.css`), mas o mecanismo de fundo (caixa de dialogo fora do controle do produto) continua causando variacao por navegador.

2. **jsPDF direto (`js/pdf-export.js` + `js/vendor/jspdf.umd.min.js`)** - implementado, testado em 80 combinacoes de personagem x modelo e **revertido no mesmo dia** (`feat-pdf-direto-como-unico-caminho.md`, revertido em 2026-07-26). O motivo do revert nao foi tecnico: nos 80 casos testados, o resultado teve sempre uma pagina, sempre com a secao de experiencia (inclusive nos 3 modelos de barra lateral) e sempre com texto selecionavel. O motivo foi uma lista especifica de divergencias visuais em relacao a previa:
   - sem as linhas divisorias entre secoes;
   - titulos em preto no lugar da cor de destaque (azul no exemplo testado);
   - sem o letter-spacing usado na previa;
   - sem o link do LinkedIn clicavel no cabecalho;
   - fundo da barra lateral nao ia ate o fim da pagina;
   - em um modelo, o titulo de formacao encostava na data.

O codigo de `js/pdf-export.js` nao clona o HTML da previa: ele desenha o PDF a partir dos dados do curriculo (texto, familia estrutural de layout, cor de destaque derivada do `thumbAccent` do template), byte a byte, sem depender do navegador do usuario. Isso significa que os problemas de determinismo e de sidebar quebrada, que motivaram a auditoria atual, ja estavam resolvidos nessa via - so a paridade visual ficou incompleta.

### Decisao proposta

Reativar `js/pdf-export.js` como **caminho unico** de exportacao pelo botao "Baixar curriculo em PDF" (`window.print()` deixa de ser o caminho do botao, mas pode continuar disponivel para quem usa Ctrl+P, como ja prope a Regra 05 do spec revertido) e fechar, um a um, os seis gaps visuais listados acima, ate a previa em tela e o PDF gerado ficarem visualmente equivalentes por familia de layout.

Como o autor do produto confirmou disposicao para rever ou reduzir modelos se necessario, a consolidacao formal em torno das 5 familias estruturais reais (`centered`, `left`, `sidebar`, `banner`, `creative`) pode ser tratada como parte da mesma entrega: em vez de manter a promessa implicita de 20 modelos com fidelidade individual, o produto passa a garantir fidelidade por familia, que e o que o gerador ja faz de fato (ver tambem item P1.4 abaixo, que trata da mesma questao do lado do catalogo de templates).

### Alternativas descartadas

- **Mitigar a impressao nativa em vez de substituir:** descartada porque a caixa de dialogo de impressao do sistema operacional nunca fica 100% sob controle do produto (o usuario sempre pode mudar margem/escala), entao "determinismo total" nao e alcancavel por essa via, so aproximavel.
- **Renderizar a previa como imagem (ex.: captura de tela) dentro do PDF:** descartada porque o texto deixaria de ser selecionavel, o que contraria o requisito de leitura por ATS (ja documentado como US03 do spec revertido e como item das boas praticas de ATS na tela de revisao).

### Proxima etapa

Este item precisa de spec propria em `.docs/specs/`, substituindo/atualizando `feat-pdf-direto-como-unico-caminho.md` com o novo escopo (fechamento dos 6 gaps visuais + religacao do botao). Sugestao de nome: `feat-pdf-fidelidade-visual-caminho-unico.md`.

## Priorizacao (demais itens)

### P0 - ajustes pontuais de baixo risco e alto valor de clareza

| Item | Motivo | Local no codigo |
|---|---|---|
| Corrigir contradicao de rotulos na revisao | O rotulo geral ("Bem preenchido") e o rotulo de cada secao ("Parcialmente preenchida") usam a mesma escala verbal para dizer coisas diferentes; o usuario le duas mensagens aparentemente conflitantes na mesma tela | `js/screens/review.js:25-33` (rotulo geral) vs `:53-58` (rotulo por secao) |
| Atualizar status dos specs concluidos | Varios specs em `.docs/specs/` seguem marcados "Aprovado" mesmo ja implementados e mergeados (confirmado via `git log`); quem retomar o trabalho sem checar o historico do git pode achar que o item ainda esta pendente | `.docs/specs/*.md` (campo `Status`) |

Os itens P0.1 a P0.5 do diagnostico de 2026-07-18 (bloquear avanco com validacao falha, navegacao duplicada do botao voltar, remover skeletons do PDF, medicao real de paginas, corrigir calculo de progresso) ja foram implementados, conforme confirmado no `git log` (commits referenciando os cinco specs correspondentes). Os arquivos de spec continuam com `Status: Aprovado` por desatualizacao de documentacao, nao por trabalho pendente - ver item acima.

### P1 - melhoria do resultado profissional entregue

Reafirma os itens do diagnostico de 2026-07-18 que seguem sem solucao (confirmado nesta auditoria), somando dois achados novos (P1.4 e P1.5):

1. Etapa de cargo/vaga-alvo no inicio do fluxo.
2. Modo compativel com ATS.
3. Datas estruturadas.
4. **Confirmado nesta auditoria - pontuacao de qualidade ainda e manipulavel.** `js/scoring.js` atribui nota "Otimo" a qualquer texto no tamanho ideal que contenha um verbo de acao E um numero, sem nenhuma relacao com o conteudo real. Um texto generico com um numero solto pontua tao bem quanto um resultado real. Isso mina a confianca no selo de qualidade que e o principal diferencial do produto ("assistente", nao so gerador visual). Revisao em quatro dimensoes (preenchimento, clareza, relevancia para a vaga, documento), ja prevista no diagnostico de julho, e o caminho certo para resolver isso - nao um ajuste pontual no algoritmo atual.
5. **Confirmado nesta auditoria - galeria de templates dificulta a escolha.** Os 20 modelos = apenas 5 familias reais de layout (`centered`: 8, `left`: 5, `banner`: 4, `sidebar`: 3, `creative`: 2, conforme `js/config.js`), navegados um a um por setas, sem grade com miniaturas para comparacao rapida (`js/screens/review.js:156-173`). Alem disso, navegar pela galeria ja aplica o modelo ao estado salvo a cada clique (`js/screens/review.js:234-245`, comentado no proprio codigo como decisao deliberada), sem um modo "so visualizar" antes de decidir. Depois da consolidacao de P-1 em torno das 5 familias, faz sentido resolver a apresentacao do catalogo junto: menos cards, cada um representando uma familia com variacoes de tema dentro dela.
6. Assistente de ajuste de paginas; redesenho da home mobile; barra inferior simplificada; resumo/habilidades recomendados (nao obrigatorios) - itens do diagnostico de julho, sem mudanca de status nesta auditoria.

### P2 - versatilidade

Sem mudanca em relacao ao diagnostico de 2026-07-18 (perfil-base multi-versao, exportacao DOCX/TXT, reordenacao ja implementada, PT-BR/EN nativos, comparacao entre versoes, historico e restauracao). Nao reavaliado nesta auditoria por nao ter sido o foco solicitado.

### P3 (novo) - divida tecnica de engenharia

Nao trava nada hoje, mas encarece a execucao do P1 se for adiante sem tratamento. Baseado em auditoria de codigo dedicada (leitura de `js/app.js`, `js/screens/*.js`, `.rules/*.md`, `tests/smoke-test.js`).

| Item | Motivo | Local no codigo |
|---|---|---|
| `wizard.js` concentra responsabilidades demais | 842 linhas / 28 funcoes misturando renderizacao de campo, validacao, drag-and-drop de listas e estado de UI num unico modulo IIFE; nenhum bug hoje, mas qualquer novo tipo de campo exige navegar um arquivo grande com responsabilidades cruzadas | `js/screens/wizard.js` |
| Zero teste de integracao/UI | `tests/smoke-test.js` cobre bem logica pura (scoring, validacao, storage, migracao de schema, regras de impressao - 192 asserts), mas nenhum teste exercita o DOM real (render do wizard, clique em "Proximo", fluxo completo ate export); regressao de fluxo so e pega manualmente | `tests/smoke-test.js` |
| `innerHTML` sem lint automatizado | 25 ocorrencias, sempre compostas com `escapeHtml`/`escapeAttr` nos pontos verificados, mas o padrao depende de disciplina manual em cada novo trecho, sem checagem automatizada que bloqueie interpolacao nao escapada | `js/screens/*.js`, `js/preview.js` |
| Objeto de contexto compartilhado (`ctx`) cresce a cada feature | `buildScreenContext` expoe cerca de 20 propriedades entre app.js e as telas; funcional, mas qualquer tela nova precisa conhecer boa parte da API interna do app | `js/app.js` |
| `renderPageControls()` reconstroi DOM inteiro a cada render | Perde estado de foco/selecao de teclado em interacoes rapidas; nao e bug reportado, mas e fonte plausivel de flicker | `js/app.js:343` |
| Sem linter de estilo versionado | ESLint e citado em mensagens de commit passadas (`2faca26`), mas nao ha `.eslintrc` no working tree atual; checagem de estilo depende de rodar a ferramenta manualmente fora do repositorio versionado | raiz do projeto |
| `color-mix()` sem fallback | Navegadores muito antigos perdem o divisor visual de cor; risco baixo dado o publico-alvo | `css/base.css:14` |

## Ordem de trabalho proposta

1. **P-1** - exportacao de PDF: fechar os 6 gaps visuais do jsPDF e religar o botao a ele.
2. **P0.6 / P0.7** (novos) - contradicao de rotulos na revisao; atualizar status dos specs concluidos.
3. **P1.4** - revisao de pontuacao em quatro dimensoes (substitui o algoritmo manipulavel atual).
4. **P1.5** - reapresentacao do catalogo de templates por familia (aproveita a consolidacao feita em P-1).
5. Demais itens P1 do diagnostico de julho, na ordem ja acordada la.
6. **P3** - dividas tecnicas, priorizadas conforme forem se tornando bloqueio real para os itens P1 acima (ex.: se o assistente de ajuste de paginas precisar mexer em `wizard.js`, e o momento de quebra-lo em submodulos, nao antes).

Cada item desta lista precisa de spec propria em `.docs/specs/`, teste falhando antes do codigo (TDD) e micro-commits separados, conforme `.rules/global.md`.
