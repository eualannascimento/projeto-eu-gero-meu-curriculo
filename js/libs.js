/**
 * Deteccao de bibliotecas externas (CDN ou vendor local).
 */
const EuGeroLibs = (function () {
  'use strict';

  const DOCX_VERSION = '8.5.0';
  const DOCX_CDN_URL = `https://cdn.jsdelivr.net/npm/docx@${DOCX_VERSION}/+esm`;
  const DOCX_VENDOR_URL = '../vendor/docx.esm.js';

  let docxChecked = false;
  let docxAvailable = false;
  let docxModule = null;

  function hasJsPdf() {
    return typeof window.jspdf !== 'undefined' || typeof jspdf !== 'undefined';
  }

  function hasQrCode() {
    return typeof QRCode !== 'undefined';
  }

  async function loadDocx() {
    if (docxModule) return docxModule;
    const urls = [DOCX_VENDOR_URL, DOCX_CDN_URL];
    let lastError;
    for (const url of urls) {
      try {
        docxModule = await import(url);
        docxAvailable = true;
        docxChecked = true;
        return docxModule;
      } catch (e) {
        lastError = e;
      }
    }
    docxChecked = true;
    docxAvailable = false;
    throw lastError || new Error('docx indisponivel');
  }

  async function checkDocx() {
    if (docxChecked) return docxAvailable;
    try {
      await loadDocx();
      return true;
    } catch (e) {
      return false;
    }
  }

  function markDocxAvailable() {
    docxChecked = true;
    docxAvailable = true;
  }

  function hasDocxSync() {
    return docxAvailable;
  }

  async function probeAll() {
    const pdf = hasJsPdf();
    const qr = hasQrCode();
    const docx = await checkDocx();
    return { pdf, qr, docx, txt: true };
  }

  function missingMessages(capabilities, exportType) {
    const msgs = [];
    const caps = capabilities || { pdf: hasJsPdf(), qr: hasQrCode(), docx: hasDocxSync(), txt: true };

    if ((!exportType || exportType === 'pdf') && !caps.pdf) {
      msgs.push('PDF: biblioteca jsPDF nao carregada. Use conexao na primeira visita ou arquivo em vendor/.');
    }
    if ((!exportType || exportType === 'pdf') && !caps.qr) {
      msgs.push('QR Code no PDF: biblioteca qrcode nao carregada.');
    }
    if ((!exportType || exportType === 'docx') && !caps.docx) {
      msgs.push('Word: exportacao DOCX indisponivel. Verifique vendor/docx.esm.js ou conexao com CDN.');
    }
    return msgs;
  }

  return {
    DOCX_VERSION,
    DOCX_CDN_URL,
    DOCX_VENDOR_URL,
    hasJsPdf,
    hasQrCode,
    loadDocx,
    checkDocx,
    markDocxAvailable,
    hasDocxSync,
    probeAll,
    missingMessages
  };
})();
