# Task 7: Responsividade, contraste e estados de interação

## Entrega

- Ajustados os tokens de texto auxiliar, acento, sucesso, alerta, erro e desabilitado para contraste WCAG 2.2 AA. As razões verificadas ficam entre 4,71:1 e 14,79:1 nos pares aplicáveis.
- A prévia móvel usa um drawer com altura dinâmica (`dvh`), rolagem interna e contenção de overscroll. O botão de fechar e os controles críticos do celular têm alvo mínimo de 44 CSS px.
- Criado o cenário Playwright `tests/e2e/responsive.spec.js` para 1440 x 900 e 320 x 800. Ele cobre overflow horizontal, foco visível, modal de modelos, drawer da prévia e tokens de contraste.
- Corrigida a impressão nativa: `syncPrintCv()` agora aplica a mesma paleta do modelo selecionado à área usada por Ctrl+P. A regressão é exercitada no smoke test com o modelo Petróleo.

## Validação executada

- `node tests/smoke-test.js`: 308 testes passaram.
- `node tests/pdf-layout-validation.js`: cinco famílias de layout geraram PDF A4 de uma página com texto extraível.
- `node --check tests/e2e/responsive.spec.js` e verificações de sintaxe dos módulos alterados: passaram.
- Cálculo local de contraste: normal 14,79:1; botão primário 6,47:1; sucesso 4,71:1; alerta 4,98:1; erro 5,88:1; desabilitado 5,02:1.

## Limitação concreta de E2E

O worktree não contém `package.json`, `node_modules` nem `@playwright/test`. Por isso, a execução real de `tests/e2e/responsive.spec.js` falha com `MODULE_NOT_FOUND: @playwright/test`. O spec está sintaticamente válido e pronto para execução quando a infraestrutura Playwright for adicionada, sem adicionar dependências nesta tarefa.
