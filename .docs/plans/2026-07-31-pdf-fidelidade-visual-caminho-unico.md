# PDF: fidelidade visual no caminho unico (jsPDF) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o botao "Baixar curriculo em PDF" gerar sempre o mesmo resultado, em qualquer navegador, com fidelidade visual equivalente a previa (por familia de layout), fechando os seis gaps documentados na spec.

**Architecture:** `js/pdf-export.js` ja desenha o PDF por dados (nao clona HTML), recebendo `doc` (instancia jsPDF) por parametro em cada funcao de desenho. Isso permite testar cada regra com um `doc` falso (objeto que so registra as chamadas recebidas), sem precisar rodar jsPDF de verdade em Node. O trabalho e: (1) religar o botao a `EuGeroPdfExport.generatePdf` em vez de `window.print()`, (2) implementar as seis regras visuais uma a uma, cada uma com teste unitario via `doc` falso.

**Tech Stack:** JavaScript vanilla (ES6+), jsPDF vendorizado (`js/vendor/jspdf.umd.min.js`), testes em `tests/smoke-test.js` (Node puro, sem framework, `assert()` caseiro).

## Global Constraints

- Codigo em ingles (nomes de arquivo, funcao, variavel); comentarios, docs e UI em portugues do Brasil.
- Nunca usar travessao (—) ou meia-risca (–) em nenhum texto gerado (codigo, commit, doc); usar hifen "-".
- TDD: teste falho antes do codigo, sempre.
- Um commit por entrega logica (Conventional Commits: `feat:`, `fix:`, `test:`, `refactor:`).
- Nao fazer push direto para `main`; todo trabalho entra por PR (branch atual: `feat/pdf-fidelidade-visual-caminho-unico`).
- `node tests/smoke-test.js` precisa terminar com todos os testes passando antes de cada commit.
- Fidelidade e por familia de layout (`centered`, `left`, `sidebar`, `banner`, `creative`), nao pixel a pixel por um dos 20 modelos.

---

## Task 1: Test double de `doc` (jsPDF falso) reutilizavel

**Files:**
- Modify: `tests/smoke-test.js`

**Interfaces:**
- Produces: funcao `createFakeDoc()` que retorna `{ doc, calls }`, onde `doc` implementa os metodos de jsPDF usados por `js/pdf-export.js` (`setFont`, `setFontSize`, `setTextColor`, `setDrawColor`, `setFillColor`, `setCharSpace`, `text`, `textWithLink`, `line`, `rect`, `splitTextToSize`, `getTextWidth`, `addPage`) e `calls` e um array de `{ method, args }` na ordem em que foram chamados. Usado por todas as tasks seguintes.

- [ ] **Step 1: Escrever o teste que valida o proprio double**

Adicionar ao final de `tests/smoke-test.js` (antes do bloco de resumo final `console.log` de passed/failed, que deve continuar sendo a ultima coisa do arquivo):

```javascript
// --- PDF: fidelidade visual (fake doc para testar desenho sem jsPDF real) ---
console.log('\nPDF - fake doc:');

function createFakeDoc() {
  const calls = [];
  const record = (method) => (...args) => { calls.push({ method, args }); };
  const doc = {
    setFont: record('setFont'),
    setFontSize: record('setFontSize'),
    setTextColor: record('setTextColor'),
    setDrawColor: record('setDrawColor'),
    setFillColor: record('setFillColor'),
    setCharSpace: record('setCharSpace'),
    text: record('text'),
    textWithLink: record('textWithLink'),
    line: record('line'),
    rect: record('rect'),
    addPage: record('addPage'),
    splitTextToSize: (text) => [text],
    getTextWidth: (text) => String(text).length * 2
  };
  return { doc, calls };
}

{
  const { doc, calls } = createFakeDoc();
  doc.text('ola', 10, 10);
  doc.setDrawColor(1, 2, 3);
  assert(calls.length === 2, 'createFakeDoc registra chamadas na ordem');
  assert(calls[0].method === 'text' && calls[0].args[0] === 'ola', 'createFakeDoc registra metodo e argumentos de text()');
  assert(calls[1].method === 'setDrawColor' && calls[1].args.join(',') === '1,2,3', 'createFakeDoc registra setDrawColor com os argumentos certos');
}
```

- [ ] **Step 2: Rodar e verificar que passa**

Run: `node tests/smoke-test.js`
Expected: as 3 novas asserções em "PDF - fake doc:" aparecem com `✓` e o total de `passed` sobe em 3, `failed` continua 0.

- [ ] **Step 3: Commit**

```bash
git add tests/smoke-test.js
git commit -m "test: adiciona fake doc jsPDF para testar js/pdf-export.js sem navegador"
```

---

## Task 2: Regra 01, linha divisoria abaixo do titulo de secao

**Files:**
- Modify: `js/pdf-export.js` (`drawSectionHeading`)
- Test: `tests/smoke-test.js`

**Interfaces:**
- Consumes: `createFakeDoc()` (Task 1).
- Consumes: `js/pdf-export.js` precisa estar carregado no smoke test antes deste bloco (ver Step 1, que adiciona o `loadScript`).
- Produces: nenhuma interface nova; `drawSectionHeading(doc, cursor, title, x, width, palette, density, hasFonts)` mantem a mesma assinatura, so passa a chamar `doc.setDrawColor(224, 224, 227)` e `doc.line(...)` internamente, exceto quando um novo parametro opcional `skipDivider` (booleano, default `false`) for `true`.

- [ ] **Step 1: Carregar `js/pdf-export.js` no smoke test e escrever o teste falho**

Logo apos o bloco `loadScript('js/preview.js');` em `tests/smoke-test.js`, adicionar:

```javascript
loadScript('js/characters.js');
loadScript('js/pdf-export.js');
```

E no bloco "PDF - fake doc" criado na Task 1, adicionar:

```javascript
{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 178 };
  EuGeroPdfExport.drawSectionHeading(doc, cursor, 'Experiência', 16, 178, palette, { fontPt: 10.5 }, false);
  const linha = calls.find((c) => c.method === 'line');
  assert(!!linha, 'drawSectionHeading desenha uma linha divisoria abaixo do titulo');
  const corAntesDaLinha = calls.filter((c) => c.method === 'setDrawColor');
  assert(corAntesDaLinha.some((c) => c.args.join(',') === '224,224,227'), 'Linha divisoria usa a cor neutra 224,224,227');
}
{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 60 };
  EuGeroPdfExport.drawSectionHeading(doc, cursor, 'Habilidades', 16, 60, palette, { fontPt: 10.5 }, false, true);
  assert(!calls.some((c) => c.method === 'line'), 'drawSectionHeading nao desenha linha quando skipDivider e true (coluna da sidebar)');
}
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `node tests/smoke-test.js`
Expected: FAIL em "drawSectionHeading desenha uma linha divisoria abaixo do titulo" porque `drawSectionHeading` nao esta exportada em `EuGeroPdfExport` nem desenha linha ainda. (Erro esperado: `EuGeroPdfExport.drawSectionHeading is not a function` ou assercao `false`.)

- [ ] **Step 3: Exportar `drawSectionHeading` e implementar a linha divisoria**

Em `js/pdf-export.js`, alterar a assinatura e o corpo de `drawSectionHeading` (linha 190 no arquivo atual):

```javascript
  function drawSectionHeading(doc, cursor, title, x, width, palette, density, hasFonts, skipDivider) {
    ensureSpace(doc, cursor, 8);
    cursor.y += 3;
    setFont(doc, 'BarlowCondensed', 'bold', density.fontPt + 1.5, hasFonts);
    doc.setTextColor(palette.accent700[0], palette.accent700[1], palette.accent700[2]);
    doc.text(title.toUpperCase(), x, cursor.y);
    cursor.y += 2.5;
    if (!skipDivider) {
      doc.setDrawColor(224, 224, 227);
      doc.line(x, cursor.y, x + width, cursor.y);
    }
    cursor.y += 3;
    setFont(doc, 'Barlow', 'normal', density.fontPt, hasFonts);
  }
```

No final do arquivo, no objeto retornado por `EuGeroPdfExport` (perto de `generatePdf, buildSectionsData, accentPalette`), adicionar `drawSectionHeading` a lista exportada para o teste conseguir chama-la diretamente:

```javascript
  return {
    generatePdf,
    buildSectionsData,
    accentPalette,
    drawSectionHeading
  };
```

Em `layoutSidebar` (a unica chamada que desenha titulos dentro da coluna estreita da sidebar, no bloco de habilidades/idiomas que usa `doc.text` direto, nao `drawSectionHeading`, entao nao precisa de ajuste aqui). Nenhuma outra chamada a `drawSectionHeading` no arquivo precisa passar `skipDivider`, pois todas as cinco familias usam divisoria na coluna principal.

- [ ] **Step 4: Rodar e verificar que passa**

Run: `node tests/smoke-test.js`
Expected: as duas novas asserções passam (`✓`), nenhum teste anterior quebra.

- [ ] **Step 5: Commit**

```bash
git add js/pdf-export.js tests/smoke-test.js
git commit -m "feat(pdf): desenha linha divisoria abaixo do titulo de cada secao"
```

---

## Task 3: Regra 02, cor dos titulos de item

**Files:**
- Modify: `js/pdf-export.js` (`drawBlocks`)
- Test: `tests/smoke-test.js`

**Interfaces:**
- Consumes: `EuGeroPdfExport.accentPalette` (ja exportada), `createFakeDoc()`.
- Produces: `drawBlocks` exportada em `EuGeroPdfExport` para o teste chamar direto.

- [ ] **Step 1: Escrever o teste falho**

Adicionar ao bloco "PDF - fake doc" em `tests/smoke-test.js`:

```javascript
{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 178 };
  const blocks = [{ type: 'item', title: 'Consultor Sênior', sub: 'Empresa X', period: '2020 - Atual', desc: '' }];
  EuGeroPdfExport.drawBlocks(doc, cursor, blocks, 16, 178, palette, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const corDoTitulo = calls.find((c) => c.method === 'setTextColor' && calls.indexOf(c) === calls.findIndex((x2) => x2.method === 'text' && x2.args[0] === 'Consultor Sênior') - 1);
  const idxTexto = calls.findIndex((c) => c.method === 'text' && c.args[0] === 'Consultor Sênior');
  const corAntes = [...calls].slice(0, idxTexto).reverse().find((c) => c.method === 'setTextColor');
  assert(!!corAntes, 'Existe uma cor definida antes do titulo do item');
  assert(corAntes.args.join(',') === palette.accent900.join(','), 'Titulo do item usa palette.accent900, nao a cor fixa anterior');
}
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `node tests/smoke-test.js`
Expected: FAIL em "Titulo do item usa palette.accent900" porque hoje `drawBlocks` usa `doc.setTextColor(29, 31, 32)` fixo, e a funcao ainda nao esta exportada.

- [ ] **Step 3: Implementar**

Em `js/pdf-export.js`, na funcao `drawBlocks` (linha 200), trocar:

```javascript
      ensureSpace(doc, cursor, 6);
      setFont(doc, 'BarlowCondensed', 'bold', density.fontPt + 1.5, hasFonts);
      doc.setTextColor(29, 31, 32);
      doc.text(block.title, x, cursor.y);
```

por:

```javascript
      ensureSpace(doc, cursor, 6);
      setFont(doc, 'BarlowCondensed', 'bold', density.fontPt + 1.5, hasFonts);
      doc.setTextColor(palette.accent900[0], palette.accent900[1], palette.accent900[2]);
      doc.text(block.title, x, cursor.y);
```

E adicionar `drawBlocks` ao objeto exportado:

```javascript
  return {
    generatePdf,
    buildSectionsData,
    accentPalette,
    drawSectionHeading,
    drawBlocks
  };
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `node tests/smoke-test.js`
Expected: as duas asserções novas passam.

- [ ] **Step 5: Commit**

```bash
git add js/pdf-export.js tests/smoke-test.js
git commit -m "fix(pdf): titulo de item usa a cor de destaque do template, nao preto fixo"
```

---

## Task 4: Regra 06, colisao entre titulo e periodo (fazer antes da Regra 03 porque tambem mexe em `drawBlocks`)

**Files:**
- Modify: `js/pdf-export.js` (`drawBlocks`)
- Test: `tests/smoke-test.js`

**Interfaces:**
- Consumes: `EuGeroPdfExport.drawBlocks` (Task 3), `doc.getTextWidth` do fake doc (Task 1, ja retorna `texto.length * 2`).

- [ ] **Step 1: Escrever o teste falho**

```javascript
{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 60 };
  const tituloLongo = 'Especializacao em Ciencia da Computacao Aplicada';
  const blocks = [{ type: 'item', title: tituloLongo, sub: 'Universidade X', period: '2018 - 2022', desc: '' }];
  EuGeroPdfExport.drawBlocks(doc, cursor, blocks, 16, 60, palette, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const idxTitulo = calls.findIndex((c) => c.method === 'text' && c.args[0] === tituloLongo);
  const idxPeriodo = calls.findIndex((c) => c.method === 'text' && c.args[0] === '2018 - 2022');
  assert(idxPeriodo > -1, 'Periodo continua sendo desenhado mesmo com titulo longo');
  const mesmaLinha = calls[idxTitulo].args[1] === calls[idxPeriodo].args[1];
  assert(!mesmaLinha, 'Com titulo longo, periodo vai para a linha seguinte em vez de sobrepor o titulo');
}
{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 178 };
  const blocks = [{ type: 'item', title: 'Consultor', sub: 'Empresa X', period: '2020 - Atual', desc: '' }];
  EuGeroPdfExport.drawBlocks(doc, cursor, blocks, 16, 178, palette, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const idxTitulo = calls.findIndex((c) => c.method === 'text' && c.args[0] === 'Consultor');
  const idxPeriodo = calls.findIndex((c) => c.method === 'text' && c.args[0] === '2020 - Atual');
  assert(calls[idxTitulo].args[1] === calls[idxPeriodo].args[1], 'Com titulo curto, periodo continua na mesma linha do titulo');
}
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `node tests/smoke-test.js`
Expected: FAIL em "periodo vai para a linha seguinte" (hoje sempre fica na mesma linha `cursor.y`).

- [ ] **Step 3: Implementar a checagem de colisao**

Em `js/pdf-export.js`, na funcao `drawBlocks`, trocar o trecho do periodo:

```javascript
      if (block.period) {
        setFont(doc, 'Barlow', 'normal', density.fontPt - 0.5, hasFonts);
        doc.setTextColor(107, 109, 111);
        doc.text(block.period, x + width, cursor.y, { align: 'right' });
      }
      cursor.y += density.fontPt * PT_TO_MM * 1.3;
```

por:

```javascript
      if (block.period) {
        setFont(doc, 'Barlow', 'normal', density.fontPt - 0.5, hasFonts);
        doc.setTextColor(107, 109, 111);
        const larguraTitulo = doc.getTextWidth(block.title);
        const larguraPeriodo = doc.getTextWidth(block.period);
        const cabemNaMesmaLinha = (larguraTitulo + larguraPeriodo + 4) <= width;
        if (cabemNaMesmaLinha) {
          doc.text(block.period, x + width, cursor.y, { align: 'right' });
          cursor.y += density.fontPt * PT_TO_MM * 1.3;
        } else {
          cursor.y += density.fontPt * PT_TO_MM * 1.3;
          doc.text(block.period, x + 3, cursor.y);
          cursor.y += density.fontPt * PT_TO_MM * 1.3;
        }
      } else {
        cursor.y += density.fontPt * PT_TO_MM * 1.3;
      }
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `node tests/smoke-test.js`
Expected: as tres asserções da Task 4 passam, nenhuma anterior quebra.

- [ ] **Step 5: Commit**

```bash
git add js/pdf-export.js tests/smoke-test.js
git commit -m "fix(pdf): move periodo para a linha seguinte quando o titulo do item e longo demais"
```

---

## Task 5: Regra 03, letter-spacing (charSpace) em nome e titulos de secao

**Files:**
- Modify: `js/pdf-export.js` (`drawSectionHeading`, e as 5 funcoes `layout*` no trecho que desenha `personal.fullName`)
- Test: `tests/smoke-test.js`

**Interfaces:**
- Consumes: `doc.setCharSpace` (adicionado ao fake doc na Task 1).

- [ ] **Step 1: Escrever o teste falho**

```javascript
{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const cursor = { x: 16, y: 16, margin: 16, colWidth: 178 };
  EuGeroPdfExport.drawSectionHeading(doc, cursor, 'Formação', 16, 178, palette, { fontPt: 10.5 }, false);
  const idxTexto = calls.findIndex((c) => c.method === 'text' && c.args[0] === 'FORMAÇÃO');
  const charSpaceAntes = [...calls].slice(0, idxTexto).reverse().find((c) => c.method === 'setCharSpace');
  assert(!!charSpaceAntes && charSpaceAntes.args[0] > 0, 'Titulo de secao recebe charSpace maior que zero antes de ser desenhado');
  const charSpaceDepois = calls.slice(idxTexto + 1).find((c) => c.method === 'setCharSpace');
  assert(!!charSpaceDepois && charSpaceDepois.args[0] === 0, 'charSpace e resetado para 0 depois do titulo de secao');
}
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `node tests/smoke-test.js`
Expected: FAIL, `drawSectionHeading` nunca chama `setCharSpace` hoje.

- [ ] **Step 3: Implementar**

Em `drawSectionHeading`, envolver a chamada de `doc.text(title.toUpperCase(), ...)` com `setCharSpace`:

```javascript
  function drawSectionHeading(doc, cursor, title, x, width, palette, density, hasFonts, skipDivider) {
    ensureSpace(doc, cursor, 8);
    cursor.y += 3;
    setFont(doc, 'BarlowCondensed', 'bold', density.fontPt + 1.5, hasFonts);
    doc.setTextColor(palette.accent700[0], palette.accent700[1], palette.accent700[2]);
    const sizePt = density.fontPt + 1.5;
    doc.setCharSpace(sizePt * PT_TO_MM * 0.08);
    doc.text(title.toUpperCase(), x, cursor.y);
    doc.setCharSpace(0);
    cursor.y += 2.5;
    if (!skipDivider) {
      doc.setDrawColor(224, 224, 227);
      doc.line(x, cursor.y, x + width, cursor.y);
    }
    cursor.y += 3;
    setFont(doc, 'Barlow', 'normal', density.fontPt, hasFonts);
  }
```

Aplicar o mesmo padrao (`setCharSpace` antes, `setCharSpace(0)` depois) em cada `layout*` no ponto em que desenha `personal.fullName`. Exemplo em `layoutCentered` (linha 239-241):

```javascript
    setFont(doc, 'BarlowCondensed', 'bold', 24, hasFonts);
    doc.setTextColor(26, 26, 46);
    doc.setCharSpace(24 * PT_TO_MM * 0.08);
    doc.text((personal.fullName || 'Seu Nome').toUpperCase(), PAGE_W / 2, cursor.y + 8, { align: 'center' });
    doc.setCharSpace(0);
```

Repetir o padrao (chamar `setCharSpace` com `tamanhoDeFonteUsado * PT_TO_MM * 0.08` antes de `doc.text(nome...)` e `setCharSpace(0)` logo depois) em `layoutLeft` (linha 264-266), `layoutBanner` (linha 287-289), `layoutSidebar` (linha 312-315, dentro do loop de `nameLines.forEach`) e `layoutCreative` (linha 375-377). Texto de corpo (`drawWrappedText`, `sub`, `desc`, `contactLine`) nao recebe `setCharSpace`.

- [ ] **Step 4: Rodar e verificar que passa**

Run: `node tests/smoke-test.js`
Expected: as duas asserções da Task 5 passam.

- [ ] **Step 5: Commit**

```bash
git add js/pdf-export.js tests/smoke-test.js
git commit -m "feat(pdf): aplica letter-spacing no nome e nos titulos de secao"
```

---

## Task 6: Regra 04, link do LinkedIn clicavel no cabecalho

**Files:**
- Modify: `js/pdf-export.js` (`contactLine`, chamadas nas 5 `layout*`, bloco de contato em `layoutSidebar`)
- Test: `tests/smoke-test.js`

**Interfaces:**
- Consumes: `doc.textWithLink` (adicionado ao fake doc na Task 1).
- Produces: `contactLine` passa a receber `linkedinUrl` separado (nao mais embutido na string), e as chamadas de `layout*` passam a desenhar o link com `doc.textWithLink` quando presente, em vez de so incluir na string de `doc.text`.

- [ ] **Step 1: Escrever o teste falho**

```javascript
{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#334155');
  const state = {
    personal: { fullName: 'Maria Teste', headline: 'Analista', email: 'maria@teste.com', phone: '', location: 'São Paulo', linkedinUrl: 'https://linkedin.com/in/maria-teste' },
    enabledSections: {}
  };
  const data = EuGeroPdfExport.buildSectionsData(state, []);
  data.state = state;
  EuGeroPdfExport.LAYOUTS.left(doc, data, palette, 16, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const link = calls.find((c) => c.method === 'textWithLink');
  assert(!!link, 'Cabecalho desenha o LinkedIn com textWithLink quando linkedinUrl esta preenchido');
  assert(link.args[3] && link.args[3].url === 'https://linkedin.com/in/maria-teste', 'Link aponta para a URL correta do LinkedIn');
}
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `node tests/smoke-test.js`
Expected: FAIL, `LAYOUTS` ainda nao esta exportado e `textWithLink` nunca e chamado.

- [ ] **Step 3: Implementar**

Em `js/pdf-export.js`, alterar `contactLine` para separar o LinkedIn:

```javascript
  function contactLineParts(personal) {
    return {
      base: [personal.email, personal.phone, personal.location].filter(Boolean).join('   ·   '),
      linkedinUrl: personal.linkedinUrl || ''
    };
  }
```

Manter `contactLine` como estava (usada em `layoutSidebar` para telefone/local, sem LinkedIn) e usar `contactLineParts` nos 4 cabecalhos principais. Exemplo em `layoutLeft` (linha 272-273):

```javascript
    setFont(doc, 'Barlow', 'normal', density.fontPt - 0.5, hasFonts);
    const { base, linkedinUrl } = contactLineParts(personal);
    const linha = [base, linkedinUrl].filter(Boolean).join('   ·   ');
    if (linkedinUrl) {
      doc.setTextColor(58, 60, 62);
      const larguraBase = base ? doc.getTextWidth(`${base}   ·   `) : 0;
      if (base) doc.text(`${base}   ·   `, margin, cursor.y);
      doc.setTextColor(palette.accent700[0], palette.accent700[1], palette.accent700[2]);
      doc.textWithLink(linkedinUrl, margin + larguraBase, cursor.y, { url: linkedinUrl });
    } else {
      doc.text(linha || 'contato@email.com · cidade', margin, cursor.y);
    }
```

Repetir o mesmo padrao (desenhar a parte base com `doc.text`, depois o LinkedIn com `doc.textWithLink` logo em seguida na mesma linha, usando `doc.getTextWidth` para calcular o `x` de continuacao) em `layoutCentered` (centralizado, entao calcular a largura total da linha primeiro com `doc.getTextWidth(linha)` e comecar em `PAGE_W / 2 - larguraTotal / 2`), `layoutBanner` e `layoutCreative`. Em `layoutSidebar` (linha 331-333), trocar:

```javascript
    if (personal.linkedinUrl) {
      drawWrappedText(doc, sideCursor, personal.linkedinUrl, sideCursor.x, sideCursor.colWidth, density.fontPt - 1, 1.3, [58, 60, 62]);
    }
```

por:

```javascript
    if (personal.linkedinUrl) {
      ensureSpace(doc, sideCursor, 6);
      setFont(doc, 'Barlow', 'normal', density.fontPt - 1, hasFonts);
      doc.setTextColor(58, 60, 62);
      doc.textWithLink(personal.linkedinUrl, sideCursor.x, sideCursor.y, { url: personal.linkedinUrl });
      sideCursor.y += (density.fontPt - 1) * PT_TO_MM * 1.3;
    }
```

No final do arquivo, exportar `LAYOUTS` para o teste conseguir chamar `EuGeroPdfExport.LAYOUTS.left` diretamente:

```javascript
  return {
    generatePdf,
    buildSectionsData,
    accentPalette,
    drawSectionHeading,
    drawBlocks,
    LAYOUTS
  };
```

- [ ] **Step 4: Rodar e verificar que passa**

Run: `node tests/smoke-test.js`
Expected: as duas asserções da Task 6 passam.

- [ ] **Step 5: Commit**

```bash
git add js/pdf-export.js tests/smoke-test.js
git commit -m "feat(pdf): link do LinkedIn no cabecalho vira clicavel via textWithLink"
```

---

## Task 7: Regra 05, fundo da sidebar em varias paginas

**Files:**
- Modify: `js/pdf-export.js` (`layoutSidebar`, `ensureSpace`)
- Test: `tests/smoke-test.js`

**Interfaces:**
- Consumes: `doc.addPage` (fake doc), `LAYOUTS.sidebar` (Task 6).
- Produces: `ensureSpace` passa a aceitar um quinto parametro opcional `onNewPage` (funcao chamada logo apos `doc.addPage()`).

- [ ] **Step 1: Escrever o teste falho**

```javascript
{
  const { doc, calls } = createFakeDoc();
  const palette = EuGeroPdfExport.accentPalette('#155e75');
  const experienciasLongas = Array.from({ length: 20 }, (_, i) => ({
    title: `Cargo ${i}`, company: `Empresa ${i}`, period: '2020 - 2021',
    description: 'Descricao longa o suficiente para forcar quebra de pagina no layout de teste, repetida varias vezes para garantir overflow do conteudo principal da coluna direita.'
  }));
  const state = {
    personal: { fullName: 'Maria Teste', headline: 'Analista', email: 'maria@teste.com', phone: '', location: 'São Paulo' },
    experiences: experienciasLongas,
    enabledSections: { experiences: true }
  };
  const sections = [{ id: 'experiences', title: 'Experiência', list: true, itemFields: [{ key: 'title' }, { key: 'company' }, { key: 'description' }] }];
  const data = EuGeroPdfExport.buildSectionsData(state, sections);
  data.state = state;
  EuGeroPdfExport.LAYOUTS.sidebar(doc, data, palette, 16, { fontPt: 10.5, lineHeightMult: 1.3 }, false);
  const paginas = calls.filter((c) => c.method === 'addPage').length;
  assert(paginas > 0, 'Conteudo longo forca pelo menos uma nova pagina neste cenario de teste');
  const fundos = calls.filter((c) => c.method === 'rect' && c.args[2] < 100 && c.args[3] > 290);
  assert(fundos.length === paginas + 1, 'O fundo da sidebar e redesenhado uma vez por pagina (inicial + cada addPage)');
}
```

- [ ] **Step 2: Rodar e verificar que falha**

Run: `node tests/smoke-test.js`
Expected: FAIL em "fundo da sidebar e redesenhado uma vez por pagina" porque hoje `doc.rect` do fundo so e chamado uma vez, no topo de `layoutSidebar`.

- [ ] **Step 3: Implementar**

Em `js/pdf-export.js`, alterar `ensureSpace` para aceitar um callback:

```javascript
  function ensureSpace(doc, cursor, heightMm, onNewPage) {
    if (cursor.y + heightMm > PAGE_H - cursor.margin) {
      doc.addPage();
      cursor.y = cursor.margin;
      if (onNewPage) onNewPage();
    }
  }
```

Em `layoutSidebar`, guardar a funcao que desenha o fundo e passar como `onNewPage` para as chamadas de `ensureSpace` feitas dentro dela (diretamente e via `drawWrappedText`/`drawBlocks`, que tambem chamam `ensureSpace` internamente e precisam do mesmo callback). Como `drawBlocks` e `drawWrappedText` nao recebem `onNewPage` hoje, adicionar esse parametro opcional a ambas e repassar:

```javascript
  function drawWrappedText(doc, cursor, text, x, width, sizePt, lineHeightMult, color, onNewPage) {
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, width);
    const lineHeightMm = sizePt * PT_TO_MM * lineHeightMult;
    lines.forEach((line) => {
      ensureSpace(doc, cursor, lineHeightMm, onNewPage);
      doc.text(line, x, cursor.y + sizePt * PT_TO_MM * 0.8);
      cursor.y += lineHeightMm;
    });
  }
```

```javascript
  function drawBlocks(doc, cursor, blocks, x, width, palette, density, hasFonts, onNewPage) {
    blocks.forEach((block) => {
      if (block.type === 'text') {
        setFont(doc, 'Barlow', 'normal', density.fontPt, hasFonts);
        drawWrappedText(doc, cursor, block.text, x, width, density.fontPt, density.lineHeightMult, [58, 60, 62], onNewPage);
        cursor.y += 1.5;
        return;
      }
      ensureSpace(doc, cursor, 6, onNewPage);
      // ... resto da funcao sem mudanca, exceto o drawWrappedText(desc) tambem recebe onNewPage
```

No `layoutSidebar`, extrair o desenho do fundo em uma funcao e repassar como `onNewPage` em toda chamada de `drawWrappedText`/`drawBlocks`/`ensureSpace` feita dentro da funcao (tanto na coluna lateral quanto na coluna principal):

```javascript
  function layoutSidebar(doc, data, palette, margin, density, hasFonts) {
    const { personal, sections } = data;
    const sidebarW = PAGE_W * 0.38;
    const desenharFundo = () => {
      doc.setFillColor(palette.accent100[0], palette.accent100[1], palette.accent100[2]);
      doc.rect(0, 0, sidebarW, PAGE_H, 'F');
    };
    desenharFundo();
    // ... nas chamadas de drawWrappedText e drawBlocks dentro desta funcao, adicionar
    // "desenharFundo" como ultimo argumento, por exemplo:
    // drawWrappedText(doc, sideCursor, ..., desenharFundo);
    // drawBlocks(doc, mainCursor, s.blocks, ..., desenharFundo);
```

Aplicar `desenharFundo` como ultimo argumento em todas as chamadas de `drawWrappedText`, `drawBlocks` e `ensureSpace` dentro de `layoutSidebar` (linhas 315-359 do arquivo atual). As demais 4 familias de layout nao tem fundo de pagina, entao continuam chamando `drawBlocks`/`drawWrappedText` sem o ultimo argumento (fica `undefined`, comportamento inalterado).

- [ ] **Step 4: Rodar e verificar que passa**

Run: `node tests/smoke-test.js`
Expected: as duas asserções da Task 7 passam, nenhuma anterior quebra (checar em especial as Tasks 2-6, que chamam `drawBlocks`/`drawSectionHeading` sem o novo argumento opcional).

- [ ] **Step 5: Commit**

```bash
git add js/pdf-export.js tests/smoke-test.js
git commit -m "fix(pdf): redesenha o fundo da sidebar em cada nova pagina do PDF"
```

---

## Task 8: Regra 07, religar o botao ao caminho jsPDF

**Files:**
- Modify: `js/screens/review.js` (nova funcao `downloadPdf`, `loadPdfVendor`)
- Modify: `js/app.js:216`
- Test: `tests/smoke-test.js` (atualizar as asserções que hoje verificam o caminho antigo)

**Interfaces:**
- Consumes: `EuGeroPdfExport.generatePdf(state, enabledSections, templateId, marginKey, densityKey)` (ja existe, sem mudanca de assinatura).
- Produces: `EuGeroReviewScreen.downloadPdf()` (nova, exportada), `EuGeroReviewScreen.printCv()` (mantida, sem mudanca).

- [ ] **Step 1: Atualizar os testes que hoje esperam o caminho antigo**

Em `tests/smoke-test.js`, no bloco "Exportação de PDF" (linha ~709), substituir:

```javascript
assert(reviewJsCode.includes('window.print()'), 'Exportação usa a impressão nativa, fiel à prévia');
assert(appJsCode.includes('EuGeroReviewScreen.printCv'), 'Botão de exportação chama printCv');
assert(!reviewJsCode.includes('EuGeroPdfExport.generatePdf('), 'Exportação não usa renderizador PDF paralelo');
```

por:

```javascript
assert(reviewJsCode.includes('function downloadPdf'), 'review.js define downloadPdf');
assert(appJsCode.includes('EuGeroReviewScreen.downloadPdf'), 'Botão de exportação chama downloadPdf');
assert(reviewJsCode.includes('EuGeroPdfExport.generatePdf('), 'downloadPdf usa o gerador jsPDF');
assert(reviewJsCode.includes('function printCv'), 'printCv continua disponível para Ctrl+P');
```

Isso deixa o teste falho ate o Step 3.

- [ ] **Step 2: Rodar e verificar que falha**

Run: `node tests/smoke-test.js`
Expected: FAIL nas 4 novas asserções (o codigo antigo ainda usa `window.print()` no botao).

- [ ] **Step 3: Implementar `downloadPdf` e religar o botao**

Em `js/screens/review.js`, adicionar (proximo de `printCv`, apos a linha 191):

```javascript
  let pdfVendorPromise = null;

  function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      document.head.appendChild(script);
    });
  }

  function loadPdfVendor() {
    if (!pdfVendorPromise) {
      pdfVendorPromise = Promise.all([
        loadScriptOnce('js/vendor/jspdf.umd.min.js'),
        loadScriptOnce('js/vendor/fonts-barlow.js')
      ]).then(() => loadScriptOnce('js/pdf-export.js'))
        .catch((err) => { pdfVendorPromise = null; throw err; });
    }
    return pdfVendorPromise;
  }

  async function downloadPdf() {
    const btn = document.getElementById('btn-export-pdf');
    const rotuloOriginal = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Gerando PDF...'; }
    try {
      await loadPdfVendor();
      const state = ctx.getState();
      const sections = ctx.activeSections();
      const doc = EuGeroPdfExport.generatePdf(state, sections, state.template, state.margin || 'padrao', state.density || 'normal');
      doc.save(`${cvFileBaseName()}.pdf`);
    } catch (err) {
      ctx.showToast?.('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = rotuloOriginal; }
    }
  }
```

E adicionar `downloadPdf` ao objeto retornado (junto de `printCv`, linha 254):

```javascript
  return {
    init,
    syncGalleryToTemplate,
    galleryStep,
    renderReview,
    renderReviewGallery,
    renderReviewTemplateGallery,
    cvFileBaseName,
    printCv,
    downloadPdf
  };
```

Em `js/app.js:216`, trocar:

```javascript
document.getElementById('btn-export-pdf')?.addEventListener('click', EuGeroReviewScreen.printCv);
```

por:

```javascript
document.getElementById('btn-export-pdf')?.addEventListener('click', EuGeroReviewScreen.downloadPdf);
```

Nota: `ctx.showToast` deve ser o mesmo mecanismo de aviso ja usado em outras falhas do app (`js/app.js`); se o nome real do metodo no `ctx` for diferente, usar o existente em vez de criar um novo (checar `buildScreenContext` em `js/app.js` antes de implementar este step).

- [ ] **Step 4: Rodar e verificar que passa**

Run: `node tests/smoke-test.js`
Expected: as 4 asserções do Step 1 passam.

- [ ] **Step 5: Commit**

```bash
git add js/screens/review.js js/app.js tests/smoke-test.js
git commit -m "feat(pdf): botao de exportar passa a baixar PDF via jsPDF, nao mais impressao nativa"
```

---

## Task 9: Carregamento sob demanda (CA09) e checagem final de 1 pagina por familia (CA08, manual)

**Files:**
- Test: `tests/smoke-test.js`
- Manual QA: navegador (Chrome via `python3 -m http.server`, como usado na auditoria de UX desta mesma spec)

**Interfaces:**
- Consumes: `js/screens/review.js` (`loadPdfVendor`, Task 8).

- [ ] **Step 1: Escrever teste de carregamento sob demanda**

Adicionar em `tests/smoke-test.js`, no bloco "Exportação de PDF":

```javascript
assert(!reviewJsCode.includes("loadScriptOnce('js/vendor/jspdf.umd.min.js')") || reviewJsCode.includes('function loadPdfVendor'),
    'Scripts do jsPDF sao carregados dentro de loadPdfVendor, nao no topo do modulo');
const indexHtmlCode = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(!indexHtmlCode.includes('jspdf.umd.min.js') && !indexHtmlCode.includes('pdf-export.js'),
    'index.html nao carrega os scripts de PDF por tag <script> direta (carregamento e sob demanda)');
```

- [ ] **Step 2: Rodar e verificar que passa (ou ajustar `index.html` se falhar)**

Run: `node tests/smoke-test.js`
Expected: se `index.html` ja nao referenciava esses scripts (confirmado na auditoria: `pdf-export.js` nao aparecia em nenhum `.html`), a assercao ja passa sem mudanca de codigo. Se falhar, remover a tag `<script>` correspondente de `index.html`.

- [ ] **Step 3: Commit**

```bash
git add tests/smoke-test.js
git commit -m "test: garante que os scripts de PDF so carregam sob demanda"
```

- [ ] **Step 4: QA manual das 5 familias de layout (CA08)**

Procedimento (nao automatizado, registrar resultado no PR):

1. `cd` ate a raiz do repositorio e rodar `python3 -m http.server 8080`.
2. Abrir `http://localhost:8080/index.html#/`, escolher o personagem "Sherlock Holmes" (familia `banner` no template padrao).
3. Ir ate a Revisao, clicar em "Baixar currículo em PDF", abrir o arquivo baixado e confirmar: uma pagina, linha divisoria abaixo de cada titulo de secao, titulo dos itens na cor de destaque, texto do LinkedIn como link clicavel (se preenchido no personagem), nome com letter-spacing visivelmente maior que o texto de corpo.
4. Repetir o passo 3 trocando o modelo na galeria de revisao para um de cada familia restante (`centered`, `left`, `sidebar`, `creative`; ver `js/config.js` para um `id` de cada `layout`).
5. Para o modelo de familia `sidebar`, confirmar que o fundo colorido cobre toda a coluna lateral ate o rodape da pagina.
6. Registrar no PR, para cada uma das 5 familias, se o PDF abriu com uma pagina e com os itens do passo 3 presentes. Se algum ponto falhar, abrir um item de acompanhamento antes de mesclar o PR (nao faz parte desta spec corrigir achados novos nao previstos nas seis regras).

---

## Task 10: Atualizar status da spec e fechar o ciclo

**Files:**
- Modify: `.docs/specs/feat-pdf-fidelidade-visual-caminho-unico.md`

- [ ] **Step 1: Marcar os criterios de aceite verificados**

Em `.docs/specs/feat-pdf-fidelidade-visual-caminho-unico.md`, marcar `[x]` em CA01 a CA07 e CA09 (verificados por teste automatizado nas Tasks 2-9) e CA08 (verificado manualmente na Task 9, Step 4, com o resultado registrado no PR). Atualizar o campo `**Status:**` de `Aprovado` para `Concluído`.

- [ ] **Step 2: Commit**

```bash
git add .docs/specs/feat-pdf-fidelidade-visual-caminho-unico.md
git commit -m "docs: marca spec de fidelidade visual do PDF como concluida"
```

- [ ] **Step 3: Abrir PR**

Seguir o fluxo padrao do repositorio (`.rules/global.md`, secao 3): push do branch `feat/pdf-fidelidade-visual-caminho-unico`, PR contra `main`, sem push direto. Referenciar no corpo do PR o diagnostico `.docs/diagnostico-evolucao-2026-07-31.md` (PR #37) e o item P-1.

---

## Self-Review (executado ao escrever este plano)

- **Cobertura da spec:** US01-US05 cobertas pelas Tasks 2-8; Regras 01-07 cada uma com sua task dedicada (Tasks 2, 3, 5, 6, 7, 4, 8); Falha 01 coberta na Task 8 (`try/catch` com aviso e reset do botao); Limite 01 respeitado (nenhuma task pixel-perfetta por modelo). CA01-CA09 mapeados: CA01/CA09 na Task 8/9, CA02 na Task 2, CA03 na Task 3, CA04 na Task 5, CA05 na Task 6, CA06 na Task 7, CA07 na Task 4, CA08 na Task 9 (manual).
- **Placeholders:** nenhum "TBD"/"implementar depois" nas tasks; todo trecho de codigo esta completo o suficiente para ser colado com ajuste minimo de contexto ao redor.
- **Consistencia de tipos/nomes:** `createFakeDoc()` (Task 1) e reaproveitado sem mudanca de interface nas Tasks 2-7; `drawSectionHeading`, `drawBlocks`, `LAYOUTS` exportados progressivamente (Tasks 2, 3, 6) e usados com o mesmo nome nas tasks seguintes; `downloadPdf`/`loadPdfVendor` (Task 8) usam exatamente o nome verificado no teste da Task 9.
- **Risco assumido explicitamente:** a Task 9 usa QA manual para CA08 (contagem de paginas real via jsPDF), porque rodar jsPDF de verdade dentro do harness Node de `tests/smoke-test.js` exigiria polyfills de `document`/canvas nao presentes hoje no projeto; as Tasks 1-8 testam a logica de desenho via fake doc, que cobre as seis regras sem depender de jsPDF real.
