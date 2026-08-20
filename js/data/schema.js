/* schema.js — the shape of stored data, its version, and validation.
 *
 * Everything the app persists is described here so that migrations and imports
 * have a single source of truth. Validation exists because importData used to
 * write whatever JSON it was handed straight into storage: a foreign or
 * corrupt file could silently replace a training history.
 */

export const SCHEMA_VERSION = 1;

/** The six domain documents. Keys match the historical localStorage keys. */
export const DOCS = {
  settings:     { key: 'gym.v1.settings',     kind: 'object', label: 'Settings' },
  sessions:     { key: 'gym.v1.sessions',     kind: 'object', label: 'Workout sessions' },
  prs:          { key: 'gym.v1.prs',          kind: 'object', label: 'Personal records' },
  weights:      { key: 'gym.v1.weights',      kind: 'array',  label: 'Weigh-ins' },
  days:         { key: 'gym.v1.days',         kind: 'object', label: 'Meals & habits' },
  measurements: { key: 'gym.v1.measurements', kind: 'array',  label: 'Body measurements' }
};

export const DOC_NAMES = Object.keys(DOCS);
export const emptyFor = name => (DOCS[name].kind === 'array' ? [] : {});

/* ---------- primitives ---------- */

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isDateKey = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isNum = v => typeof v === 'number' && isFinite(v);

/** A plausible human body weight in kg. Rejects 0, negatives and typos like 916. */
export const isPlausibleWeight = kg => isNum(kg) && kg >= 20 && kg <= 400;

/* ---------- per-document validation ---------- */
/* Each validator returns { count, issues[] }. Issues describe what would be
 * dropped or is suspect — they never mutate the caller's data. */

function validateWeights(list) {
  const issues = [];
  if (!Array.isArray(list)) return { count: 0, issues: ['Weigh-ins are not a list'], fatal: true };
  const seen = new Set();
  let ok = 0;
  for (const e of list) {
    if (!isObj(e) || !isDateKey(e.date) || !isPlausibleWeight(Number(e.kg))) { issues.push('Malformed weigh-in entry'); continue; }
    const id = `${e.date}|${e.kind || 'manual'}`;
    if (seen.has(id)) { issues.push(`Duplicate weigh-in ${id}`); continue; }
    seen.add(id);
    ok++;
  }
  return { count: ok, issues };
}

function validateSessions(map) {
  const issues = [];
  if (!isObj(map)) return { count: 0, issues: ['Sessions are not an object'], fatal: true };
  let ok = 0;
  for (const [key, s] of Object.entries(map)) {
    const [date] = String(key).split('|');
    if (!isDateKey(date)) { issues.push(`Session key is not a date: ${key}`); continue; }
    if (!isObj(s) || !isObj(s.ex)) { issues.push(`Session ${key} has no exercise log`); continue; }
    if (s.startedAt && s.endedAt && s.endedAt < s.startedAt) issues.push(`Session ${key} ends before it starts`);
    ok++;
  }
  return { count: ok, issues };
}

function validateDays(map) {
  const issues = [];
  if (!isObj(map)) return { count: 0, issues: ['Day log is not an object'], fatal: true };
  let ok = 0;
  for (const [date, log] of Object.entries(map)) {
    if (!isDateKey(date)) { issues.push(`Day key is not a date: ${date}`); continue; }
    if (!isObj(log)) { issues.push(`Day ${date} is malformed`); continue; }
    ok++;
  }
  return { count: ok, issues };
}

function validateMeasurements(list) {
  const issues = [];
  if (!Array.isArray(list)) return { count: 0, issues: ['Measurements are not a list'], fatal: true };
  let ok = 0;
  for (const m of list) {
    if (!isObj(m) || !isDateKey(m.date)) { issues.push('Malformed measurement entry'); continue; }
    ok++;
  }
  return { count: ok, issues };
}

function validateSettings(obj) {
  const issues = [];
  if (!isObj(obj)) return { count: 0, issues: ['Settings are not an object'], fatal: true };
  if (obj.targetWeight != null && !isPlausibleWeight(Number(obj.targetWeight))) issues.push('Target weight is out of range');
  if (obj.startWeight != null && !isPlausibleWeight(Number(obj.startWeight))) issues.push('Starting weight is out of range');
  return { count: 1, issues };
}

function validatePRs(obj) {
  if (!isObj(obj)) return { count: 0, issues: ['Records are not an object'], fatal: true };
  return { count: Object.keys(obj).length, issues: [] };
}

const VALIDATORS = {
  settings: validateSettings,
  sessions: validateSessions,
  prs: validatePRs,
  weights: validateWeights,
  days: validateDays,
  measurements: validateMeasurements
};

/**
 * Inspect a parsed backup without applying it.
 * Returns { ok, version, records:{name:count}, issues[], fatal[] } so the
 * import preview can show exactly what would land before anything is written.
 */
export function inspectBackup(data) {
  const out = { ok: false, version: null, records: {}, issues: [], fatal: [], photos: 0 };

  if (!isObj(data)) { out.fatal.push('That file is not a valid backup.'); return out; }
  out.version = data.schemaVersion ?? data.version ?? null;

  /* Version 2 was the export format before schemaVersion existed; both are readable. */
  if (out.version != null && Number(out.version) > Math.max(SCHEMA_VERSION, 2)) {
    out.fatal.push(`This backup was made by a newer version (${out.version}) than this app understands.`);
    return out;
  }

  let present = 0;
  for (const name of DOC_NAMES) {
    if (data[name] === undefined) { out.records[name] = 0; continue; }
    const res = VALIDATORS[name](data[name]);
    out.records[name] = res.count;
    if (res.fatal) out.fatal.push(`${DOCS[name].label}: ${res.issues[0]}`);
    for (const i of res.issues.slice(0, 3)) out.issues.push(`${DOCS[name].label}: ${i}`);
    present++;
  }

  if (Array.isArray(data.progressPhotos)) out.photos = data.progressPhotos.length;

  if (!present) out.fatal.push('That file contains no recognisable training data.');
  out.ok = out.fatal.length === 0;
  return out;
}
