const timeoutMs = 15000;
const requiredDynamicScripts = [
  'js/vendor/jspdf.umd.min.js',
  'js/vendor/fonts-barlow.js',
  'js/pdf-export.js'
];

function fail(message) {
  console.error(`Verificação pós-deploy falhou: ${message}`);
  process.exitCode = 1;
}

function deploymentBaseUrl() {
  const value = process.env.POST_DEPLOY_URL;
  if (!value) {
    fail('defina POST_DEPLOY_URL com a URL publicada, por exemplo https://classificavagas.com/resume/.');
    return null;
  }
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocolo inválido');
    url.search = '';
    url.hash = '';
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url;
  } catch {
    fail('POST_DEPLOY_URL deve ser uma URL HTTP(S) válida.');
    return null;
  }
}

async function fetchPublishedFile(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const content = await response.text();
    if (!content.trim()) throw new Error('resposta vazia');
    return content;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(`tempo esgotado após ${timeoutMs / 1000} s`, { cause: error });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function assetsFromIndex(indexHtml) {
  const scripts = [...indexHtml.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map((match) => match[1]);
  const styles = [...indexHtml.matchAll(/<link\b(?=[^>]*\brel="stylesheet")[^>]*\bhref="([^"]+)"/g)]
    .map((match) => match[1]);
  return [...new Set([...styles, ...scripts, ...requiredDynamicScripts])];
}

async function main() {
  const baseUrl = deploymentBaseUrl();
  if (!baseUrl) return;

  const indexUrl = new URL('index.html', baseUrl);
  let indexHtml;
  try {
    indexHtml = await fetchPublishedFile(indexUrl);
  } catch (error) {
    fail(`${indexUrl}: ${error.message}`);
    return;
  }

  if (!indexHtml.includes('id="app"')) {
    fail(`${indexUrl}: a página publicada não contém a raiz da aplicação.`);
    return;
  }

  const failures = [];
  for (const asset of assetsFromIndex(indexHtml)) {
    const assetUrl = new URL(asset, baseUrl);
    try {
      await fetchPublishedFile(assetUrl);
      console.log(`  ✓ ${assetUrl.pathname}`);
    } catch (error) {
      failures.push(`${assetUrl}: ${error.message}`);
    }
  }

  if (failures.length) {
    failures.forEach((failure) => console.error(`  ✗ ${failure}`));
    fail(`${failures.length} arquivo(s) publicado(s) não carregaram.`);
    return;
  }

  console.log(`Deploy validado: ${indexUrl} e ${assetsFromIndex(indexHtml).length} arquivo(s) carregaram.`);
}

main().catch((error) => fail(error.message));
