const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('release contains required operator documentation', () => {
  for (const file of ['README.md', 'INSTALL-MAC.md', 'INSTALL-HOSTINGER.md', 'INSTALL-META.md', 'CONTENT-PLAYBOOK.md', 'CHANGELOG.md', '.env.example']) {
    assert.equal(fs.existsSync(path.join(__dirname, '..', file)), true, `${file} is missing`);
  }
});
