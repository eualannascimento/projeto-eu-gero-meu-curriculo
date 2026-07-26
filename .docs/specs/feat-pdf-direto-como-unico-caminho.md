# PDF direto como único caminho de exportação

> **REVERTIDO em 2026-07-26, no mesmo dia.** O jsPDF redesenha o documento por
> coordenadas e divergiu visivelmente do CSS: espaçamento entre seções
> comprimido, ausência das linhas divisórias, títulos em preto no lugar do azul,
> sem o letter-spacing e sem o link do LinkedIn no cabeçalho. Para um currículo
> esse custo visual é alto demais. O botão voltou para a impressão nativa, que é
> fiel por construção porque usa o mesmo HTML e CSS da prévia.
>
> O defeito que motivou a troca (segunda página em branco) tinha outra causa, já
> corrigida: `templates.css` definia `.preview-content { min-height: 297mm }`
> fora de qualquer media query, e a caixa de impressão herdava altura de folha
> inteira. Com `min-height: 0` no bloco de impressão, a caixa passa a ter a
> altura do conteúdo. Verificado em 80 de 80 combinações, inclusive no cenário
> em que o navegador impõe margem própria de página.
>
> Fica registrado como decisão testada e descartada, com a evidência acima.

**Status:** Revertido em 2026-07-26
**Data:** 2026-07-26

## 1. Resumo e Objetivo

O botão "Baixar currículo em PDF" abria a caixa de diálogo de impressão do navegador. Cada motor aplica margem e escala próprias nesse diálogo, e o usuário pode alterá-las, então o resultado variava por navegador e por dispositivo: no Safari o documento saía em duas páginas, com a segunda em branco. Esta entrega troca o mecanismo por geração direta de PDF via jsPDF, tornando o resultado determinístico.

Esta decisão **reverte** a de `fix-impressao-nativa-fiel-preview.md`, que escolheu a impressão nativa como caminho único. O motivo da reversão está na seção 7.

## 2. User Stories (Requisitos Funcionais)

* **US01:** Como candidato, quero clicar em "Baixar currículo em PDF" e receber o arquivo direto, sem diálogo de impressão, para que o resultado seja o mesmo em qualquer navegador ou aparelho.
* **US02:** Como candidato, quero que o currículo caiba em uma página quando o conteúdo couber, independentemente das configurações de impressão do meu navegador.
* **US03:** Como candidato, quero que o texto do PDF seja selecionável, para que plataformas de recrutamento consigam ler o conteúdo.
* **US04:** Como visitante que nunca vai exportar, quero que a biblioteca de PDF não seja baixada no carregamento da página.
* **US05:** Como candidato, quero um aviso claro se a geração falhar, para poder tentar de novo.

## 3. Regras de Negócio e Casos de Falha (Edge Cases)

* **Regra 01:** `jspdf.umd.min.js`, `fonts-barlow.js` e `pdf-export.js` são carregados sob demanda, no primeiro clique, e não por `<script>` no `index.html`. Somados passam de 1 MB: cobrar isso de todo visitante penalizaria quem só usa o wizard.
* **Regra 02:** O carregamento é memoizado; cliques seguintes reaproveitam os scripts já carregados. Uma falha limpa o cache da promessa, para que a tentativa seguinte possa dar certo.
* **Regra 03:** Durante a geração o botão fica desabilitado e exibe "Gerando PDF...", voltando ao rótulo original no fim, com sucesso ou com erro.
* **Regra 04:** O nome do arquivo continua vindo de `cvFileBaseName()`: `CV_<NOME>_<CARGO>.pdf`.
* **Regra 05:** `window.print()` permanece disponível em `printCv()` para quem usa Ctrl+P do navegador, com a área oculta sincronizada. Deixa de ser o caminho do botão.
* **Falha 01:** Erro no carregamento dos scripts ou na geração exibe aviso e mantém o botão utilizável. Nenhum arquivo é baixado.
* **Limite 01:** A fidelidade é por família de layout (`centered`, `left`, `sidebar`, `banner`, `creative`), conforme a Regra 02 de `feat-download-pdf-real.md`. Diferenças de acabamento entre modelos da mesma família são aceitáveis.

## 4. Estrutura de Dados e Componentes

* **Alterado:** `js/screens/review.js` (`loadPdfVendor`, `downloadPdf`; `printCv` mantida para Ctrl+P), `js/app.js` (o listener do botão passa a chamar `downloadPdf`), `tests/smoke-test.js`.
* **Reativado:** `js/pdf-export.js` e `js/vendor/*`, que existiam mas nunca foram referenciados por nenhuma página.
* **No repositório de deploy:** `scripts/prepare-deploy.py` deixa de excluir `js/vendor/`, que agora precisa estar publicado.
* **Sem alteração:** `js/preview.js` e o CSS da prévia. A prévia em tela continua em HTML e CSS.

## 5. Critérios de Aceite (verificáveis por teste)

* [x] CA01: Dado um clique no botão de exportar, quando a geração terminar, então um arquivo `CV_*.pdf` é baixado e `window.print` não é chamado.
* [x] CA02: Dado cada uma das 80 combinações de personagem e modelo, quando o PDF for gerado, então tem exactamente uma página.
* [x] CA03: Dado qualquer um dos 20 modelos, quando o PDF for gerado, então contém a seção de experiência profissional.
* [x] CA04: Dado o PDF gerado, quando o texto for extraído, então é selecionável (não é imagem).
* [x] CA05: Dado o carregamento da página de revisão, quando nenhum clique ocorrer, então o jsPDF não é requisitado.

## 6. Fora de Escopo

* Redesenho pixel-perfect dos 20 modelos no jsPDF: a fidelidade é por família (Limite 01).
* Acabamentos conhecidos que ficam para uma entrega própria: o fundo da barra lateral termina junto com o conteúdo em vez de ir até o pé da página, e em um dos modelos o título de formação encosta na data.
* QR Code do LinkedIn no PDF.
* Corrigir o CSS de impressão dos três modelos com barra lateral (`modern`, `oliva`, `petroleo`), que via Ctrl+P ainda saem sem a seção de experiência. Deixou de afetar o botão de exportar; tratado com prioridade menor.

## 7. Por que a decisão anterior foi revertida

`fix-impressao-nativa-fiel-preview.md` escolheu a impressão nativa por um motivo legítimo: o PDF sai do mesmo HTML e CSS da prévia, então a fidelidade é exata por construção. O que essa escolha não previu é que o diálogo de impressão não é neutro:

* O Safari ignora `@page { margin: 0 }` e aplica margem própria de cerca de 12,7 mm por lado, reduzindo a área imprimível para aproximadamente 184,6 x 271,6 mm.
* `templates.css` define `.preview-content { min-height: 297mm }` fora de qualquer media query, e o elemento de impressão recebe essa classe. A caixa mantinha altura de folha inteira mesmo com o conteúdo terminando antes, e o excedente virava uma segunda página em branco.
* Os três modelos com barra lateral saíam sem a seção de experiência na impressão, mas saem completos pelo jsPDF, porque o gerador não depende do CSS de impressão.
* O usuário pode alterar margem e escala no próprio diálogo, o que coloca o resultado final fora do controle do produto.

Medido nas 80 combinações de personagem e modelo: pelo jsPDF, 80 de 80 em uma página e 80 de 80 com a seção de experiência presente.
