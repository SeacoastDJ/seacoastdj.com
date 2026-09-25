const test = require('node:test');
const assert = require('node:assert/strict');
const { _test } = require('../src/claude-vision-service');

test('extracts JSON even when a model adds a markdown fence', () => {
  assert.deepEqual(_test.extractJson('```json\n{"summary":"Dance floor lit up"}\n```'), { summary: 'Dance floor lit up' });
});

test('normalizes and constrains the analysis response', () => {
  const result = _test.validateAnalysis({
    summary: 'Visible dance floor with uplighting.', observed_stage: 'peak / dance floor', room_or_surface: 'reception hall',
    visible_materials: ['uplighting'], craftsmanship_details: ['crowded dance floor'], privacy_flags: ['none'],
    quality_notes: ['good focus'], best_image: 'not-allowed.jpg', best_image_reason: 'clear view',
    caption_angles: ['energy'], uncertainties: ['venue name not confirmed']
  }, ['allowed.jpg']);
  assert.equal(result.bestImage, 'allowed.jpg');
  assert.equal(result.reviewStatus, 'needs-review');
  assert.deepEqual(result.visibleMaterials, ['uplighting']);
});
