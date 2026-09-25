const path = require('path');
const sharp = require('sharp');

const MAX_IMAGES = 5;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

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
    model: process.env.ANTHROPIC_VISION_MODEL || 'claude-sonnet-5',
    analyzedAt: new Date().toISOString(),
    imageCount: allowedFilenames.length,
    reviewStatus: 'needs-review'
  };
}

async function imageBase64(filePath) {
  // rotate() honors orientation; re-encoding strips EXIF/GPS metadata.
  // 1568px matches Anthropic's documented long-edge sweet spot for image tokens.
  const buffer = await sharp(filePath).rotate().resize({ width: 1568, height: 1568, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
  return buffer.toString('base64');
}

exports.analyzeProject = async (project, uploadRoot, requestedIds = []) => {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is missing from .env.');
  const available = project.files.filter(file => file.mimeType.startsWith('image/'));
  const selected = (requestedIds.length ? available.filter(file => requestedIds.includes(file.id)) : available).slice(0, MAX_IMAGES);
  if (!selected.length) throw new Error('Select at least one JPG, PNG, or WebP image. Video analysis is not included yet.');

  const content = [{ type: 'text', text: promptFor(project, selected.map(file => file.originalName)) }];
  for (const file of selected) {
    const data = await imageBase64(path.join(uploadRoot, file.storedName));
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } });
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_VISION_MODEL || 'claude-sonnet-5',
      max_tokens: 1400,
      system: systemPrompt,
      messages: [{ role: 'user', content }]
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) throw new Error(body.error?.message || `Claude API request failed (${response.status}).`);
  const textBlock = (body.content || []).find(block => block.type === 'text');
  if (!textBlock) throw new Error('The AI response did not contain a text block.');
  return validateAnalysis(extractJson(textBlock.text), selected.map(file => file.originalName));
};

exports._test = { extractJson, validateAnalysis };
