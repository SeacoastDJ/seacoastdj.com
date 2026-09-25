const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'storage', 'data');
const dataFile = path.join(dataDir, 'projects.json');

async function read() {
  await fs.mkdir(dataDir, { recursive: true });
  try { return JSON.parse(await fs.readFile(dataFile, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const seed = { projects: [] };
    await write(seed);
    return seed;
  }
}
async function write(data) { await fs.mkdir(dataDir, { recursive: true }); await fs.writeFile(dataFile, JSON.stringify(data, null, 2)); }

exports.listProjects = async () => (await read()).projects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
exports.getProject = async id => (await read()).projects.find(p => p.id === id);
exports.createProject = async input => {
  const db = await read();
  const project = {
    id: crypto.randomUUID(), title: input.title?.trim() || 'Untitled project', town: input.town?.trim() || '',
    vertical: input.vertical?.trim() || '', materials: input.materials?.trim() || '', features: input.features?.trim() || '',
    stage: input.stage || 'finished', privacyApproved: input.privacyApproved, hideIdentity: input.hideIdentity,
    exactLocationAllowed: input.exactLocationAllowed, status: 'new', createdAt: new Date().toISOString(),
    files: input.files.map(file => ({ id: crypto.randomUUID(), ...file })), drafts: [], analysis: null
  };
  db.projects.push(project); await write(db); return project;
};
exports.setAnalysis = async (id, analysis) => {
  const db = await read(); const project = db.projects.find(p => p.id === id);
  if (!project) return;
  project.analysis = analysis; project.status = 'analyzed'; await write(db);
};
exports.updateAnalysis = async (id, changes) => {
  const db = await read(); const project = db.projects.find(p => p.id === id);
  if (!project?.analysis) return;
  project.analysis.summary = changes.summary;
  project.analysis.observedStage = changes.observedStage;
  project.analysis.roomOrSurface = changes.roomOrSurface;
  project.analysis.reviewStatus = 'reviewed';
  project.status = 'analyzed'; await write(db);
};
exports.setDrafts = async (id, drafts) => {
  const db = await read(); const project = db.projects.find(p => p.id === id);
  project.drafts = drafts; project.status = 'draft'; await write(db);
};
exports.updateDraft = async (projectId, draftId, changes) => {
  const db = await read(); const project = db.projects.find(p => p.id === projectId); const draft = project?.drafts.find(d => d.id === draftId);
  if (!draft) return;
  draft.body = changes.body; draft.status = changes.status;
  project.status = changes.status === 'approved' ? 'approved' : 'draft'; await write(db);
};
exports.recordPublication = async (projectId, draftId, publication) => {
  const db = await read(); const project = db.projects.find(p => p.id === projectId); const draft = project?.drafts.find(d => d.id === draftId);
  if (!draft) return;
  draft.publications = draft.publications || [];
  draft.publications.push({ ...publication, publishedAt: new Date().toISOString() });
  project.status = 'published'; await write(db);
};
