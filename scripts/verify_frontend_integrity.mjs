import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const original = JSON.parse(fs.readFileSync('frontend-integrity.json', 'utf8'));
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const path = dir + '/' + entry.name;
    if (entry.isDirectory()) walk(path); else files.push(path);
  }
}
walk('src');
assert.deepEqual(files.sort(), Object.keys(original).sort(), 'Frontend files were added or removed');
let preserved = 0;
for (const [path, hash] of Object.entries(original)) {
  if (path === 'src/config/deployment.json') continue;
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex');
  assert.equal(actual, hash, `Protected frontend changed: ${path}`);
  preserved++;
}
console.log(`${preserved} protected frontend files match the original ZIP byte-for-byte. Only deployment.json may receive verified on-chain configuration.`);
