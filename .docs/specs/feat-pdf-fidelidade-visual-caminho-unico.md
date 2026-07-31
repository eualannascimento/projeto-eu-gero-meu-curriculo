# PDF: fidelidade visual no caminho unico (jsPDF)

**Status:** Concluído
**Data:** 2026-07-31

## 1. Resumo e Objetivo

Reativar `js/pdf-export.js` (geracao de PDF via jsPDF) como unico caminho do botao "Baixar curriculo em PDF", fechando os seis gaps visuais que motivaram o revert de 2026-07-26 registrado em `feat-pdf-direto-como-unico-caminho.md`. O resultado deve ficar deterministico (independente de navegador) e visualmente equivalente a previa, por familia de layout.

Esta spec reabre e substitui o escopo de `feat-pdf-direto-como-unico-caminho.md` no que se refere a fidelidade visual; as regras de negocio ja validadas la (carregamento sob demanda, memoizacao, nome de arquivo, `window.print()` disponivel via Ctrl+P) continuam valendo e nao sao redefinidas aqui.

## 2. User Stories (Requisitos Funcionais)

* **US01:** Como candidato, quero que o PDF baixado pelo botao "Baixar curriculo em PDF" seja visualmente equivalente a previa da tela (linhas divisorias, cores, espacamento de letras, link do LinkedIn), para que o documento final pareca profissional e nao uma versao simplificada.
* **US02:** Como candidato, quero que o PDF seja igual em qualquer navegador ou sistema operacional, sem depender de configuracao de impressao, para nao ter que testar em varios aparelhos antes de enviar.
* **US03:** Como candidato usando um modelo de barra lateral, quero que o fundo colorido da barra va ate o fim de todas as paginas do PDF, inclusive se o conteudo ocupar mais de uma pagina.
* **US04:** Como candidato com um titulo de formacao longo, quero que o titulo nao sobreponha a data ao lado, para que ambos fiquem legiveis.
* **US05:** Como candidato, quero clicar no link do LinkedIn dentro do PDF exportado e ser levado ao meu perfil, assim como funciona a previa em tela.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)

* **Regra 01 (linhas divisorias):** Cada secao desenhada por `drawSectionHeading` recebe uma linha horizontal fina (`doc.setDrawColor` em tom neutro claro, mesma cor usada no separador do cabecalho em `layoutCentered`, RGB `224, 224, 227`) logo abaixo do titulo da secao, com a largura da coluna de conteudo. Nao se aplica a sidebar da familia `sidebar` (mantem visual limpo, sem linha, como na previa).
* **Regra 02 (cor dos titulos de item):** `block.title` em `drawBlocks` passa a usar `palette.accent900` no lugar da cor fixa `[29, 31, 32]`, alinhando com o padrao de a previa usar a cor de destaque do template nos titulos de cargo/curso, nao preto puro.
* **Regra 03 (letter-spacing):** Nomes (`personal.fullName`) e titulos de secao (`drawSectionHeading`) recebem `doc.setCharSpace()` com valor proporcional a `0.08em` do tamanho de fonte em uso (`sizePt * PT_TO_MM * 0.08`), refletindo o padrao de letter-spacing em maiusculas usado nos titulos de secao da previa (`css/templates.css`, valores entre 0.08em e 0.14em nas classes `.cv-*-headline`/`h2` de secao). Texto de corpo (resumo, descricoes) nao recebe letter-spacing extra. `doc.setCharSpace()` deve ser resetado para `0` apos cada trecho que o usa, para nao vazar para o texto seguinte.
* **Regra 04 (link do LinkedIn no cabecalho):** Quando `personal.linkedinUrl` estiver preenchido, a linha de contato do cabecalho (`contactLine`) passa a incluir a URL, desenhada com `doc.textWithLink(texto, x, y, { url })` no lugar de `doc.text()`, tornando o trecho clicavel no PDF gerado. Aplica-se as cinco familias de layout (`centered`, `left`, `banner`, `creative` no cabecalho principal; `sidebar` no bloco de contato lateral, que ja inclui o campo mas hoje sem link clicavel).
* **Regra 05 (fundo da barra lateral em varias paginas):** `layoutSidebar` passa a redesenhar o retangulo de fundo (`doc.rect(0, 0, sidebarW, PAGE_H, 'F')`) no inicio de cada nova pagina gerada durante o layout, nao so uma vez no topo da funcao. Requer que `ensureSpace` (ou uma variante usada dentro de `layoutSidebar`) dispare um callback que redesenha o fundo apos `doc.addPage()`.
* **Regra 06 (colisao entre titulo e data em item de lista):** Em `drawBlocks`, antes de desenhar `block.period` alinhado a direita, calcular a largura do `block.title` (via `doc.getTextWidth`). Se `larguraTitulo + larguraPeriodo` ultrapassar a largura disponivel da coluna, mover `block.period` para a linha seguinte, alinhado a esquerda com uma leve indentacao, em vez de sobrepor o titulo. Caso contrario, mantem o comportamento atual (mesma linha, `period` alinhado a direita).
* **Regra 07 (caminho unico):** O listener do botao `btn-export-pdf` em `js/app.js:216` passa a chamar uma funcao `downloadPdf` (nova, em `js/screens/review.js`) que carrega os scripts (`js/vendor/jspdf.umd.min.js`, `js/vendor/fonts-barlow.js`, `js/pdf-export.js`) sob demanda, gera o documento via `EuGeroPdfExport.generatePdf` e dispara o download com o nome de `cvFileBaseName()` (funcao ja existente, reaproveitada sem alteracao). `window.print()` deixa de ser chamado pelo clique no botao; `printCv()` continua exportada para quem usa Ctrl+P.
* **Falha 01:** Se o carregamento dos scripts ou a geracao do PDF falhar, o botao exibe um aviso (reaproveitar o padrao de toast/notificacao ja usado em outras falhas do app, ver `js/app.js`) e volta ao rotulo original, sem travar a tela. Nenhum arquivo e baixado nesse caso.
* **Limite 01:** A fidelidade continua sendo por familia de layout (`centered`, `left`, `sidebar`, `banner`, `creative`), nao pixel a pixel por um dos 20 modelos. Diferencas finas de acabamento entre modelos da mesma familia (alem das seis regras acima) ficam fora desta entrega.

## 4. Estrutura de Dados e Componentes

* **Modificado:** `js/pdf-export.js` (`drawSectionHeading`, `drawBlocks`, `contactLine`, `layoutSidebar`, `layoutCentered`/`layoutLeft`/`layoutBanner`/`layoutCreative` no ponto em que chamam `contactLine`).
* **Modificado:** `js/screens/review.js` (nova funcao `downloadPdf`, carregamento sob demanda dos scripts, `printCv` mantida).
* **Modificado:** `js/app.js:216` (listener do botao passa a chamar `EuGeroReviewScreen.downloadPdf`).
* **Reativado (sem alteracao de conteudo):** `js/vendor/jspdf.umd.min.js`, `js/vendor/fonts-barlow.js`.
* **Sem alteracao:** `js/preview.js`, CSS da previa em tela, os 20 registros de template em `js/config.js` (a paleta e derivada do `thumbAccent` ja existente, sem novo campo).
* **Testes:** `tests/smoke-test.js` ganha casos para as seis regras (ver Criterios de Aceite).

## 5. Criterios de Aceite (verificaveis por teste)

* [x] CA01: Dado um clique no botao "Baixar curriculo em PDF", quando a geracao terminar, entao um arquivo `CV_*.pdf` e baixado e `window.print` nao e chamado.
* [x] CA02: Dado qualquer uma das 5 familias de layout com uma secao preenchida, quando o PDF for gerado, entao existe uma linha divisoria abaixo de cada titulo de secao (exceto na coluna lateral da familia `sidebar`).
* [x] CA03: Dado um item de lista com titulo preenchido, quando o PDF for gerado, entao a cor do titulo do item corresponde a `palette.accent900` do template escolhido, nao a cor fixa anterior.
* [x] CA04: Dado o nome do candidato e os titulos de secao, quando o PDF for gerado, entao o `charSpace` aplicado a esses trechos e maior que zero, e o texto de corpo (resumo/descricoes) mantem `charSpace` zero.
* [x] CA05: Dado `personal.linkedinUrl` preenchido, quando o PDF for gerado, entao o texto da URL no cabecalho (ou no bloco de contato da sidebar) tem um link clicavel para essa URL.
* [x] CA06: Dado um template da familia `sidebar` com conteudo que ocupa duas paginas, quando o PDF for gerado, entao o fundo colorido da barra lateral cobre a altura completa de ambas as paginas.
* [x] CA07: Dado um item de lista cujo titulo mais o periodo ultrapassam a largura da coluna, quando o PDF for gerado, entao o periodo e desenhado na linha seguinte, sem sobrepor o titulo.
* [x] CA08: Dado cada uma das 5 familias de layout com um conjunto de dados de exemplo (`js/characters.js`), quando o PDF for gerado, entao o documento tem exatamente uma pagina (mantendo a garantia ja validada em `feat-pdf-direto-como-unico-caminho.md`, CA02).
* [x] CA09: Dado o carregamento da tela de revisao, quando nenhum clique no botao de exportar ocorrer, entao nenhum dos tres scripts (`jspdf.umd.min.js`, `fonts-barlow.js`, `pdf-export.js`) e requisitado.

## 6. Fora de Escopo

* Redesenho pixel-perfect dos 20 modelos individuais no jsPDF (fidelidade continua por familia, Limite 01).
* QR Code do LinkedIn no PDF.
* Reapresentacao do catalogo de templates por familia na galeria de escolha (item P1.5 do diagnostico `.docs/diagnostico-evolucao-2026-07-31.md`, spec propria).
* Revisao de pontuacao em quatro dimensoes (item P1.4 do mesmo diagnostico, spec propria).
* Remover ou consolidar os 20 registros de template em `js/config.js` (fica para uma decisao de produto separada, apos esta entrega estabilizar a fidelidade por familia).
