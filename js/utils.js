/**
 * Utilitarios compartilhados entre modulos (escape de HTML/atributo e debounce).
 */
const EuGeroUtils = (function () {
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Devolve a URL apenas quando o esquema e http(s); caso contrario, string
   * vazia. escapeAttr sozinho nao protege aqui: ele escapa aspas, mas deixa
   * passar "javascript:...", que continua clicavel. O rascunho .json e
   * importado de arquivo de terceiro, entao o dado nao e confiavel.
   */
  function safeUrl(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    try {
      const url = new URL(withScheme);
      return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function debounce(fn, ms) {
    let timer;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  return { escapeHtml, escapeAttr, safeUrl, debounce };
})();
