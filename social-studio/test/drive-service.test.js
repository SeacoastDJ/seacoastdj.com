const test = require('node:test');
const assert = require('node:assert/strict');

test('isConfigured is false when either env var is missing', () => {
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  delete process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  delete require.cache[require.resolve('../src/drive-service')];
  const drive = require('../src/drive-service');
  assert.equal(drive.isConfigured(), false);

  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = '{"type":"service_account"}';
  assert.equal(drive.isConfigured(), false);

  process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID = 'folder123';
  assert.equal(drive.isConfigured(), true);

  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  delete process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
});

test('listEventFolders rejects clearly when the root folder id is missing', async () => {
  delete process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = '{"type":"service_account"}';
  delete require.cache[require.resolve('../src/drive-service')];
  const drive = require('../src/drive-service');
  await assert.rejects(() => drive.listEventFolders(), /GOOGLE_DRIVE_ROOT_FOLDER_ID/);
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
});

test('a malformed service account key fails with a clear error, not a crash', async () => {
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = 'not-json';
  process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID = 'folder123';
  delete require.cache[require.resolve('../src/drive-service')];
  const drive = require('../src/drive-service');
  await assert.rejects(() => drive.listEventFolders(), /GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON/);
  delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  delete process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
});
