# Produto essencial de currículo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Transformar o criador de currículo em um fluxo guiado confiável, responsivo e privado, com PDF A4 de no máximo duas páginas.

**Architecture:** Manter a SPA em JavaScript puro e o estado atual, mas concentrar regras em serviços pequenos para roteamento, validação, persistência e exportação. A jornada usará um gate único de conclusão e revisão; a prévia continuará compartilhando dados com o PDF. A implementação deve preservar o processamento local e reduzir código morto antes de adicionar novas abstrações.

**Tech Stack:** HTML5, CSS, JavaScript sem framework ou bundler, jsPDF 4.2.1 vendorizado, Node para testes, Playwright para E2E e GitHub Actions para CI.

## Global Constraints

- Público: candidatos brasileiros em geral.
- Interface e documentação em português do Brasil.
- Uma página por padrão e no máximo duas páginas na exportação.
- IA, conta, backend, analytics e sincronização fora do escopo.
- Autosave somente em localStorage, com importação e exportação JSON.
- Cinco estruturas visuais com modelo clássico ATS como padrão.
- URL exportada permite somente https: e http: normalizados.
- WCAG 2.2 AA é o alvo de contraste, foco, teclado e mensagens.
- Não adicionar dependências sem justificativa e teste de licença.

---

### Task 1: Estado de rascunho e contrato de fluxo

**Files:**
- Modify: js/storage.js
- Modify: js/app.js
- Modify: js/router.js
- Modify: js/screens/start.js
- Test: tests/smoke-test.js

**Interfaces:**
- Produces EuGeroStorage.hasDraft(): boolean, EuGeroStorage.clear(): boolean e goToReview({ validate: true }): boolean.

- [ ] Step 1: Write the failing tests para detectar rascunho local com conteúdo, bloquear revisão vazia e permitir revisão válida.
- [ ] Step 2: Run test command node tests/smoke-test.js e confirmar falhas novas.
- [ ] Step 3: Implement the minimal state contract preservando migração de schema e evitando sobrescrever rascunho ao abrir a tela inicial.
- [ ] Step 4: Run test command node tests/smoke-test.js e confirmar passagem.
- [ ] Step 5: Commit com git add js/storage.js js/app.js js/router.js js/screens/start.js tests/smoke-test.js e mensagem fix: gate draft resume and review entry.

### Task 2: Validação de listas e mensagens acessíveis

**Files:**
- Modify: js/validation.js
- Modify: js/screens/wizard.js
- Modify: js/screens/review.js
- Modify: css/screens.css
- Test: tests/smoke-test.js

**Interfaces:**
- Produces validateWizardStep(stepId): { valid: boolean, errors: Array<{ itemId: string, field: string, message: string }> }.

- [ ] Step 1: Write the failing tests para duas experiências com erro na primeira, foco no primeiro campo inválido e resumo de erros.
- [ ] Step 2: Run the focused tests e confirmar que o comportamento atual falha.
- [ ] Step 3: Implement error mapping para renderizar erros de itens não ativos e selecionar a aba correta.
- [ ] Step 4: Add accessible associations com aria-invalid, aria-describedby, role alert e links de resumo.
- [ ] Step 5: Run the focused tests e confirmar passagem.
- [ ] Step 6: Commit com git add js/validation.js js/screens/wizard.js js/screens/review.js css/screens.css tests/smoke-test.js e mensagem fix: expose validation errors in wizard lists.

### Task 3: Autosave, backup e exclusão local

**Files:**
- Modify: js/storage.js
- Modify: js/app.js
- Modify: js/screens/start.js
- Modify: index.html
- Test: tests/smoke-test.js

**Interfaces:**
- Produces saveState(): boolean, loadDraft(): State | null, exportState(): Blob e clearLocalData(): boolean.

- [ ] Step 1: Write failing tests para quota simulada, indicação de falha, continuação de rascunho e limpeza completa.
- [ ] Step 2: Run tests e confirmar falhas.
- [ ] Step 3: Implement return-value handling para somente mostrar sucesso após localStorage.setItem concluir.
- [ ] Step 4: Add start actions para continuar rascunho, começar de novo com confirmação e apagar dados locais.
- [ ] Step 5: Run tests e confirmar passagem.
- [ ] Step 6: Commit com git add js/storage.js js/app.js js/screens/start.js index.html tests/smoke-test.js e mensagem fix: make local drafts recoverable and deletable.

### Task 4: Limite real de uma ou duas páginas

**Files:**
- Modify: js/pdf-export.js
- Modify: js/app.js
- Modify: js/screens/review.js
- Modify: js/preview.js
- Test: tests/smoke-test.js

**Interfaces:**
- Produces getPageLimit(state): number, measureExport(state): { pages: number, issues: string[] } e downloadPdf(state): Promise<boolean>.

- [ ] Step 1: Write failing tests para conteúdo mínimo, típico, segundo page break e excesso acima de duas páginas.
- [ ] Step 2: Run tests e confirmar que o modo detalhado atual excede o limite.
- [ ] Step 3: Pass page mode explicitly ao gerador e implementar medição final antes do download.
- [ ] Step 4: Block or guide overflow com mensagem acionável e links para reduzir conteúdo.
- [ ] Step 5: Generate real PDFs nos cinco layouts e validar pdfinfo e pdftotext.
- [ ] Step 6: Commit com git add js/pdf-export.js js/app.js js/screens/review.js js/preview.js tests/smoke-test.js e mensagem fix: enforce two-page resume export limit.

### Task 5: Sanitização de URLs no PDF

**Files:**
- Modify: js/utils.js
- Modify: js/storage.js
- Modify: js/pdf-export.js
- Test: tests/smoke-test.js

**Interfaces:**
- Produces safeUrl(value): string | null usada tanto pela prévia quanto pelo PDF.

- [ ] Step 1: Write failing tests para javascript:, data:, vbscript:, URL sem esquema e URL HTTPS.
- [ ] Step 2: Run tests e confirmar que o PDF atual contém URI perigosa.
- [ ] Step 3: Normalize before storage and export usando uma única função compartilhada.
- [ ] Step 4: Inspect PDF annotations e confirmar ausência de esquemas proibidos.
- [ ] Step 5: Commit com git add js/utils.js js/storage.js js/pdf-export.js tests/smoke-test.js e mensagem fix: sanitize exported profile links.

### Task 6: Redução do catálogo e remoção de IA/código morto

**Files:**
- Modify: js/config.js
- Modify: js/screens/start.js
- Modify: js/screens/wizard.js
- Modify: js/screens/review.js
- Modify: index.html
- Modify: README.md
- Modify: .docs/architecture.md
- Test: tests/smoke-test.js

- [ ] Step 1: Write failing tests para cinco estruturas, modelo clássico padrão e ausência de acionadores de IA.
- [ ] Step 2: Run tests e confirmar divergências de catálogo e documentação.
- [ ] Step 3: Keep five structural families e mapear variações de cor sem duplicar regras de layout.
- [ ] Step 4: Remove AI triggers and dead menu bindings e atualizar textos visíveis.
- [ ] Step 5: Align README and architecture com oito seções, PDF atual, persistência local e ausência de backend.
- [ ] Step 6: Run tests e confirmar passagem.
- [ ] Step 7: Commit com git add js/config.js js/screens/start.js js/screens/wizard.js js/screens/review.js index.html README.md .docs/architecture.md tests/smoke-test.js e mensagem refactor: align product scope and template catalog.

### Task 7: Responsividade, contraste e estados de interação

**Files:**
- Modify: css/base.css
- Modify: css/layout.css
- Modify: css/screens.css
- Modify: css/responsive.css
- Test: tests/e2e/responsive.spec.js

- [ ] Step 1: Write E2E cases para 1440 x 900 e 320 x 800, prévia, menu, modal e todos os controles críticos.
- [ ] Step 2: Run E2E e registrar falhas de overflow, foco e contraste.
- [ ] Step 3: Adjust color tokens para atingir contraste AA nos estados normal, sucesso, alerta, erro e desabilitado.
- [ ] Step 4: Implement responsive preview drawer e manter alvos de toque com pelo menos 44 CSS px.
- [ ] Step 5: Run E2E com teclado e viewport mobile e confirmar passagem.
- [ ] Step 6: Commit com git add css tests/e2e/responsive.spec.js e mensagem feat: improve accessible responsive resume flow.

### Task 8: CI, documentação e validação pós-deploy

**Files:**
- Create: .github/workflows/ci.yml
- Create: tests/e2e/critical-flow.spec.js
- Modify: README.md
- Modify: .docs/architecture.md
- Modify: package.json

- [ ] Step 1: Add minimal test scripts para smoke, sintaxe, E2E e geração de PDF sem instalar frameworks desnecessários.
- [ ] Step 2: Write critical E2E cases para começar em branco, retomar rascunho, validar lista, revisar e exportar.
- [ ] Step 3: Run local CI commands e confirmar todos os resultados.
- [ ] Step 4: Create GitHub Actions workflow que executa os mesmos comandos em cada pull request.
- [ ] Step 5: Add deploy verification para comparar arquivos publicados e testar carregamento da aplicação.
- [ ] Step 6: Update docs com comandos, escopo atual e limitações ATS/offline.
- [ ] Step 7: Commit com git add .github/workflows/ci.yml tests/e2e/critical-flow.spec.js package.json README.md .docs/architecture.md e mensagem ci: verify critical resume journeys.

## Self-review checklist

- [ ] Cada decisão da especificação possui pelo menos uma tarefa.
- [ ] Nenhuma tarefa depende de IA, conta ou backend.
- [ ] O limite de duas páginas é validado no PDF real.
- [ ] O mesmo gate controla botão, rota, revisão e exportação.
- [ ] Mobile e desktop possuem testes de jornada.
- [ ] Não há marcadores de preenchimento neste plano.
