const test = require('node:test');
const assert = require('node:assert/strict');

process.env.META_APP_ID = 'test-app';
process.env.META_APP_SECRET = 'test-secret';
process.env.META_CONFIG_ID = 'test-config';
process.env.META_REDIRECT_URI = 'https://social.example.com/auth/meta/callback';
process.env.META_MEDIA_SIGNING_SECRET = 'test-media-secret';
const meta = require('../src/meta-service');

test('Meta authorization URL uses configuration and state', () => {
  const url = new URL(meta.buildAuthorizationUrl('safe-state'));
  assert.equal(url.hostname, 'www.facebook.com');
  assert.equal(url.searchParams.get('client_id'), 'test-app');
  assert.equal(url.searchParams.get('config_id'), 'test-config');
  assert.equal(url.searchParams.get('state'), 'safe-state');
});

test('temporary media URL signature validates and rejects tampering', () => {
  const signed = new URL(meta.signMediaUrl({ origin: 'https://social.example.com', projectId: 'project-1', mediaId: 'image-1' }));
  const input = { projectId: 'project-1', mediaId: 'image-1', expires: signed.searchParams.get('expires'), signature: signed.searchParams.get('signature') };
  assert.equal(meta.verifyMediaSignature(input), true);
  assert.equal(meta.verifyMediaSignature({ ...input, mediaId: 'image-2' }), false);
});
