const { defineConfig } = require('@playwright/test');

// Toda falha vista no CI ate aqui foi um `expect(...).toBeVisible()` batendo
// em exatamente 5000ms, o padrao do Playwright, em pontos diferentes da mesma
// jornada. Nao era um teste ruim: era um limite apertado para uma aplicacao
// que renderiza no cliente, rodando em paralelo total num runner de 2 nucleos
// compartilhado. Local, com CPU sobrando, nunca reproduziu.
//
// As tres linhas abaixo tratam a classe:
//
// * `expect.timeout` maior da tempo de a tela trocar sob contencao. Nao
//   mascara falha real: teste que quebrou de verdade continua quebrando, so
//   demora um pouco mais para reportar.
// * `retries` no CI transforma instabilidade em teste marcado como `flaky`,
//   que aparece no relatorio, em vez de build vermelho que ensina a ignorar
//   build vermelho. Zero localmente, para a instabilidade nao passar
//   despercebida em desenvolvimento.
// * `workers` limitado no CI reduz a contencao que causa o problema. Local
//   segue livre, porque ali sobra CPU.
module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  expect: { timeout: 15000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true,
    // O rastro da primeira repeticao diz por que a falha aconteceu, em vez de
    // so que aconteceu. Sem ele, cada instabilidade recomeca a investigacao
    // do zero, que foi o que aconteceu aqui.
    trace: 'on-first-retry'
  },
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'node scripts/serve-static.js',
    port: 4173,
    reuseExistingServer: !process.env.CI
  }
});
