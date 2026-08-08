const fs = require('fs');
const childProcess = require('child_process');

let playwright;
let cliPath;

try {
  playwright = require('@playwright/test');
  cliPath = require.resolve('@playwright/test/cli');
} catch {
  console.error('E2E indisponível: @playwright/test não está instalado. Execute npm install antes de npm run e2e.');
  process.exit(1);
}

const executablePath = playwright.chromium.executablePath();
if (!fs.existsSync(executablePath)) {
  console.error('E2E indisponível: o Chromium do Playwright não está instalado. Execute npx playwright install chromium.');
  process.exit(1);
}

const result = childProcess.spawnSync(process.execPath, [cliPath, 'test', ...process.argv.slice(2)], {
  stdio: 'inherit'
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
