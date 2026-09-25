const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const sharp = require('sharp');
const { analyzeProject } = require('../src/vision-service');

test('re-encodes an image and validates a mocked Responses API result', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'tsss-vision-'));
  await sharp({ create: { width: 40, height: 30, channels: 3, background: '#ddd8cd' } }).jpeg().toFile(path.join(temp, 'photo.jpg'));
  let requestBody = '';
  const server = http.createServer((req, res) => {
    req.on('data', chunk => { requestBody += chunk; });
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({
        id: 'resp_test', object: 'response', status: 'completed',
        output: [{ id: 'msg_test', type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: JSON.stringify({ summary: 'Visible tile project.', observed_stage: 'in progress', room_or_surface: 'shower', visible_materials: ['tile'], craftsmanship_details: ['consistent joints'], privacy_flags: ['none'], quality_notes: ['clear'], best_image: 'photo.jpg', best_image_reason: 'wide view', caption_angles: ['progress'], uncertainties: [] }), annotations: [] }] }]
      }));
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  process.env.OPENAI_API_KEY = 'test-key';
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${address.port}/v1`;
  try {
    const result = await analyzeProject({ title: 'Test', town: '', projectType: '', materials: '', features: '', stage: 'progress', files: [{ id: 'one', storedName: 'photo.jpg', originalName: 'photo.jpg', mimeType: 'image/jpeg' }] }, temp, ['one']);
    assert.equal(result.bestImage, 'photo.jpg');
    assert.equal(result.summary, 'Visible tile project.');
    const sent = JSON.parse(requestBody);
    const image = sent.input[0].content.find(item => item.type === 'input_image');
    assert.match(image.image_url, /^data:image\/jpeg;base64,/);
  } finally {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_BASE_URL;
    await new Promise(resolve => server.close(resolve));
    await fs.rm(temp, { recursive: true, force: true });
  }
});
