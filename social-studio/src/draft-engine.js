const crypto = require('crypto');

// Locked GA4 taxonomy (see CLAUDE.md: "event_category values are locked:
// Wedding, Corporate, Private, Rental... Do not rename them"). Kept as the
// same four values here so the whole business shares one vocabulary.
const VERTICALS = {
  wedding: {
    hashtags: '#SeacoastDJ #NHWeddingDJ #SeacoastNHWeddings #NewEnglandWeddingDJ #HamptonNH #FirstDance',
    cta: 'Ready to lock in your date? Check availability at SeacoastDJ.com.'
  },
  corporate: {
    hashtags: '#SeacoastDJ #CorporateEventDJ #NHCorporateEvents #NewEnglandEvents #CompanyParty #HamptonNH',
    cta: 'Planning a company party or corporate event? Check availability at SeacoastDJ.com.'
  },
  private: {
    hashtags: '#SeacoastDJ #PrivatePartyDJ #NHPartyDJ #NewEnglandDJ #BirthdayParty #HamptonNH',
    cta: 'Celebrating something? Check availability at SeacoastDJ.com.'
  },
  rental: {
    hashtags: '#SeacoastDJ #DJGearRental #ProAudioNH #NewEnglandDJGear #SeacoastNH #EventProduction',
    cta: 'Need pro sound or lighting for your own event? See gear at SeacoastDJ.com/gear.html.'
  }
};

function location(project) { return project.town ? ` in ${project.town}` : ''; }
function detail(project) {
  const parts = [project.materials, project.features].filter(Boolean);
  return parts.length ? ` This one featured ${parts.join(' and ')}.` : '';
}
function analyzedDetail(project) {
  const analysis = project.analysis;
  if (!analysis) return detail(project);
  const visible = (analysis.craftsmanshipDetails || []).slice(0, 2).join(' and ');
  return `${analysis.summary ? ` ${analysis.summary}` : ''}${visible ? ` Visible details include ${visible}.` : ''}`;
}
function hashtags(project, config) {
  const town = (project.town || 'NHSeacoast').replace(/[^a-z0-9]/gi, '');
  const tags = `${config.hashtags} #${town}`.split(' ');
  // De-dupe (a vertical's static tag set can overlap with the town-derived
  // tag, e.g. a Hampton, NH event already carries #HamptonNH).
  const seen = new Set();
  return tags.filter(tag => { const key = tag.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).join(' ');
}
function draft(format, body) { return { id: crypto.randomUUID(), format, body, status: 'draft' }; }

// 16 real caption bodies (4 formats x 4 verticals), grounded in CLAUDE.md's
// brand facts: "turntables since 1999, professional since 2004 (20+ years),
// LLC established 2016... 500+ events, 200+ weddings, licensed and insured,
// live mixing... 75 miles from Hampton, NH." Voice: "short, benefit-forward,
// second person," "&" not "and," one primary CTA (Check Availability).
const BODIES = {
  wedding: {
    Instagram: project => `Ceremony to last call${location(project)} — this is what a Seacoast DJ wedding sounds like.${analyzedDetail(project)} 20+ years behind the booth & 200+ weddings in, we build your night around your crowd, not a preset playlist.\n\n${VERTICALS.wedding.cta}\n\n${hashtags(project, VERTICALS.wedding)}`,
    Facebook: project => `Another Seacoast DJ wedding in the books${location(project)}. From the first dance to the last song, we kept the floor moving with live mixing, not a laptop on shuffle.${analyzedDetail(project)}\n\n${VERTICALS.wedding.cta}`,
    Reel: project => `First dance to last call${location(project)} — a quick look at the night. 20+ years of live mixing, built around your music & your crowd.\n\n${hashtags(project, VERTICALS.wedding)}`,
    Educational: project => `A wedding reception that actually fills the floor starts long before the first song plays. Real conversations about your must-plays, your do-not-plays & your crowd shape the whole set. This wedding${location(project)} is a good example of why the planning underneath matters just as much as the mix.${analyzedDetail(project)}`
  },
  corporate: {
    Instagram: project => `Company party done right${location(project)}.${analyzedDetail(project)} 500+ events booked & we're strongest with a mixed-age crowd that actually wants to dance.\n\n${VERTICALS.corporate.cta}\n\n${hashtags(project, VERTICALS.corporate)}`,
    Facebook: project => `Another corporate event, another packed floor${location(project)}. We read the room & keep it professional up front, high-energy once the work talk winds down.${analyzedDetail(project)}\n\n${VERTICALS.corporate.cta}`,
    Reel: project => `Behind the booth at a corporate event${location(project)} — sound, lighting & a set built for a crowd that spans a few generations.\n\n${hashtags(project, VERTICALS.corporate)}`,
    Educational: project => `A corporate party that lands takes more than a speaker & a playlist. Reading a mixed-age room, timing the announcements & keeping the energy professional-to-party takes real experience. This event${location(project)} is a good example of that balance.${analyzedDetail(project)}`
  },
  private: {
    Instagram: project => `Every celebration deserves a real DJ, not a phone on shuffle${location(project)}.${analyzedDetail(project)} Licensed & insured, with live mixing all night.\n\n${VERTICALS.private.cta}\n\n${hashtags(project, VERTICALS.private)}`,
    Facebook: project => `Another private celebration in the books${location(project)}. Whatever the occasion, we build the night around your crowd & keep the floor moving.${analyzedDetail(project)}\n\n${VERTICALS.private.cta}`,
    Reel: project => `A quick look at a private party${location(project)} — real mixing, real energy, no shuffle mode.\n\n${hashtags(project, VERTICALS.private)}`,
    Educational: project => `A private party that keeps people on the floor starts with a real conversation about your crowd & your must-plays, not a generic playlist. This celebration${location(project)} is a good example of what that planning looks like in practice.${analyzedDetail(project)}`
  },
  rental: {
    Instagram: project => `Club-grade sound & lighting, ready for your own event${location(project)}.${analyzedDetail(project)} Rane gear, real speakers, real lighting.\n\n${VERTICALS.rental.cta}\n\n${hashtags(project, VERTICALS.rental)}`,
    Facebook: project => `A look at the gear behind Seacoast DJ${location(project)}. If you're planning to run your own sound & lighting, this is the setup we rent out.${analyzedDetail(project)}\n\n${VERTICALS.rental.cta}`,
    Reel: project => `Setup walkthrough${location(project)} — the same pro gear we bring to every event, available to rent for yours.\n\n${hashtags(project, VERTICALS.rental)}`,
    Educational: project => `Renting pro DJ gear means more than picking up a speaker. Matching output to room size, setting up lighting that actually reads & getting sound levels right all matter. This setup${location(project)} shows what that looks like done properly.${analyzedDetail(project)}`
  }
};

exports.buildDrafts = project => {
  const vertical = VERTICALS[project.vertical] ? project.vertical : 'wedding';
  const bodies = BODIES[vertical];
  return [
    draft('Instagram', bodies.Instagram(project)),
    draft('Facebook', bodies.Facebook(project)),
    draft('Reel', bodies.Reel(project)),
    draft('Educational', bodies.Educational(project))
  ];
};
