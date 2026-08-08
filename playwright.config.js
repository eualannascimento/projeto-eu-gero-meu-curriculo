const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:4173',
    browserName: 'chromium',
    headless: true
  },
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'node scripts/serve-static.js',
    port: 4173,
    reuseExistingServer: !process.env.CI
  }
});
