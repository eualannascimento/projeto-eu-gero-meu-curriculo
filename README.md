# Eu Gero Meu Curriculo

Plataforma web estatica, 100% gratuita e sem servidor, para criar curriculos de **uma pagina** e guias LinkedIn. Todos os dados ficam no seu navegador - nada e enviado automaticamente para servidores externos.

## Funcionalidades

- **Homepage** com explicacao do objetivo e acesso central
- **Wizard passo a passo** com 13 secoes alinhadas ao LinkedIn
- **6 templates**: Classico, Moderno, Elegante, Executivo, Minimalista, Criativo
- **Preview ao vivo** com linha de corte de 1 pagina A4 e alerta de overflow
- **Pontuacao por qualidade** (Fraco / Bom / Otimo) - textos curtos e bons nao sao punidos
- **Revisao** com galeria comparativa de todos os templates
- **Exportacao** PDF (QR Code do LinkedIn), Word (.docx) e TXT - validacao obrigatoria antes de exportar
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
  config.js         Secoes, campos, 6 templates, flags ATS
  dates.js          Mes/ano e formatacao de periodos
  scoring.js        Pontuacao por qualidade + fit de 1 pagina
  validation.js     E-mail, URL, campos obrigatorios
  storage.js        localStorage + JSON
  prompts.js        Prompts IA externos
  preview.js        Preview ao vivo
  cv-data.js        Modelo unico para preview/export
  export.js         PDF, Word, TXT
  linkedin-guide.js Guia LinkedIn
  router.js         Hash routing
  a11y.js           Modais acessiveis (Esc, focus trap)
  libs.js           Deteccao de bibliotecas (vendor/CDN)
  sample-data.js    Dados de exemplo
  app.js            Orquestracao
vendor/             jsPDF, docx.esm.js (Word offline) e qrcode opcional
tests/smoke-test.js
```

## O que exige internet

| Recurso | Offline apos 1a carga? | Notas |
|---------|------------------------|-------|
| App (HTML/CSS/JS) | Sim | Funciona abrindo `index.html` |
| Google Fonts | Parcial | Fallback system-ui se CDN falhar |
| **jsPDF** (PDF) | Sim, se cache/CDN ok | Copie para `vendor/jspdf.umd.min.js` para offline total |
| **qrcode** (QR no PDF) | Sim, se cache/CDN ok | Copie para `vendor/qrcode.min.js` |
| **docx.js** (Word) | Sim com `vendor/docx.esm.js` | Fallback para CDN se o arquivo local falhar |
| Prompts IA | N/A | Copia manual - nenhuma API e chamada |

Avisos de biblioteca ausente aparecem **somente ao exportar**, nao no carregamento. TXT exporta sem dependencias externas.

### Datas (mes/ano)

Campos de data aceitam mes e ano ou **somente ano** (ex.: `2020`). Ano sem mes e exibido como `2020`, sem forcar janeiro.

### Validacao antes de exportar

Na revisao, PDF/Word/TXT exigem que todos os campos obrigatorios das secoes ativas estejam validos. Pendencias bloqueiam o export, exibem toast e levam ao wizard com foco no primeiro campo invalido.

## Testes

```bash
node tests/smoke-test.js
```

Cobre: scoring, validacao (incl. export), datas ano-only, router, page fit, JSON, prompts, CvData, separadores, templates ATS e dados de exemplo.

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
