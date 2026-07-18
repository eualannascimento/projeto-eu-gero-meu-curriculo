# Feat: Link do LinkedIn clicavel na previa e no PDF

**Status:** Aprovado
**Data:** 2026-07-18

## 1. Resumo e Objetivo
`personal.linkedinUrl` hoje e renderizado como texto simples na previa e no PDF exportado, mesmo ja sendo validado como URL `http(s)://` valida em `js/validation.js`. Este feat torna esse campo um link clicavel (`<a href>`), melhorando a experiencia de quem le o currículo em tela ou em PDF com hyperlinks.

## 2. User Stories (Requisitos Funcionais)
* **US01:** Como pessoa lendo um curriculo em PDF/tela, quero clicar no link do LinkedIn do candidato, para abrir o perfil direto sem copiar/colar a URL.

## 3. Regras de Negocio e Casos de Falha (Edge Cases)
* **Regra 01 (Seguranca):** o `href` usa `EuGeroUtils.escapeAttr` e o texto visivel usa `EuGeroUtils.escapeHtml`; o link so e gerado quando `personal.linkedinUrl` esta preenchido (ja validado como `http://` ou `https://` por `js/validation.js`, nunca `javascript:`).
* **Regra 02:** o link abre em nova aba (`target="_blank"`) com `rel="noopener noreferrer"` para nao vazar `window.opener`.
* **Falha 01:** se `linkedinUrl` estiver vazio, comportamento atual e mantido (nenhum link, nenhum texto).

## 4. Estrutura de Dados e Componentes
* **Alterado:** `js/preview.js` - `renderSidebarLayout`, `renderCenteredLayout`, `renderLeftLayout`, `renderCreativeLayout` passam a renderizar `personal.linkedinUrl` como `<a>` quando presente.

## 5. Criterios de Aceite (verificaveis por teste)
* [ ] CA01: com `linkedinUrl` preenchida, o HTML gerado por `EuGeroPreview.render` contem `<a href="...">` apontando para a URL escapada.
* [ ] CA02: o link inclui `target="_blank"` e `rel="noopener noreferrer"`.
* [ ] CA03: `node tests/smoke-test.js` continua passando sem alteracao de asercoes preexistentes.

## 6. Fora de Escopo
* Adicionar outros campos de contato como link (email `mailto:`, telefone `tel:`).
