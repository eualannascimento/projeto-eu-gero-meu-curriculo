# Task 7: Responsividade, contraste e estados de interação

## Entrega

- Ajustados os tokens de texto auxiliar, acento, sucesso, alerta, erro e desabilitado para contraste WCAG 2.2 AA. As razões verificadas ficam entre 4,71:1 e 14,79:1 nos pares aplicáveis.
- A prévia móvel usa um drawer com altura dinâmica (`dvh`), rolagem interna e contenção de overscroll. As regras CSS definem 44 CSS px para o botão de fechar e controles móveis críticos.
- Criado o cenário Playwright `tests/e2e/responsive.spec.js` para 1440 x 900 e 320 x 800. No móvel, ele abre modal e drawer pelos gatilhos visíveis da tela inicial, mede alvos de toque de 44 px e verifica o retorno do foco. O cenário está pronto, mas não foi executado neste worktree.
- O título "Sugestões para adicionar" passou a usar `--color-text-muted`; há regressão específica no smoke test para impedir o retorno à cor translúcida sem contraste suficiente.
- Corrigida a impressão nativa: `syncPrintCv()` agora aplica a mesma paleta do modelo selecionado à área usada por Ctrl+P. A regressão é exercitada no smoke test com o modelo Petróleo.

## Validação executada

- `node tests/smoke-test.js`: 309 testes passaram.
- `node tests/pdf-layout-validation.js`: cinco famílias de layout geraram PDF A4 de uma página com texto extraível.
- `node --check tests/e2e/responsive.spec.js` e verificações de sintaxe dos módulos alterados: passaram. Isto confirma somente a sintaxe, não executa o navegador.
- Cálculo local de contraste: normal 14,79:1; botão primário 6,47:1; sucesso 4,71:1; alerta 4,98:1; erro 5,88:1; desabilitado 5,02:1; texto auxiliar no fundo claro 5,87:1.

## Limitação concreta de E2E

O worktree não contém `package.json`, `node_modules` nem `@playwright/test`. Por isso, a execução real de `tests/e2e/responsive.spec.js` falha com `MODULE_NOT_FOUND: @playwright/test`. Logo, não há evidência de execução real de overflow, foco, modal, drawer ou alvos de toque neste ambiente. O spec está sintaticamente válido e pronto para execução quando a infraestrutura Playwright for adicionada, sem adicionar dependências nesta tarefa.
