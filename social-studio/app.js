require('dotenv').config();

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const store = require('./src/store');
const { buildDrafts } = require('./src/draft-engine');
const { analyzeProject: analyzeProjectOpenAI } = require('./src/vision-service');
const { analyzeProject: analyzeProjectClaude } = require('./src/claude-vision-service');
const metaStore = require('./src/meta-store');
const meta = require('./src/meta-service');

const app = express();
const port = Number(process.env.PORT || 3000);
const uploadRoot = path.join(__dirname, 'storage', 'uploads');
fs.mkdirSync(uploadRoot, { recursive: true });

if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 }
}));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']);
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadRoot),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 50) * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => cb(null, allowedMime.has(file.mimetype))
});

function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}

function base(req, extra = {}) {
  return { appName: process.env.APP_NAME || 'Seacoast DJ Social Studio', user: req.session.user, ...extra };
}

app.get('/health', (_req, res) => res.json({
  ok: true,
  version: '1.0.0',
  openAIVisionConfigured: Boolean(process.env.OPENAI_API_KEY),
  claudeVisionConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
  metaConfigured: meta.isConfigured()
}));
app.get('/login', (req, res) => res.render('login', base(req, { error: null })));
app.post('/login', loginLimiter, async (req, res) => {
  const email = process.env.ADMIN_EMAIL || 'admin@seacoastdj.com';
  const password = process.env.ADMIN_PASSWORD || 'change-this-before-deployment';
  const passwordHash = await bcrypt.hash(password, 8);
  const valid = req.body.email === email && await bcrypt.compare(req.body.password || '', passwordHash);
  if (!valid) return res.status(401).render('login', base(req, { error: 'That email or password was not recognized.' }));
  req.session.user = { email };
  res.redirect('/');
});
app.post('/logout', requireAuth, (req, res) => req.session.destroy(() => res.redirect('/login')));

app.get('/', requireAuth, async (req, res) => {
  const projects = await store.listProjects();
  const counts = projects.reduce((a, p) => { a[p.status] = (a[p.status] || 0) + 1; return a; }, {});
  const metaConnection = await metaStore.getConnectionSummary();
  res.render('dashboard', base(req, { projects, counts, metaConnection, metaConfigured: meta.isConfigured() }));
});

app.get('/settings/meta', requireAuth, async (req, res) => {
  const connection = await metaStore.getConnectionSummary();
  res.render('meta-settings', base(req, { connection, metaConfigured: meta.isConfigured(), message: req.query.message || null }));
});

app.get('/auth/meta', requireAuth, (req, res) => {
  if (!meta.isConfigured()) return res.redirect('/settings/meta?message=Complete+the+Meta+environment+settings+first.');
  const state = crypto.randomBytes(24).toString('hex');
  req.session.metaOAuthState = state;
  res.redirect(meta.buildAuthorizationUrl(state));
});

app.get('/auth/meta/callback', requireAuth, async (req, res, next) => {
  try {
    if (req.query.error) throw new Error(req.query.error_description || 'Meta authorization was cancelled.');
    if (!req.query.state || req.query.state !== req.session.metaOAuthState) throw new Error('Meta authorization state did not match. Please reconnect.');
    delete req.session.metaOAuthState;
    const token = await meta.exchangeCode(req.query.code);
    const assets = await meta.discoverAssets(token.access_token);
    await metaStore.saveConnection({ ...assets, accessToken: assets.pageAccessToken, connectedAt: new Date().toISOString() });
    res.redirect('/settings/meta?message=Meta+accounts+connected+successfully.');
  } catch (error) { next(error); }
});

app.post('/settings/meta/disconnect', requireAuth, async (_req, res, next) => {
  try { await metaStore.disconnect(); res.redirect('/settings/meta?message=Meta+accounts+disconnected.'); }
  catch (error) { next(error); }
});

app.get('/projects/new', requireAuth, (req, res) => res.render('new-project', base(req)));
app.post('/projects', requireAuth, upload.array('media', 12), async (req, res) => {
  const project = await store.createProject({
    title: req.body.title,
    town: req.body.town,
    vertical: req.body.vertical,
    materials: req.body.materials,
    features: req.body.features,
    stage: req.body.stage,
    privacyApproved: req.body.privacyApproved === 'yes',
    hideIdentity: req.body.hideIdentity === 'yes',
    exactLocationAllowed: req.body.exactLocationAllowed === 'yes',
    files: (req.files || []).map(f => ({ storedName: f.filename, originalName: f.originalname, mimeType: f.mimetype, size: f.size }))
  });
  res.redirect(`/projects/${project.id}`);
});

app.get('/projects/:id', requireAuth, async (req, res) => {
  const project = await store.getProject(req.params.id);
  if (!project) return res.status(404).send('Project not found');
  const metaConnection = await metaStore.getConnectionSummary();
  res.render('project', base(req, {
    project,
    metaConnection,
    published: req.query.published || null,
    openAIVisionConfigured: Boolean(process.env.OPENAI_API_KEY),
    claudeVisionConfigured: Boolean(process.env.ANTHROPIC_API_KEY)
  }));
});

app.get('/media/:projectId/:mediaId', requireAuth, async (req, res) => {
  const project = await store.getProject(req.params.projectId);
  const media = project?.files.find(f => f.id === req.params.mediaId);
  if (!media) return res.sendStatus(404);
  res.type(media.mimeType).sendFile(path.join(uploadRoot, media.storedName));
});

app.get('/meta-media/:projectId/:mediaId', async (req, res, next) => {
  try {
    if (!meta.verifyMediaSignature({ projectId: req.params.projectId, mediaId: req.params.mediaId, expires: req.query.expires, signature: req.query.signature })) return res.sendStatus(403);
    const project = await store.getProject(req.params.projectId);
    const media = project?.files.find(file => file.id === req.params.mediaId);
    if (!media || !media.mimeType.startsWith('image/')) return res.sendStatus(404);
    res.type(media.mimeType).sendFile(path.join(uploadRoot, media.storedName));
  } catch (error) { next(error); }
});

app.post('/projects/:id/generate', requireAuth, async (req, res) => {
  const project = await store.getProject(req.params.id);
  if (!project) return res.sendStatus(404);
  await store.setDrafts(project.id, buildDrafts(project));
  res.redirect(`/projects/${project.id}`);
});

app.post('/projects/:id/analyze', requireAuth, async (req, res, next) => {
  try {
    const project = await store.getProject(req.params.id);
    if (!project) return res.sendStatus(404);
    const requestedIds = Array.isArray(req.body.mediaIds) ? req.body.mediaIds : req.body.mediaIds ? [req.body.mediaIds] : [];
    const provider = req.body.provider === 'claude' ? 'claude' : 'openai';
    if (provider === 'claude' && !process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is missing from .env.');
    if (provider === 'openai' && !process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing from .env.');
    const analyze = provider === 'claude' ? analyzeProjectClaude : analyzeProjectOpenAI;
    const analysis = await analyze(project, uploadRoot, requestedIds);
    await store.setAnalysis(project.id, { ...analysis, provider });
    res.redirect(`/projects/${project.id}#analysis`);
  } catch (error) { next(error); }
});

app.post('/projects/:id/analysis', requireAuth, async (req, res) => {
  await store.updateAnalysis(req.params.id, req.body);
  res.redirect(`/projects/${req.params.id}#analysis`);
});

app.post('/projects/:id/drafts/:draftId', requireAuth, async (req, res) => {
  await store.updateDraft(req.params.id, req.params.draftId, { body: req.body.body, status: req.body.status });
  res.redirect(`/projects/${req.params.id}`);
});

app.post('/projects/:id/drafts/:draftId/publish', requireAuth, async (req, res, next) => {
  try {
    const project = await store.getProject(req.params.id);
    const draft = project?.drafts.find(item => item.id === req.params.draftId);
    const media = project?.files.find(item => item.id === req.body.mediaId);
    if (!draft || draft.status !== 'approved') throw new Error('Only an approved draft can be published.');
    if (!media?.mimeType.startsWith('image/')) throw new Error('Select one photograph to publish.');
    const connection = await metaStore.getConnection();
    if (!connection) throw new Error('Connect the Seacoast DJ Meta accounts before publishing.');
    const origin = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const imageUrl = meta.signMediaUrl({ origin, projectId: project.id, mediaId: media.id });
    const platform = req.body.platform;
    if (!['facebook', 'instagram', 'both'].includes(platform)) throw new Error('Choose Facebook, Instagram, or both.');
    const results = [];
    if (platform === 'facebook' || platform === 'both') {
      const result = await meta.publishFacebookPhoto({ pageId: connection.pageId, accessToken: connection.accessToken, imageUrl, caption: draft.body });
      const publication = { platform: 'facebook', postId: result.post_id || result.id, mediaId: media.id };
      await store.recordPublication(project.id, draft.id, publication); results.push(publication);
    }
    if (platform === 'instagram' || platform === 'both') {
      const result = await meta.publishInstagramPhoto({ instagramAccountId: connection.instagramAccountId, accessToken: connection.accessToken, imageUrl, caption: draft.body });
      const publication = { platform: 'instagram', postId: result.id, mediaId: media.id };
      await store.recordPublication(project.id, draft.id, publication); results.push(publication);
    }
    res.redirect(`/projects/${project.id}?published=${results.map(item => item.platform).join(',')}#drafts`);
  } catch (error) { next(error); }
});

app.use((err, req, res, _next) => {
  console.error(err);
  const safeApiMessage = /OPENAI_API_KEY|ANTHROPIC_API_KEY|META_|Meta|Select at least|approved draft|photograph|Facebook|Instagram|AI response|JSON|API|quota|billing|model/i.test(err.message || '') ? err.message : null;
  const message = err.code === 'LIMIT_FILE_SIZE' ? 'One of the files is larger than the configured upload limit.' : safeApiMessage || 'Something went wrong.';
  res.status(400).render('error', base(req, { message }));
});

if (require.main === module) app.listen(port, () => console.log(`Seacoast DJ Social Studio: http://localhost:${port}`));
module.exports = app;
