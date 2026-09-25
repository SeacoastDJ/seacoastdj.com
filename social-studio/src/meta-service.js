const crypto = require('crypto');

const graphVersion = process.env.META_GRAPH_VERSION || 'v24.0';
const graphBase = `https://graph.facebook.com/${graphVersion}`;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

async function graph(path, options = {}) {
  const response = await fetch(`${graphBase}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(body.error?.message || `Meta API request failed (${response.status}).`);
  return body;
}

exports.isConfigured = () => Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_CONFIG_ID && process.env.META_REDIRECT_URI);

exports.buildAuthorizationUrl = state => {
  const query = new URLSearchParams({
    client_id: required('META_APP_ID'),
    redirect_uri: required('META_REDIRECT_URI'),
    state,
    config_id: required('META_CONFIG_ID'),
    response_type: 'code',
    override_default_response_type: 'true'
  });
  return `https://www.facebook.com/${graphVersion}/dialog/oauth?${query}`;
};

exports.exchangeCode = async code => {
  const query = new URLSearchParams({
    client_id: required('META_APP_ID'),
    client_secret: required('META_APP_SECRET'),
    redirect_uri: required('META_REDIRECT_URI'),
    code
  });
  return graph(`/oauth/access_token?${query}`);
};

exports.discoverAssets = async accessToken => {
  const query = new URLSearchParams({
    fields: 'id,name,access_token,tasks,instagram_business_account{id,username,name}',
    access_token: accessToken
  });
  const result = await graph(`/me/accounts?${query}`);
  const preferredPageId = process.env.META_PAGE_ID;
  const page = result.data?.find(item => item.id === preferredPageId) || result.data?.find(item => item.instagram_business_account) || result.data?.[0];
  if (!page) throw new Error('Meta did not return an authorized Facebook Page. Confirm the Seacoast DJ Page was selected during authorization.');
  const instagram = page.instagram_business_account;
  if (!instagram && !process.env.META_INSTAGRAM_ACCOUNT_ID) throw new Error('Meta did not return the Instagram account connected to the selected Page.');
  return {
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token || accessToken,
    instagramAccountId: instagram?.id || process.env.META_INSTAGRAM_ACCOUNT_ID,
    instagramUsername: instagram?.username || null
  };
};

exports.publishFacebookPhoto = async ({ pageId, accessToken, imageUrl, caption }) => {
  const body = new URLSearchParams({ url: imageUrl, caption, access_token: accessToken });
  return graph(`/${pageId}/photos`, { method: 'POST', body });
};

exports.publishInstagramPhoto = async ({ instagramAccountId, accessToken, imageUrl, caption }) => {
  const createBody = new URLSearchParams({ image_url: imageUrl, caption, access_token: accessToken });
  const container = await graph(`/${instagramAccountId}/media`, { method: 'POST', body: createBody });
  const publishBody = new URLSearchParams({ creation_id: container.id, access_token: accessToken });
  return graph(`/${instagramAccountId}/media_publish`, { method: 'POST', body: publishBody });
};

exports.signMediaUrl = ({ origin, projectId, mediaId, ttlSeconds = 900 }) => {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${projectId}:${mediaId}:${expires}`;
  const signature = crypto.createHmac('sha256', required('META_MEDIA_SIGNING_SECRET')).update(payload).digest('hex');
  return `${origin}/meta-media/${encodeURIComponent(projectId)}/${encodeURIComponent(mediaId)}?expires=${expires}&signature=${signature}`;
};

exports.verifyMediaSignature = ({ projectId, mediaId, expires, signature }) => {
  if (!expires || Number(expires) < Math.floor(Date.now() / 1000) || !signature) return false;
  const payload = `${projectId}:${mediaId}:${expires}`;
  const expected = crypto.createHmac('sha256', required('META_MEDIA_SIGNING_SECRET')).update(payload).digest('hex');
  const left = Buffer.from(signature, 'hex');
  const right = Buffer.from(expected, 'hex');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};
