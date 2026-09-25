const path = require('path');
const sharp = require('sharp');
const OpenAI = require('openai');

const MAX_IMAGES = 5;

const systemPrompt = `You are the private visual content analyst for Seacoast DJ, a mobile DJ business based in Hampton, NH serving the NH Seacoast and New England within roughly a 75-mile radius. Analyze only what is visibly supported by the supplied event photographs. Do not identify people by name, infer sensitive traits, guess an exact venue address, or claim anything not visible in the images. Distinguish visible evidence from uncertainty. Return valid JSON only, with no markdown fences.`;

function promptFor(project, filenames) {
  return `Analyze these ${filenames.length} event images together for a human-reviewed social media workflow.

Event information supplied by the DJ:
- Project title: ${project.title}
- General town/service area: ${project.town || 'not supplied'}
- Event vertical: ${project.vertical || 'not supplied'}
- Equipment or setup notes: ${project.materials || 'not supplied'}
- Features: ${project.features || 'not supplied'}
- Declared stage: ${project.stage || 'not supplied'}
- Image order: ${filenames.join(', ')}

Return exactly this JSON shape:
{
  "summary": "2-3 factual sentences",
  "observed_stage": "before | setup | in progress | peak / dance floor | wind-down | finished | mixed | uncertain",
  "room_or_surface": "short description of the venue space or setup shown",
  "visible_materials": ["factual visible item, e.g. equipment, lighting, decor"],
  "craftsmanship_details": ["specific visible detail, e.g. crowd energy, lighting design, setup quality"],
  "privacy_flags": ["possible identifiable face, name signage, address, license plate, paperwork, reflection, or none"],
  "quality_notes": ["lighting, focus, framing, cleanup, or orientation note"],
  "best_image": "one filename from the supplied list",
  "best_image_reason": "short reason",
  "caption_angles": ["three grounded marketing angles"],
  "uncertainties": ["anything that must be confirmed by Billy before publishing"]
}`;
}

function extractJson(text) {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('The AI response did not contain a JSON object.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalize(value, fallback) { return typeof value === 'string' && value.trim() ? value.trim() : fallback; }
function list(value) { return Array.isArray(value) ? value.filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean).slice(0, 12) : []; }

function validateAnalysis(raw, allowedFilenames) {
  const best = allowedFilenames.includes(raw.best_image) ? raw.best_image : allowedFilenames[0];
  return {
    summary: normalize(raw.summary, 'Review the supplied event images.'),
    observedStage: normalize(raw.observed_stage, 'uncertain'),
    roomOrSurface: normalize(raw.room_or_surface, 'Event setup'),
    visibleMaterials: list(raw.visible_materials),
    craftsmanshipDetails: list(raw.craftsmanship_details),
    privacyFlags: list(raw.privacy_flags),
    qualityNotes: list(raw.quality_notes),
    bestImage: best,
    bestImageReason: normalize(raw.best_image_reason, 'Selected from the analyzed images.'),
    captionAngles: list(raw.caption_angles),
    uncertainties: list(raw.uncertainties),
    model: process.env.OPENAI_VISION_MODEL || 'gpt-5.4-mini',
    analyzedAt: new Date().toISOString(),
    imageCount: allowedFilenames.length,
    reviewStatus: 'needs-review'
  };
}

async function imageDataUrl(filePath) {
  // rotate() honors orientation; re-encoding strips EXIF/GPS metadata.
  const buffer = await sharp(filePath).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

exports.analyzeProject = async (project, uploadRoot, requestedIds = []) => {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing from .env.');
  const available = project.files.filter(file => file.mimeType.startsWith('image/'));
  const selected = (requestedIds.length ? available.filter(file => requestedIds.includes(file.id)) : available).slice(0, MAX_IMAGES);
  if (!selected.length) throw new Error('Select at least one JPG, PNG, or WebP image. Video analysis is not included yet.');

  const content = [{ type: 'input_text', text: promptFor(project, selected.map(file => file.originalName)) }];
  for (const file of selected) {
    const dataUrl = await imageDataUrl(path.join(uploadRoot, file.storedName));
    content.push({ type: 'input_image', image_url: dataUrl, detail: process.env.OPENAI_IMAGE_DETAIL || 'high' });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, ...(process.env.OPENAI_BASE_URL ? { baseURL: process.env.OPENAI_BASE_URL } : {}) });
  const response = await client.responses.create({
    model: process.env.OPENAI_VISION_MODEL || 'gpt-5.4-mini',
    instructions: systemPrompt,
    input: [{ role: 'user', content }],
    max_output_tokens: 1400
  });
  return validateAnalysis(extractJson(response.output_text), selected.map(file => file.originalName));
};

exports._test = { extractJson, validateAnalysis };
