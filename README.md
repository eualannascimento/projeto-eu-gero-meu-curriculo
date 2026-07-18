# Eu Gero Meu Curriculo

Plataforma web estatica, 100% gratuita e sem servidor, para criar curriculos de **uma pagina** e guias LinkedIn. Todos os dados ficam no seu navegador - nada e enviado automaticamente para servidores externos.

## Funcionalidades

- **Homepage** com explicacao do objetivo e acesso central
- **Selecao de personagens** de exemplo (figuras de dominio publico) para comecar de um curriculo preenchido
- **Wizard passo a passo** com 13 secoes alinhadas ao LinkedIn
- **20 templates** esteticos e prontos para vaga (a maioria amigavel a ATS; alguns mais criativos com barra lateral ou selo)
- **Preview ao vivo** com linha de corte de 1 pagina A4 e alerta de overflow
- **Pontuacao por qualidade** (Fraco / Bom / Otimo) - textos curtos e bons nao sao punidos
- **Revisao** com galeria comparativa de todos os templates
- **Exportacao** PDF pela impressao do navegador ("Salvar como PDF"), 100% identico a previa em qualquer modelo
- **Backup JSON** - exportar e importar rascunhos
- **Guia LinkedIn** e prompts para IA (copiar/colar manual)
- **Roteamento por hash** (`#/wizard/experiences`) com suporte a Voltar/Avancar do navegador
- **Persistencia** automatica no `localStorage` com indicador "Salvo"

## Como usar

Abra `index.html` no navegador. Opcionalmente sirva localmente:

```bash
python3 -m http.server 8080
# http://localhost:8080
```

### URLs (deep links)

| Hash | Tela |
|------|------|
| `#/` | Homepage |
| `#/start` | Escolha de template e secoes |
| `#/wizard/personal` | Wizard (secao especifica) |
| `#/review` | Revisao e exportacao |
| `#/guide` | Guia LinkedIn |

## Estrutura do projeto

```
index.html
css/style.css
js/
  config.js         Secoes, campos, 20 templates, flags ATS
  dates.js          Mes/ano e formatacao de periodos
  scoring.js        Pontuacao por qualidade + fit de 1 pagina
  validation.js     E-mail, URL, campos obrigatorios
  storage.js        localStorage + JSON
  prompts.js        Prompts IA externos
  preview.js        Preview ao vivo (fonte unica do PDF via impressao)
  characters.js     Personagens de exemplo (estados completos)
  linkedin-guide.js Guia LinkedIn
  router.js         Hash routing
  a11y.js           Modais acessiveis (Esc, focus trap)
  sample-data.js    Dados de exemplo
  app.js            Orquestracao
tests/smoke-test.js
```

## O que exige internet

| Recurso | Offline apos 1a carga? | Notas |
|---------|------------------------|-------|
| App (HTML/CSS/JS) | Sim | Funciona abrindo `index.html` |
| Google Fonts | Parcial | Fallback system-ui se CDN falhar |
| **PDF** (impressao do navegador) | Sim | Usa `window.print()` sobre o HTML da previa; nenhuma biblioteca |
| Prompts IA | N/A | Copia manual - nenhuma API e chamada |

A exportacao e apenas PDF (impressao do navegador) e funciona 100% offline.

## Testes

```bash
node tests/smoke-test.js
```

Cobre: scoring, validacao, datas, router, page fit, JSON, prompts, catalogo de 20 templates, flags ATS e dados de exemplo.

## Deploy (GitHub Pages)

1. Push para o GitHub
2. Settings → Pages → branch `main`, pasta `/ (root)`
3. URL: `https://<usuario>.github.io/<repo>/`

## Privacidade

- Sem cadastro, sem envio automatico de dados
- Prompts de IA sao copiados manualmente
- Aviso visivel ao incluir dados pessoais no prompt
- Checkbox "Incluir meus dados no prompt" controla o conteudo

## Stack

HTML, CSS e JavaScript puro - sem framework, sem bundler.

## Licenca

Open source - use livremente.
