const test = require('node:test');
const assert = require('node:assert/strict');
const { _test } = require('../src/vision-service');

test('extracts JSON even when a model adds a markdown fence', () => {
  assert.deepEqual(_test.extractJson('```json\n{"summary":"Tile work"}\n```'), { summary: 'Tile work' });
});

test('normalizes and constrains the analysis response', () => {
  const result = _test.validateAnalysis({
    summary: 'Visible shower tile installation.', observed_stage: 'in progress', room_or_surface: 'shower',
    visible_materials: ['porcelain tile'], craftsmanship_details: ['aligned joints'], privacy_flags: ['none'],
    quality_notes: ['good focus'], best_image: 'not-allowed.jpg', best_image_reason: 'clear view',
    caption_angles: ['layout'], uncertainties: ['grout not confirmed']
  }, ['allowed.jpg']);
  assert.equal(result.bestImage, 'allowed.jpg');
  assert.equal(result.reviewStatus, 'needs-review');
  assert.deepEqual(result.visibleMaterials, ['porcelain tile']);
});
