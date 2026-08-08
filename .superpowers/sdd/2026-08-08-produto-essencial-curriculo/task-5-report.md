# Task 5: Sanitização de URLs no PDF

## Resultado

`EuGeroUtils.safeUrl` passou a ser aplicado nos limites de persistência e do
exportador PDF. Somente URLs `http:` e `https:` normalizadas podem ser usadas
como destino de `textWithLink`.

## Alterações

1. `js/storage.js` normaliza `personal.linkedinUrl` ao importar/mesclar,
   salvar no `localStorage` e exportar o backup JSON.
2. `js/pdf-export.js` normaliza a URL no cabeçalho e na barra lateral antes de
   criar a anotação PDF.
3. `tests/smoke-test.js` cobre `javascript:`, `data:`, `vbscript:`, URL sem
   esquema e URL HTTPS, inclusive com PDFs reais nos caminhos `classic` e
   `modern` (barra lateral).

## Validação

1. Red: os novos cenários falharam antes da implementação: importação,
   backup JSON e anotação PDF ainda aceitavam URL executável.
2. `node tests/smoke-test.js`: 314 testes aprovados, 0 falhas.
3. `node tests/pdf-layout-validation.js`: os cinco layouts continuam A4, com
   uma página e texto extraível.
4. Inspeção das anotações reais no smoke test: PDFs `classic` e `modern`
   (barra lateral) com `javascript:`, `data:` e `vbscript:` não contêm `/URI`;
   URL sem esquema gera `/URI` com destino HTTPS normalizado; URL HTTPS válida
   mantém anotação.
5. `git diff --check`: sem erros.
