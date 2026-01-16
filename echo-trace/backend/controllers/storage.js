const fs = require('fs');
const path = require('path');

function ensureFile(filePath, defaultJson) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(defaultJson, null, 2), 'utf-8');
  }
}

function readJson(filePath, defaultJson = null) {
  ensureFile(filePath, defaultJson ?? {});
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw || 'null');
  } catch (e) {
    // If corrupted, recover to default.
    fs.writeFileSync(filePath, JSON.stringify(defaultJson ?? {}, null, 2), 'utf-8');
    return defaultJson ?? {};
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readJson, writeJson, ensureFile };
