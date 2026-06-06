# Bibliotecas opcionais (offline)

Para exportacao **sem depender de CDN**, copie ou mantenha nesta pasta:

| Arquivo | Uso | Origem |
|---------|-----|--------|
| `jspdf.umd.min.js` | PDF | https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js |
| `qrcode.min.js` | QR Code no PDF | https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js |
| `docx.esm.js` | Word (.docx) | https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm |

O repositorio ja inclui `jspdf.umd.min.js` e `docx.esm.js` (docx 8.5.0). O app tenta carregar docx primeiro de `vendor/docx.esm.js` e, se falhar, usa o CDN.

Para jsPDF e qrcode, adicione em `index.html` **antes** dos scripts CDN:

```html
<script src="vendor/jspdf.umd.min.js"></script>
<script src="vendor/qrcode.min.js"></script>
```

Avisos de biblioteca ausente aparecem apenas ao tentar exportar, nao no carregamento da pagina.
