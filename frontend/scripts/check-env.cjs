const fs = require('fs');
const path = require('path');

function readEnvFile(fileName) {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return env;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) return env;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      env[key] = value;
      return env;
    }, {});
}

const envFromFile = {
  ...readEnvFile('.env'),
  ...readEnvFile('.env.production')
};

const apiBaseUrl = process.env.VITE_API_BASE_URL || envFromFile.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  console.error('VITE_API_BASE_URL is required to build the frontend.');
  process.exit(1);
}

