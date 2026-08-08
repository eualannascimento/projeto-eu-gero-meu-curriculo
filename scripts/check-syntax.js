const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const directories = ['js', 'scripts', 'tests'];

function listJavaScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listJavaScriptFiles(filePath);
    return entry.isFile() && entry.name.endsWith('.js') ? [filePath] : [];
  });
}

const files = directories.flatMap((directory) => listJavaScriptFiles(path.join(root, directory)))
  .concat(path.join(root, 'playwright.config.js'));

for (const filePath of files) {
  childProcess.execFileSync(process.execPath, ['--check', filePath], { stdio: 'inherit' });
}

console.log(`Sintaxe validada em ${files.length} arquivos JavaScript.`);
