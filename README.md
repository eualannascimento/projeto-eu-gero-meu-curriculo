# Eu Gero Meu Curriculo

Aplicação web estática para criar currículos em PDF de uma ou duas páginas. Os dados ficam neste dispositivo e não são enviados a servidores.

## Funcionalidades

- Wizard com oito seções: dados pessoais, resumo, experiências, formação, habilidades, idiomas, certificações e projetos.
- Cinco famílias estruturais: Clássico, Minimalista, Marinho, Petróleo e Criativo. O Clássico é o padrão.
- Prévia ao vivo e revisão com indicação estrutural de leitura por ATS.
- PDF A4 com texto selecionável, uma página por padrão e até duas quando o conteúdo exigir.
- Backup JSON, importação validada, autosave e exclusão explícita dos dados locais.
- Roteamento por hash, incluindo `#/wizard/experiences`.

## Como usar

Abra `index.html` no navegador. Opcionalmente sirva localmente:

```bash
python3 -m http.server 8080
# http://localhost:8080
```

### URLs (deep links)

| Hash | Tela |
|------|------|
| `#/` | Escolha do ponto de partida |
| `#/start` | Escolha de template e secoes |
| `#/wizard/personal` | Wizard (secao especifica) |
| `#/review` | Revisao e exportacao |
| `#/guide` | Guia LinkedIn |

## Estrutura do projeto

```
index.html
css/
  fonts.css         Barlow self-hosted (substitui o CDN do Google)
  base.css          Tokens, header, botoes, cards, formularios, home antiga
  layout.css        Telas, layout do wizard, timeline, campos e listas
  templates.css     Preview A4 e estilos das cinco famílias estruturais
  print-preview.css Impressao, chips, controles de pagina, review, modais, toast
  responsive.css    Media queries, acessibilidade e ajustes mobile
js/
  config.js         Seções, campos, cinco famílias e metadados ATS
  dates.js          Mes/ano e formatacao de periodos
  scoring.js        Pontuação por qualidade e indicação de extensão
  validation.js     E-mail, URL, campos obrigatorios
  storage.js        localStorage + JSON
  preview.js        Prévia ao vivo
  characters.js     Personagens de exemplo (estados completos)
  linkedin-guide.js Guia LinkedIn
  router.js         Hash routing
  a11y.js           Modais acessiveis (Esc, focus trap)
  sample-data.js    Dados de exemplo
  app.js            Orquestracao
  screens/          Telas de início, wizard e revisão
  utils.js          Escape de HTML, sanitizacao de URL e debounce
tests/smoke-test.js
```

## Privacidade e funcionamento local

O currículo, a prévia, o PDF e o backup JSON são processados no navegador. O rascunho usa `localStorage`. Não há conta, backend, analytics, sincronização ou recursos de IA.

## Testes

```bash
node tests/smoke-test.js
```

Cobre regras de preenchimento, validação, datas, rotas, PDF, JSON, persistência local, cinco famílias estruturais e dados de exemplo.

## Deploy (GitHub Pages)

1. Push para o GitHub
2. Settings → Pages → branch `main`, pasta `/ (root)`
3. URL de producao: https://classificavagas.com/resume/ (o repositorio do site sincroniza este conteudo no deploy; ver `scripts/sync-resume.py` lá)

## Stack

HTML, CSS e JavaScript puro - sem framework, sem bundler.

## Licenca

MIT. Ver [LICENSE](./LICENSE).
