const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'storage', 'data');
const dataFile = path.join(dataDir, 'meta-connection.json');

function key() {
  const secret = process.env.META_TOKEN_ENCRYPTION_KEY || process.env.SESSION_SECRET;
  if (!secret) throw new Error('META_TOKEN_ENCRYPTION_KEY is not configured.');
  return crypto.createHash('sha256').update(secret).digest();
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return { iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: encrypted.toString('base64') };
}

function decrypt(value) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(value.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(value.data, 'base64')), decipher.final()]).toString('utf8');
}

exports.getConnection = async () => {
  try {
    const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));
    return { ...data, accessToken: decrypt(data.accessToken) };
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};

exports.getConnectionSummary = async () => {
  const connection = await exports.getConnection();
  if (!connection) return null;
  const { accessToken, ...summary } = connection;
  return summary;
};

exports.saveConnection = async connection => {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify({ ...connection, accessToken: encrypt(connection.accessToken) }, null, 2), { mode: 0o600 });
};

exports.disconnect = async () => {
  try { await fs.unlink(dataFile); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
};
