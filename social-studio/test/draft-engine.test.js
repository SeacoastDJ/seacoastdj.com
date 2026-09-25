const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDrafts } = require('../src/draft-engine');

test('creates four editable social formats', () => {
  const drafts = buildDrafts({ vertical: 'wedding', town: 'Hampton, NH', materials: 'Rane gear', features: 'uplighting' });
  assert.equal(drafts.length, 4);
  assert.deepEqual(drafts.map(d => d.format), ['Instagram', 'Facebook', 'Reel', 'Educational']);
  assert.ok(drafts.every(d => d.status === 'draft' && d.body.length > 100));
});

test('does not expose an exact street address field', () => {
  const drafts = buildDrafts({ vertical: 'private', town: 'Portsmouth, NH', materials: '', features: '' });
  assert.ok(drafts.every(d => !d.body.includes('Street')));
});

test('produces distinct copy per vertical', () => {
  const wedding = buildDrafts({ vertical: 'wedding' })[0].body;
  const corporate = buildDrafts({ vertical: 'corporate' })[0].body;
  const priv = buildDrafts({ vertical: 'private' })[0].body;
  const rental = buildDrafts({ vertical: 'rental' })[0].body;
  const bodies = [wedding, corporate, priv, rental];
  assert.equal(new Set(bodies).size, 4);
});

test('falls back gracefully for an unrecognized vertical', () => {
  const drafts = buildDrafts({ vertical: 'unknown-thing' });
  assert.equal(drafts.length, 4);
  assert.ok(drafts.every(d => d.body.length > 100));
});

test('Instagram and Facebook drafts carry a SeacoastDJ.com call to action', () => {
  for (const vertical of ['wedding', 'corporate', 'private', 'rental']) {
    const drafts = buildDrafts({ vertical });
    const ctaFormats = drafts.filter(d => d.format === 'Instagram' || d.format === 'Facebook');
    assert.ok(ctaFormats.every(d => d.body.includes('SeacoastDJ.com')));
  }
});
