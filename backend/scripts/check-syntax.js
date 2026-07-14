const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..', 'src');

function collectFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    return entry.name.endsWith('.js') ? [fullPath] : [];
  });
}

for (const file of collectFiles(root)) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

console.log('Backend syntax check passed.');

