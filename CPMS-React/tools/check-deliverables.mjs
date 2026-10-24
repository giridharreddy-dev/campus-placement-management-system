import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const delivery = path.join(root, 'submission/deliverables');
const originals = JSON.parse(
  fs.readFileSync(path.join(root, 'learning/original/manifest.json'), 'utf8'),
);
let basicCount = 0;
for (const [id, program] of Object.entries(originals.programs)) {
  const folder = path.join(
    delivery,
    `01-basic-programs/Experiment-${id[0]}/${id[1]}`,
  );
  assert.ok(fs.existsSync(path.join(folder, 'README.md')));
  for (const file of program.files)
    assert.equal(
      fs.readFileSync(path.join(folder, file.name), 'utf8'),
      file.code,
      id + '/' + file.name,
    );
  basicCount++;
}
assert.equal(basicCount, 25);
for (let id = 1; id <= 5; id++) {
  const guide = fs.readFileSync(
    path.join(delivery, `02-combined-case-studies/Experiment-${id}/README.md`),
    'utf8',
  );
  for (const part of 'abcde')
    assert.ok(guide.includes(id + part + ':'), `Combined ${id} covers ${part}`);
}

const excluded = new Set([
  'node_modules',
  'dist',
  '.verification',
  'submission',
  '.git',
  '.private',
  '__pycache__',
  'original-programs',
]);
function verifyProject(dir, relative = '') {
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      excluded.has(entry.name) ||
      (entry.name.startsWith('.env') && entry.name !== '.env.example') ||
      /\.(log|zip|pyc|pem|key|dump|bak)$/i.test(entry.name) ||
      entry.name === 'cpms_source_code.md'
    )
      continue;
    const source = path.join(dir, entry.name);
    const target = path.join(
      delivery,
      '03-complete-project/CPMS',
      relative,
      entry.name,
    );
    if (entry.isDirectory())
      count += verifyProject(source, path.join(relative, entry.name));
    else if (entry.isFile()) {
      assert.deepEqual(
        fs.readFileSync(target),
        fs.readFileSync(source),
        `Complete project copy: ${relative}/${entry.name}`,
      );
      count++;
    }
  }
  return count;
}
const sources = verifyProject(root);
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const secrets = [];
for (const file of [
  path.join(root, '../../.env'),
  path.join(root, '.env'),
  path.join(root, 'case-study/.env'),
  path.join(root, 'learning/server/.env'),
]) {
  if (!fs.existsSync(file)) continue;
  for (const [name, value] of Object.entries(
    dotenv.parse(fs.readFileSync(file)),
  ))
    if (/PASSWORD|SECRET/.test(name) && value.length >= 8) secrets.push(value);
}
let total = 0;
for (const zipName of ['CPMS_STAGE1.zip', 'CPMS_THREE_SETS.zip']) {
  const zip = fs.readFileSync(path.join(root, 'submission', zipName));
  let offset = 0;
  const names = new Set();
  while (zip.readUInt32LE(offset) === 0x04034b50) {
    assert.equal(zip.readUInt16LE(offset + 8), 0, 'Stored ZIP entries');
    const size = zip.readUInt32LE(offset + 18);
    const nameSize = zip.readUInt16LE(offset + 26);
    const extraSize = zip.readUInt16LE(offset + 28);
    const name = zip
      .subarray(offset + 30, offset + 30 + nameSize)
      .toString('utf8');
    assert.ok(!names.has(name), 'Unique ZIP entry: ' + name);
    names.add(name);
    assert.ok(
      !name
        .split('/')
        .some(
          (part) =>
            part === '..' ||
            part === 'node_modules' ||
            part === '.verification' ||
            (part.startsWith('.env') && part !== '.env.example'),
        ),
      'Safe ZIP entry: ' + name,
    );
    const start = offset + 30 + nameSize + extraSize;
    const content = zip.subarray(start, start + size);
    assert.equal(
      crc32(content),
      zip.readUInt32LE(offset + 14),
      'ZIP CRC: ' + name,
    );
    for (const secret of secrets)
      assert.ok(
        !content.includes(Buffer.from(secret)),
        'No configured credentials in ' + name,
      );
    if (zipName === 'CPMS_THREE_SETS.zip')
      assert.deepEqual(
        content,
        fs.readFileSync(
          path.join(delivery, name.replace(/^CPMS_DELIVERABLES\//, '')),
        ),
        'ZIP matches delivery folder: ' + name,
      );
    offset = start + size;
  }
  assert.equal(zip.readUInt32LE(offset), 0x02014b50, 'ZIP central directory');
  const end = zip.length - 22;
  assert.equal(zip.readUInt32LE(end), 0x06054b50, 'ZIP end record');
  assert.equal(zip.readUInt16LE(end + 10), names.size, 'ZIP entry count');
  total += names.size;
}
console.log(
  `Delivery verified: ${basicCount} original basic programs, 5 combined programs covering a–e, ${sources} matching full-project files, ${total} ZIP entries with valid CRCs and no configured secrets.`,
);
