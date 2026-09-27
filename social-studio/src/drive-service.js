const fs = require('fs');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILES_PER_IMPORT = 12;

function credentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch (error) { throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.'); }
}

exports.isConfigured = () => Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID);

function driveClient() {
  const creds = credentials();
  if (!creds) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing from .env.');
  const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: SCOPES });
  return google.drive({ version: 'v3', auth });
}

// One Drive folder = one project: list the immediate subfolders of the
// shared root folder, each one importable as a project's media source.
exports.listEventFolders = async () => {
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is missing from .env.');
  const drive = driveClient();
  const result = await drive.files.list({
    q: `'${rootId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name',
    pageSize: 100
  });
  return result.data.files || [];
};

exports.listImagesInFolder = async folderId => {
  const drive = driveClient();
  const result = await drive.files.list({
    q: `'${folderId}' in parents and (mimeType = 'image/jpeg' or mimeType = 'image/png' or mimeType = 'image/webp') and trashed = false`,
    fields: 'files(id, name, mimeType, size)',
    pageSize: 50
  });
  return (result.data.files || []).filter(file => allowedMime.has(file.mimeType));
};

// Downloads up to MAX_FILES_PER_IMPORT images from a Drive folder into the
// same storage/uploads location and shape multer produces, so app.js can
// hand the result straight to store.createProject alongside a manual upload.
exports.downloadFolderImages = async (folderId, destDir, storedNamePrefix) => {
  const drive = driveClient();
  const files = (await exports.listImagesInFolder(folderId)).slice(0, MAX_FILES_PER_IMPORT);
  const downloaded = [];
  for (const file of files) {
    const extension = file.mimeType === 'image/png' ? '.png' : file.mimeType === 'image/webp' ? '.webp' : '.jpg';
    const storedName = `${storedNamePrefix}-${file.id}${extension}`;
    const destPath = require('path').join(destDir, storedName);
    const response = await drive.files.get({ fileId: file.id, alt: 'media' }, { responseType: 'stream' });
    await new Promise((resolve, reject) => {
      const dest = fs.createWriteStream(destPath);
      response.data.on('end', resolve).on('error', reject).pipe(dest);
    });
    const { size } = fs.statSync(destPath);
    downloaded.push({ storedName, originalName: file.name, mimeType: file.mimeType, size });
  }
  return downloaded;
};
