/* storage.js — all persistence. Local only, no backend, no accounts.
 *
 * Data lives in IndexedDB (see db.js), hydrated into memory at boot so every
 * view can keep reading synchronously. localStorage is mirrored alongside as a
 * rollback path and used as the fallback when IndexedDB is unavailable.
 *
 * Shape:
 *   gym.v1.settings  { name, goal, experience, units, defaultSets, ... }
 *   gym.v1.sessions  { "2026-08-18|tue": { dayId, startedAt, endedAt, ex: { id: {sets:[…], done} } } }
 *   gym.v1.prs       { exerciseId: { best:{weight,reps,date}, latest:{weight,reps,date} } }
 *
 * A session is keyed by date *and* day id, so browsing Monday's workout on a
 * Tuesday logs against Monday without touching Tuesday's real session.
 */

import { MEAL_PLAN, DEFAULT_HABITS, SCORE_WEIGHTS, TARGET_RANGE } from './data/plan.js';
import { WEEK, dayFor, exercisesOf } from './data/workouts.js';
import { getAllPhotos, importPhotos, clearAllPhotos, readAllDocs, writeDoc, writeDocs, saveBackup } from './db.js';
import { SCHEMA_VERSION, DOCS, DOC_NAMES, inspectBackup } from './data/schema.js';

const K = {
  settings: 'gym.v1.settings',
  sessions: 'gym.v1.sessions',
  prs: 'gym.v1.prs',
  weights: 'gym.v1.weights',   /* [{date, time, kg, kind, dayId}] */
  days: 'gym.v1.days',          /* { "2026-08-19": { meals: {}, habits: {} } } */
  measurements: 'gym.v1.measurements' /* [{date, time, waist, chest, shoulders, neck, biceps, forearms, thighs, calves}] */
};

const DEFAULTS = {
  name: 'Kaarthikeya',
  goal: 'Muscle Gain',
  experience: 'Intermediate',
  units: 'kg',
  defaultSets: 4,
  defaultReps: 8,
  restSeconds: 90,
  autoRest: true,
  showGhost: true,

  /* weight goal — startWeight is captured at the first weigh-in unless set */
  startWeight: null,
  targetWeight: TARGET_RANGE.default,
  targetMin: TARGET_RANGE.min,
  targetMax: TARGET_RANGE.max,

  /* null means "use the shipped default", so an untouched plan tracks updates */
  mealPlan: null,
  dailyCalories: null,
  dailyProtein: null,
  habits: null,
  scoreWeights: null,

  hidePrivate: true,
  reduceMotion: false
};

/* ---------- low level: write-through cache over IndexedDB ----------
 *
 * Every view reads synchronously (store.getSettings(), store.dailyBreakdown()).
 * Rather than turn ~15 views async, the whole dataset is hydrated into memory
 * once at boot: reads stay synchronous and instant, writes update memory and
 * are flushed to IndexedDB asynchronously.
 *
 * Reads hand back the live cached object rather than a copy. Every mutation
 * path in this module is followed by a write() of the same document, so this is
 * safe — and it removes a JSON.parse of the entire session history from every
 * single read (yearBreakdown alone performed 365 of them).
 */

let cache = null;              /* null until hydrate() completes */
let usingIDB = false;
let mirrorToLocal = true;      /* keep localStorage in sync for one release */
let warned = false;

const dirty = new Set();
let flushTimer = 0;
let lastWriteError = null;

const META_KEY = 'gym.meta';

const DOC_KEYS = Object.values(DOCS).map(d => d.key);

function localSnapshot() {
  const out = {};
  for (const key of DOC_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) out[key] = JSON.parse(raw);
    } catch { /* unreadable key — treated as absent */ }
  }
  return out;
}

function read(key, fallback) {
  if (cache && key in cache && cache[key] != null) return cache[key];
  /* Before hydration (or for a key never written) fall back to localStorage so
     nothing breaks if a view somehow renders early. */
  if (!cache) {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw);
    } catch { /* ignore */ }
  }
  return structuredClone(fallback);
}

function write(key, value) {
  if (!cache) cache = {};
  cache[key] = value;

  if (mirrorToLocal) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* Quota or private mode. IndexedDB is the real store, so this is only a
         lost rollback path — not lost data. Stop retrying. */
      mirrorToLocal = false;
      if (!warned) { warned = true; console.warn('localStorage mirror disabled:', err); }
    }
  }

  if (usingIDB) {
    dirty.add(key);
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 120);
  }
  emit();
}

async function flush() {
  if (!usingIDB || !dirty.size) return;
  const batch = {};
  for (const key of dirty) batch[key] = cache[key];
  dirty.clear();
  try {
    await writeDocs(batch);
    lastWriteError = null;
  } catch (err) {
    /* Never swallow a failed write: the user needs to know their last entry
       may not have persisted, and that a backup is the safe next step. */
    lastWriteError = err;
    console.error('Could not save to local database:', err);
    for (const key of Object.keys(batch)) dirty.add(key);
    emit();
  }
}

/** Surfaced in Settings so a persistent failure is visible rather than silent. */
export const getWriteError = () => lastWriteError;
export const flushNow = () => flush();
export const storageBackend = () => (usingIDB ? 'indexeddb' : mirrorToLocal ? 'localstorage' : 'memory');

/* ---------- hydration + migration ---------- */

/**
 * Load everything into memory, migrating from localStorage on first run.
 * Must be awaited before the first render.
 */
export async function hydrate() {
  let docs = {};
  try {
    docs = await readAllDocs();
    usingIDB = true;
  } catch (err) {
    console.warn('IndexedDB unavailable; continuing on localStorage.', err);
    usingIDB = false;
  }

  const local = localSnapshot();
  const hasIDB = Object.keys(docs).length > 0;
  const hasLocal = Object.keys(local).length > 0;

  if (usingIDB && !hasIDB && hasLocal) {
    try {
      await migrateFromLocal(local);
      docs = await readAllDocs();
    } catch (err) {
      /* Migration failed — stay on the localStorage copy, which is untouched. */
      console.error('Migration to IndexedDB failed; using localStorage.', err);
      usingIDB = false;
      cache = local;
      return { backend: 'localstorage', migrated: false, error: String(err) };
    }
  }

  cache = usingIDB && Object.keys(docs).length ? docs : local;
  return { backend: storageBackend(), migrated: usingIDB && hasLocal && !hasIDB };
}

/**
 * Copy localStorage into IndexedDB.
 * Order matters: snapshot first, write in one transaction, verify, only then
 * record the migration. localStorage is never cleared here, so a failure at any
 * point leaves the original data intact and readable.
 */
async function migrateFromLocal(local) {
  await saveBackup('pre-indexeddb-migration', {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    docs: local
  });

  await writeDocs(local);

  const after = await readAllDocs();
  for (const [key, value] of Object.entries(local)) {
    const before = JSON.stringify(value);
    const now = JSON.stringify(after[key]);
    if (before !== now) throw new Error(`Verification failed for ${key}`);
  }

  await writeDoc(META_KEY, {
    schemaVersion: SCHEMA_VERSION,
    migratedAt: new Date().toISOString(),
    from: 'localStorage'
  });
  return true;
}

/* ---------- change notification ---------- */

const listeners = new Set();
export const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
function emit() { for (const fn of listeners) fn(); }

/* ---------- settings ---------- */

export const getSettings = () => Object.assign({}, DEFAULTS, read(K.settings, {}));
export function saveSettings(patch) {
  write(K.settings, Object.assign(getSettings(), patch));
  /* lets the shell re-apply preferences such as Reduce Motion immediately */
  try { window.dispatchEvent(new CustomEvent('gym:settings')); } catch { /* non-browser */ }
  return getSettings();
}
export const SETTING_DEFAULTS = DEFAULTS;

/* ---------- dates ---------- */

/** Local calendar date as YYYY-MM-DD (never UTC — a 1am gym session is still today). */
export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function sessionKey(dayId, d = new Date()) {
  return `${dateKey(d)}|${dayId}`;
}

/** Monday-first start of the week containing `d`. */
export function weekStart(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shift = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - shift);
  return x;
}

/* ---------- sessions ---------- */

const allSessions = () => read(K.sessions, {});

export { allSessions };

export function getSession(dayId, date = new Date()) {
  const s = allSessions()[sessionKey(dayId, date)];
  return s || { dayId, startedAt: null, endedAt: null, ex: {} };
}

function saveSession(dayId, date, session) {
  const all = allSessions();
  all[sessionKey(dayId, date)] = session;
  write(K.sessions, all);
}

export function startSession(dayId, date = new Date()) {
  const s = getSession(dayId, date);
  if (!s.startedAt) { s.startedAt = Date.now(); saveSession(dayId, date, s); }
  return s;
}

function entry(session, exId, setCount) {
  if (!session.ex[exId]) session.ex[exId] = { sets: [], done: false };
  const e = session.ex[exId];
  while (e.sets.length < setCount) e.sets.push({ reps: null, weight: null, rpe: null, done: false });
  return e;
}

export function getEntry(dayId, exId, setCount, date = new Date()) {
  const s = getSession(dayId, date);
  const e = s.ex[exId] || { sets: [], done: false };
  const sets = e.sets.slice();
  while (sets.length < setCount) sets.push({ reps: null, weight: null, rpe: null, done: false });
  return { ...e, sets };
}

/** Record one set. Returns the updated entry. */
export function logSet(dayId, exId, index, data, setCount, date = new Date()) {
  const s = getSession(dayId, date);
  if (!s.startedAt) s.startedAt = Date.now();
  const e = entry(s, exId, Math.max(setCount, index + 1));
  const oldBest = getPR(exId)?.best?.weight ?? 0;
  e.sets[index] = Object.assign({}, e.sets[index], data);
  /* the exercise counts as done once every planned set is ticked */
  e.done = e.sets.slice(0, setCount).every(x => x.done);
  saveSession(dayId, date, s);
  
  const logged = e.sets.filter(x => x.done && Number(x.weight) > 0);
  let isNewPR = false;
  let top = null;
  if (logged.length) {
    top = logged.reduce((a, b) => (Number(b.weight) > Number(a.weight) ? b : a));
    const newWeight = Number(top.weight);
    if (newWeight > oldBest) {
      isNewPR = true;
    }
  }
  
  updatePR(exId, e.sets, date);
  
  if (isNewPR && oldBest > 0 && data.done) {
    e.newPR = {
      weight: top.weight,
      reps: top.reps,
      prevWeight: oldBest
    };
  }
  return e;
}

export function setExerciseDone(dayId, exId, done, setCount, date = new Date()) {
  const s = getSession(dayId, date);
  const e = entry(s, exId, setCount);
  e.done = done;
  /* marking the whole exercise complete ticks any untouched sets so the
     progress bar and the set grid never disagree */
  if (done) e.sets.forEach(x => { x.done = true; });
  else e.sets.forEach(x => { x.done = false; });
  saveSession(dayId, date, s);
  updatePR(exId, e.sets, date);
  return e;
}

export function sessionProgress(dayId, exerciseIds, date = new Date()) {
  const s = getSession(dayId, date);
  const done = exerciseIds.filter(id => s.ex[id]?.done).length;
  const total = exerciseIds.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, startedAt: s.startedAt, endedAt: s.endedAt };
}

export function completeSession(dayId, date = new Date()) {
  const s = getSession(dayId, date);
  if (!s.endedAt) { s.endedAt = Date.now(); saveSession(dayId, date, s); }
  return s;
}

/**
 * Set how long a session took, for a workout logged after the fact.
 * Anchored to midday on that date so the stored timestamps stay on the
 * intended day in every timezone.
 */
export function setSessionDuration(dayId, minutes, date = new Date()) {
  const s = getSession(dayId, date);
  const mins = Math.max(1, Math.min(600, Number(minutes) || 0));
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  s.startedAt = base.getTime();
  s.endedAt = base.getTime() + mins * 60000;
  saveSession(dayId, date, s);
  return s;
}

export function resetSession(dayId, date = new Date()) {
  const all = allSessions();
  delete all[sessionKey(dayId, date)];
  write(K.sessions, all);
}

/* ---------- set classification ---------- */

/** Set types. Warm-ups are logged but never counted as work. */
export const SET_TYPES = {
  warmup:  { id: 'warmup',  short: 'W', label: 'Warm-up', counts: false },
  working: { id: 'working', short: '',  label: 'Working set', counts: true },
  drop:    { id: 'drop',    short: 'D', label: 'Drop set', counts: true },
  failure: { id: 'failure', short: 'F', label: 'To failure', counts: true }
};

export const setType = s => SET_TYPES[s?.type] || SET_TYPES.working;

/**
 * A completed set that counts toward volume, records and strength trends.
 * Warm-ups are excluded: counting them would inflate volume and could set a
 * "record" from a light preparatory set.
 */
export const isWorkingSet = s => !!s?.done && setType(s).counts;

/** Per-exercise notes for one session. */
export function setExerciseNote(dayId, exId, note, date = new Date()) {
  const session = getSession(dayId, date);
  const e = entry(session, exId, 1);
  e.note = String(note || '').slice(0, 500);
  saveSession(dayId, date, session);
  return e;
}

export function getExerciseNote(dayId, exId, date = new Date()) {
  return getSession(dayId, date).ex?.[exId]?.note || '';
}

/** The most recent completed working sets for an exercise, for one-tap reuse. */
export function previousSets(exId, beforeDate = new Date()) {
  const key = dateKey(beforeDate);
  const hist = exerciseHistory(exId).find(h => h.date < key);
  if (!hist) return null;
  const sets = hist.sets.filter(s => isWorkingSet(s) || (s.weight && s.reps));
  return sets.length ? { date: hist.date, sets } : null;
}

/* ---------- personal records ---------- */

const allPRs = () => read(K.prs, {});

function updatePR(exId, sets, date) {
  const logged = sets.filter(s => isWorkingSet(s) && Number(s.weight) > 0);
  if (!logged.length) return;
  const top = logged.reduce((a, b) => (Number(b.weight) > Number(a.weight) ? b : a));
  const prs = allPRs();
  const cur = prs[exId] || { best: null, latest: null };
  const record = { weight: Number(top.weight), reps: Number(top.reps) || null, date: dateKey(date) };
  cur.latest = record;
  if (!cur.best || record.weight > cur.best.weight) cur.best = record;
  prs[exId] = cur;
  write(K.prs, prs);
}

export const getPR = exId => allPRs()[exId] || null;
export const getAllPRs = () => allPRs();

/* ---------- history ---------- */

/** Every logged session for one exercise, newest first. */
export function exerciseHistory(exId) {
  const out = [];
  for (const [key, s] of Object.entries(allSessions())) {
    const e = s.ex?.[exId];
    if (!e) continue;
    const sets = e.sets.filter(x => x.done || x.weight || x.reps);
    if (!sets.length) continue;
    out.push({ date: key.split('|')[0], dayId: s.dayId, sets });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Completion for each day of the week containing `date`. */
export function weekSummary(week, date = new Date()) {
  const start = weekStart(date);
  return week.map((day, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const ids = (day.sections || []).flatMap(s => s.exercises);
    const s = allSessions()[sessionKey(day.id, d)];
    const done = ids.filter(id => s?.ex?.[id]?.done).length;
    return {
      day, date: dateKey(d), rest: !!day.rest, done, total: ids.length,
      pct: ids.length ? Math.round((done / ids.length) * 100) : 0,
      isToday: dateKey(d) === dateKey(date)
    };
  });
}

/** Totals across all time, for the progress header. */
export function lifetimeStats() {
  const sessions = Object.values(allSessions());
  let workouts = 0, sets = 0, volume = 0, lastDate = null;
  for (const s of sessions) {
    const entries = Object.values(s.ex || {});
    const doneSets = entries.flatMap(e => e.sets.filter(isWorkingSet));
    if (!doneSets.length) continue;
    workouts++;
    sets += doneSets.length;
    volume += doneSets.reduce((sum, x) => sum + (Number(x.weight) || 0) * (Number(x.reps) || 0), 0);
  }
  for (const key of Object.keys(allSessions())) {
    const d = key.split('|')[0];
    if (!lastDate || d > lastDate) lastDate = d;
  }
  return { workouts, sets, volume: Math.round(volume), lastDate };
}


/* ---------- resolved configuration ---------- */

/** The meal plan in force: the user's edited copy, or the shipped default. */
export function getMealPlan() {
  const custom = getSettings().mealPlan;
  return Array.isArray(custom) && custom.length ? custom : MEAL_PLAN;
}

export function getTargets() {
  const s = getSettings();
  const plan = getMealPlan();
  return {
    kcal: Number(s.dailyCalories) || plan.reduce((n, m) => n + (Number(m.kcal) || 0), 0),
    protein: Number(s.dailyProtein) || plan.reduce((n, m) => n + (Number(m.protein) || 0), 0)
  };
}

export function getHabits() {
  const custom = getSettings().habits;
  return Array.isArray(custom) ? custom : DEFAULT_HABITS;
}

export function saveHabits(list) { return saveSettings({ habits: list }); }

export function getScoreWeights() {
  return Object.assign({}, SCORE_WEIGHTS, getSettings().scoreWeights || {});
}

/* ---------- weight ---------- */

const allWeights = () => read(K.weights, []);

/**
 * Record a weigh-in. `kind` is 'checkin' | 'checkout' | 'manual'.
 * One entry per kind per day — re-recording corrects the earlier value rather
 * than piling up duplicates.
 */
export function addWeight(kg, kind = 'manual', date = new Date(), dayId = null) {
  const value = Number(kg);
  if (!isFinite(value) || value <= 0) throw new Error('Weight must be a positive number.');
  const list = allWeights();
  const d = dateKey(date);
  const entry = {
    date: d,
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    kg: Math.round(value * 10) / 10,
    kind,
    dayId: dayId || dayFor(date).id
  };
  const at = list.findIndex(e => e.date === d && e.kind === kind);
  if (at >= 0) list[at] = entry; else list.push(entry);
  list.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  write(K.weights, list);

  /* the first weigh-in defines the start of the journey */
  if (getSettings().startWeight == null) saveSettings({ startWeight: entry.kg });
  return entry;
}

export const getWeights = () => allWeights();

export function weightsOn(date = new Date()) {
  const d = dateKey(date);
  const out = {};
  for (const e of allWeights()) if (e.date === d) out[e.kind] = e;
  return out;
}

/** Most recent measurement of any kind. */
export function latestWeight() {
  const list = allWeights();
  return list.length ? list[list.length - 1] : null;
}

/** One representative value per day (the last measurement of that day). */
export function dailyWeights() {
  const byDay = new Map();
  for (const e of allWeights()) byDay.set(e.date, e);
  return [...byDay.values()];
}

/** Centred moving average — the trend line, which is what actually matters. */
/**
 * Causal exponentially-weighted trend.
 *
 * The previous implementation used a *centred* window, which reads well in the
 * middle of a chart but is wrong exactly where it matters: at the most recent
 * point there is no future data, so the window collapses to a couple of trailing
 * samples and the headline "trend weight" jumps with the last weigh-in — the
 * very noise a trend is supposed to remove.
 *
 * This uses only past data (so today's value never changes retroactively) and
 * weights recent days more heavily. Gaps are handled by decaying on elapsed
 * days rather than on sample count, so a week without weighing does not let a
 * single new reading yank the trend.
 *
 * @param {Array<{date,kg}>} series chronological daily readings
 * @param {number} halfLife days for a reading's influence to halve
 */
export function movingAverage(series, halfLife = 7) {
  if (!series.length) return [];
  const out = [];
  let trend = series[0].kg;
  let prev = dateOf(series[0].date);

  for (const point of series) {
    const now = dateOf(point.date);
    const gapDays = Math.max(0, (now - prev) / 86400000);
    /* alpha rises with the gap: the longer since the last reading, the more
       weight the new one deserves */
    const alpha = gapDays === 0 ? 1 - Math.pow(0.5, 1 / halfLife)
                                : 1 - Math.pow(0.5, gapDays / halfLife);
    trend = trend + alpha * (point.kg - trend);
    prev = now;
    out.push({ ...point, kg: Math.round(trend * 100) / 100 });
  }
  return out;
}

const dateOf = iso => {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getTime();
};

/** The single number to show as "trend weight" — the latest causal estimate. */
export function trendWeight() {
  const trend = movingAverage(dailyWeights());
  return trend.length ? trend[trend.length - 1].kg : null;
}

/**
 * Rate of change in kg/week, from a least-squares fit over a recent window.
 *
 * Fitting the *whole* history (as this used to) reports a lifetime average: a
 * fast start followed by a plateau keeps showing the old rate indefinitely.
 * Only the recent window answers "what is happening now".
 */
export function trendRate(days = 21) {
  /* Regress the *raw* readings, not the smoothed line. Least squares already
     rejects noise, whereas fitting the EWMA inherits its lag: a genuine plateau
     read as -0.16 kg/week purely because the smoothed line was still catching
     up to the flat data underneath it. */
  const pts0 = dailyWeights();
  if (pts0.length < 4) return null;

  const cutoff = Date.now() - days * 86400000;
  let pts = pts0.filter(p => dateOf(p.date) >= cutoff);
  /* fall back to the most recent points when the window is sparse */
  if (pts.length < 4) pts = pts0.slice(-4);

  const spanDays = (dateOf(pts[pts.length - 1].date) - dateOf(pts[0].date)) / 86400000;
  if (spanDays < 5) return null;

  /* least squares on (day offset, kg) */
  const x0 = dateOf(pts[0].date);
  const xs = pts.map(p => (dateOf(p.date) - x0) / 86400000);
  const ys = pts.map(p => p.kg);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  if (!den) return null;

  const perDay = num / den;
  return Math.round(perDay * 7 * 100) / 100;
}

/**
 * How much the trend can be trusted, so a two-day line is never presented with
 * the same authority as two months of data.
 * Returns { level, n, spanDays, scatter } with level GOOD | FAIR | INSUFFICIENT.
 */
export function trendQuality(days = 28) {
  const series = dailyWeights();
  const cutoff = Date.now() - days * 86400000;
  const recent = series.filter(p => dateOf(p.date) >= cutoff);
  const n = recent.length;
  const spanDays = n > 1
    ? Math.round((dateOf(recent[n - 1].date) - dateOf(recent[0].date)) / 86400000) : 0;

  if (n < 5 || spanDays < 10) {
    return { level: 'INSUFFICIENT', n, spanDays, scatter: null,
             note: 'Keep logging your weight to establish a reliable trend.' };
  }

  /* typical distance of a raw reading from the trend line */
  const trend = movingAverage(series).filter(p => dateOf(p.date) >= cutoff);
  const resid = recent.map((p, i) => Math.abs(p.kg - (trend[i]?.kg ?? p.kg)));
  const scatter = Math.round((resid.reduce((a, b) => a + b, 0) / resid.length) * 100) / 100;

  /* density matters as much as count: 20 readings over 28 days beats 20 in 5 */
  const density = n / Math.max(1, spanDays);
  const level = (n >= 12 && density >= 0.5 && scatter <= 0.8) ? 'GOOD' : 'FAIR';
  return { level, n, spanDays, scatter,
           note: level === 'GOOD'
             ? `${n} weigh-ins over ${spanDays} days.`
             : `${n} weigh-ins over ${spanDays} days — log more often to sharpen this.` };
}

const RANGE_DAYS = { '7D': 7, '30D': 30, '3M': 90, '6M': 182, '1Y': 365, 'ALL': Infinity };

export function weightSeries(range = '30D') {
  const days = RANGE_DAYS[range] ?? 30;
  const all = dailyWeights();
  if (days === Infinity) return all;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const key = dateKey(cutoff);
  return all.filter(e => e.date >= key);
}

export function weightStats(range = '30D') {
  const series = weightSeries(range);
  if (!series.length) return null;
  const values = series.map(e => e.kg);
  const trend = movingAverage(series);
  const change = series.length > 1 ? series[series.length - 1].kg - series[0].kg : 0;
  return {
    current: values[values.length - 1],
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
    change: Math.round(change * 10) / 10,
    trend,
    count: series.length
  };
}

/** Progress from the starting weight toward the target. Never negative. */
export function weightGoal() {
  const s = getSettings();
  const latest = latestWeight();
  const current = latest ? latest.kg : null;
  const start = s.startWeight ?? current;
  const target = Number(s.targetWeight) || TARGET_RANGE.default;
  if (current == null || start == null) {
    return { current: null, start: null, target, remaining: null, pct: 0, trendWeight: null };
  }
  const trend = movingAverage(dailyWeights());
  const tw = trend.length ? trend[trend.length - 1].kg : current;

  /* Progress and distance-to-target both follow the trend, not the last
     reading: a single heavy morning should not move the goal bar. */
  const remaining = Math.max(0, Math.round((tw - target) * 10) / 10);
  const span = start - target;
  const pct = span <= 0 ? 100 : Math.max(0, Math.min(100, Math.round(((start - tw) / span) * 100)));

  const s2 = getSettings();
  const inRange = tw <= Number(s2.targetMax) && tw >= Number(s2.targetMin);

  return {
    current, start, target, remaining, pct,
    lost: Math.round((start - tw) * 10) / 10,
    trendWeight: tw,
    inRange,
    rangeMin: Number(s2.targetMin), rangeMax: Number(s2.targetMax)
  };
}

/* ---------- day log: meals and habits ---------- */

export const allDays = () => read(K.days, {});

export function getDayLog(date = new Date()) {
  const d = typeof date === 'string' ? date : dateKey(date);
  const log = allDays()[d];
  return { meals: {}, habits: {}, ...(log || {}) };
}

function saveDayLog(dateStr, log) {
  const all = allDays();
  all[dateStr] = log;
  write(K.days, all);
}

export function setMeal(mealId, done, date = new Date()) {
  const d = typeof date === 'string' ? date : dateKey(date);
  const log = getDayLog(d);
  log.meals[mealId] = !!done;
  saveDayLog(d, log);
  return log;
}

/** Record a habit for a day. Recording *is* the tracked state. */
export function setHabit(habitId, data, date = new Date()) {
  const d = typeof date === 'string' ? date : dateKey(date);
  const log = getDayLog(d);
  log.habits[habitId] = { tracked: true, ...(log.habits[habitId] || {}), ...data };
  saveDayLog(d, log);
  return log;
}

export function clearHabit(habitId, date = new Date()) {
  const d = typeof date === 'string' ? date : dateKey(date);
  const log = getDayLog(d);
  delete log.habits[habitId];
  saveDayLog(d, log);
  return log;
}

/** Did this entry meet the habit's own aim? Used only for adherence, never scoring. */
export function habitMetAim(habit, entry) {
  if (!entry || !entry.tracked) return false;
  if (habit.lowerIsBetter) {
    return habit.type === 'yesno' ? entry.value === false : Number(entry.value || 0) === 0;
  }
  if (habit.type === 'yesno') return entry.value === true;
  return Number(entry.value || 0) >= Number(habit.target || 0);
}

/** Consecutive-day runs, both for recording and for meeting the aim. */
export function habitStreaks(habitId) {
  const habit = getHabits().find(h => h.id === habitId);
  if (!habit) return { trackCurrent: 0, trackLongest: 0, aimCurrent: 0, aimLongest: 0 };
  const days = allDays();
  const keys = Object.keys(days).sort();
  if (!keys.length) return { trackCurrent: 0, trackLongest: 0, aimCurrent: 0, aimLongest: 0 };

  let trackLongest = 0, aimLongest = 0, tRun = 0, aRun = 0;
  let cursor = new Date(keys[0] + 'T00:00:00');
  const today = new Date();
  const runsTrack = [], runsAim = [];

  while (dateKey(cursor) <= dateKey(today)) {
    const entry = days[dateKey(cursor)]?.habits?.[habitId];
    if (entry?.tracked) { tRun++; trackLongest = Math.max(trackLongest, tRun); }
    else { runsTrack.push(tRun); tRun = 0; }
    if (habitMetAim(habit, entry)) { aRun++; aimLongest = Math.max(aimLongest, aRun); }
    else { runsAim.push(aRun); aRun = 0; }
    cursor.setDate(cursor.getDate() + 1);
  }
  return { trackCurrent: tRun, trackLongest, aimCurrent: aRun, aimLongest };
}

/** Totals for a count habit (cigarettes today / this week / this month / average). */
export function habitTotals(habitId, date = new Date()) {
  const days = allDays();
  const today = dateKey(date);
  const weekFrom = dateKey(weekStart(date));
  const monthFrom = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
  let day = 0, week = 0, month = 0, tracked = 0, total = 0;

  for (const [d, log] of Object.entries(days)) {
    const entry = log.habits?.[habitId];
    if (!entry?.tracked) continue;
    const n = Number(entry.value) || 0;
    tracked++; total += n;
    if (d === today) day += n;
    if (d >= weekFrom) week += n;
    if (d >= monthFrom) month += n;
  }
  return { day, week, month, average: tracked ? Math.round((total / tracked) * 10) / 10 : 0, trackedDays: tracked };
}

/* ---------- daily progress score ---------- */

/**
 * Four independent components, deliberately kept separate.
 *
 * The weight component measures whether a measurement was *recorded*, never
 * whether the number went down — a heavier reading must never reduce a score.
 * On rest days the workout component does not apply and its share is
 * redistributed across the rest.
 */
export function dailyBreakdown(date = new Date()) {
  const d = typeof date === 'string' ? date : dateKey(date);
  const dateObj = typeof date === 'string' ? new Date(d + 'T12:00:00') : date;
  const day = dayFor(dateObj);
  const log = getDayLog(d);
  const plan = getMealPlan();
  const habits = getHabits();

  /* workout */
  const ids = exercisesOf(day);
  const session = allSessions()[`${d}|${day.id}`];
  const doneEx = ids.filter(id => session?.ex?.[id]?.done).length;
  const workout = {
    applicable: !day.rest,
    done: doneEx,
    total: ids.length,
    value: ids.length ? doneEx / ids.length : 0
  };

  /* nutrition */
  const mealsDone = plan.filter(m => log.meals[m.id]).length;
  const nutrition = {
    done: mealsDone,
    total: plan.length,
    value: plan.length ? mealsDone / plan.length : 0,
    kcal: plan.reduce((n, m) => n + (log.meals[m.id] ? (Number(m.kcal) || 0) : 0), 0),
    protein: plan.reduce((n, m) => n + (log.meals[m.id] ? (Number(m.protein) || 0) : 0), 0)
  };

  /* habits — recording is what counts */
  const trackedCount = habits.filter(h => log.habits[h.id]?.tracked).length;
  const habitsPart = {
    done: trackedCount,
    total: habits.length,
    value: habits.length ? trackedCount / habits.length : 0,
    metAim: habits.filter(h => habitMetAim(h, log.habits[h.id])).length
  };

  /* weight: consistency of recording */
  const w = weightsOn(dateObj);
  const weight = day.rest
    ? { applicable: true, value: (w.checkin || w.checkout || w.manual) ? 1 : 0, checkIn: w.checkin?.kg ?? null, checkOut: w.checkout?.kg ?? null, expected: 1 }
    : {
        applicable: true,
        value: ((w.checkin ? 0.5 : 0) + (w.checkout ? 0.5 : 0)) || (w.manual ? 0.5 : 0),
        checkIn: w.checkin?.kg ?? null,
        checkOut: w.checkout?.kg ?? null,
        expected: 2
      };

  /* weighted total, renormalised when a component does not apply */
  const weights = getScoreWeights();
  const parts = [
    ['workout', workout.value, workout.applicable],
    ['nutrition', nutrition.value, true],
    ['habits', habitsPart.value, habitsPart.total > 0],
    ['weight', weight.value, true]
  ];
  const totalWeight = parts.reduce((n, [k, , ok]) => n + (ok ? (weights[k] || 0) : 0), 0);
  const score = totalWeight
    ? Math.round(parts.reduce((n, [k, v, ok]) => n + (ok ? v * (weights[k] || 0) : 0), 0) / totalWeight * 100)
    : 0;

  return { date: d, day, score, workout, nutrition, habits: habitsPart, weight };
}

/* ---------- period aggregation ---------- */

/** Did this day record anything at all? Used to keep averages honest. */
function hasActivity(b) {
  return b.workout.done > 0 || b.nutrition.done > 0 || b.habits.done > 0 || b.weight.value > 0;
}

function eachDay(from, to) {
  const out = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (cursor <= to) {
    out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** Per-day breakdowns for the week containing `date` (Monday first). */
export function weekBreakdown(date = new Date()) {
  const start = weekStart(date);
  const end = new Date(start); end.setDate(end.getDate() + 6);
  const today = dateKey();
  const days = eachDay(start, end).map(d => {
    const b = dailyBreakdown(d);
    return { ...b, future: b.date > today, isToday: b.date === today };
  });
  const counted = days.filter(d => !d.future);
  return {
    days,
    score: counted.length ? Math.round(counted.reduce((n, d) => n + d.score, 0) / counted.length) : 0,
    workouts: {
      done: counted.filter(d => d.workout.applicable && d.workout.value >= 1).length,
      total: counted.filter(d => d.workout.applicable).length
    },
    meals: {
      done: counted.reduce((n, d) => n + d.nutrition.done, 0),
      total: counted.reduce((n, d) => n + d.nutrition.total, 0)
    },
    weighIns: {
      done: counted.reduce((n, d) => n + (d.weight.checkIn ? 1 : 0) + (d.weight.checkOut ? 1 : 0), 0),
      total: counted.reduce((n, d) => n + d.weight.expected, 0)
    },
    habitAdherence: (() => {
      const tot = counted.reduce((n, d) => n + d.habits.total, 0);
      const met = counted.reduce((n, d) => n + d.habits.metAim, 0);
      return tot ? Math.round((met / tot) * 100) : 0;
    })()
  };
}

/** Per-day breakdowns for the calendar month containing `date`. */
export function monthBreakdown(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const today = dateKey();
  const days = eachDay(start, end).map(d => {
    const b = dailyBreakdown(d);
    return { ...b, future: b.date > today };
  });
  const counted = days.filter(d => !d.future && hasActivity(d));
  const avg = (pick) => counted.length
    ? Math.round(counted.reduce((n, d) => n + pick(d), 0) / counted.length * 100) : 0;
  return {
    days,
    monthStart: start,
    score: counted.length ? Math.round(counted.reduce((n, d) => n + d.score, 0) / counted.length) : 0,
    workoutConsistency: (() => {
      const applicable = counted.filter(d => d.workout.applicable);
      return applicable.length
        ? Math.round(applicable.filter(d => d.workout.value >= 1).length / applicable.length * 100) : 0;
    })(),
    nutritionConsistency: avg(d => d.nutrition.value),
    habitConsistency: avg(d => d.habits.value),
    weightConsistency: avg(d => d.weight.value)
  };
}

/** Month-by-month rollup for a year, plus the headline totals. */
export function yearBreakdown(year = new Date().getFullYear()) {
  const today = dateKey();
  const months = [];
  let workouts = 0, meals = 0, habitMet = 0, habitTotal = 0, scored = 0, scoreSum = 0;

  for (let m = 0; m < 12; m++) {
    const start = new Date(year, m, 1);
    const end = new Date(year, m + 1, 0);
    const days = eachDay(start, end)
      .map(d => dailyBreakdown(d))
      .filter(b => b.date <= today);
    /* Averaging across months before tracking began would report a misleadingly
       low year — only days with something recorded count toward the averages. */
    const counted = days.filter(hasActivity);
    workouts += days.filter(b => b.workout.applicable && b.workout.value >= 1).length;
    meals += days.reduce((n, b) => n + b.nutrition.done, 0);
    for (const b of days) {
      if (!b.habits.done) continue;          /* nothing tracked that day */
      habitMet += b.habits.metAim;
      habitTotal += b.habits.total;
    }
    scoreSum += counted.reduce((n, b) => n + b.score, 0);
    scored += counted.length;
    months.push({
      month: m,
      label: start.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
      score: counted.length ? Math.round(counted.reduce((n, b) => n + b.score, 0) / counted.length) : 0,
      active: counted.length
    });
  }

  const weights = dailyWeights().filter(e => e.date.startsWith(String(year)));
  return {
    year, months,
    score: scored ? Math.round(scoreSum / scored) : 0,
    workouts, meals,
    habitAdherence: habitTotal ? Math.round((habitMet / habitTotal) * 100) : 0,
    weightChange: weights.length > 1
      ? Math.round((weights[weights.length - 1].kg - weights[0].kg) * 10) / 10 : null,
    bestWorkoutStreak: bestStreak(b => b.workout.applicable ? b.workout.value >= 1 : null),
    bestHabitStreak: bestStreak(b => b.habits.total ? b.habits.value >= 1 : null)
  };
}

/** Longest run of days satisfying `pick`; null from pick skips the day (rest days). */
function bestStreak(pick) {
  const days = Object.keys(allDays()).concat(Object.keys(allSessions()).map(k => k.split('|')[0]));
  const keys = [...new Set(days)].sort();
  if (!keys.length) return 0;
  let best = 0, run = 0;
  const cursor = new Date(keys[0] + 'T00:00:00');
  const today = new Date();
  while (dateKey(cursor) <= dateKey(today)) {
    const verdict = pick(dailyBreakdown(new Date(cursor)));
    if (verdict === null) { /* not applicable — the run carries over */ }
    else if (verdict) { run++; best = Math.max(best, run); }
    else run = 0;
    cursor.setDate(cursor.getDate() + 1);
  }
  return best;
}


/* ---------- strength progression ---------- */

/** Epley estimate. Labelled as an estimate everywhere it is shown. */
export function estimate1RM(weight, reps) {
  const w = Number(weight) || 0, r = Number(reps) || 0;
  if (!w || !r) return 0;
  if (r === 1) return Math.round(w * 10) / 10;
  return Math.round(w * (1 + r / 30) * 10) / 10;
}

/**
 * Strength picture for one exercise, derived only from logged sets.
 * Returns null when nothing has been logged — callers show an empty state
 * rather than a zeroed-out chart.
 */
export function strengthFor(exerciseId) {
  const history = exerciseHistory(exerciseId);
  if (!history.length) return null;

  const sessions = history.map(h => {
    const sets = h.sets.filter(s => Number(s.weight) > 0 && Number(s.reps) > 0 && setType(s).counts);
    if (!sets.length) return null;
    const top = sets.reduce((a, b) => (estimate1RM(b.weight, b.reps) > estimate1RM(a.weight, a.reps) ? b : a));
    return {
      date: h.date,
      topWeight: Number(top.weight),
      topReps: Number(top.reps),
      e1rm: estimate1RM(top.weight, top.reps),
      volume: sets.reduce((n, s) => n + Number(s.weight) * Number(s.reps), 0),
      sets: sets.length
    };
  }).filter(Boolean);

  if (!sessions.length) return null;

  const best = sessions.reduce((a, b) => (b.e1rm > a.e1rm ? b : a));
  const last = sessions[0];                 /* exerciseHistory is newest-first */
  const previous = sessions[1] || null;

  let trend = 'flat';
  if (previous) {
    if (last.e1rm > previous.e1rm + 0.5) trend = 'up';
    else if (last.e1rm < previous.e1rm - 0.5) trend = 'down';
  }

  return {
    best, last, previous, trend,
    sessions: sessions.slice(0, 12),
    volumeTrend: previous ? last.volume - previous.volume : null
  };
}

/* ---------- gym session history ---------- */

/**
 * One entry per trained day, newest first, with everything the session summary
 * needs. Only days that actually recorded something appear.
 */
export function sessionHistory(limit = 60) {
  const out = [];
  for (const [key, session] of Object.entries(allSessions())) {
    const [date, dayId] = key.split('|');
    const day = WEEK.find(d => d.id === dayId);
    if (!day) continue;

    const entries = Object.values(session.ex || {});
    const doneSets = entries.flatMap(e => e.sets.filter(isWorkingSet));
    const exercisesDone = entries.filter(e => e.done).length;
    if (!doneSets.length && !exercisesDone) continue;

    const dayWeights = allWeights().filter(w => w.date === date);
    const checkIn = dayWeights.find(w => w.kind === 'checkin') || null;
    const checkOut = dayWeights.find(w => w.kind === 'checkout') || null;

    out.push({
      date, dayId, day,
      title: day.title,
      checkIn: checkIn ? checkIn.kg : null,
      checkOut: checkOut ? checkOut.kg : null,
      sessionChange: (checkIn && checkOut)
        ? Math.round((checkOut.kg - checkIn.kg) * 10) / 10 : null,
      durationMin: (session.startedAt && session.endedAt)
        ? Math.max(1, Math.round((session.endedAt - session.startedAt) / 60000)) : null,
      exercisesDone,
      exercisesTotal: exercisesOf(day).length,
      sets: doneSets.length,
      reps: doneSets.reduce((n, s) => n + (Number(s.reps) || 0), 0),
      volume: Math.round(doneSets.reduce((n, s) => n + (Number(s.weight) || 0) * (Number(s.reps) || 0), 0)),
      avgRpe: (() => {
        const rpes = doneSets.map(s => Number(s.rpe)).filter(Boolean);
        return rpes.length ? Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10 : null;
      })()
    });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit);
}

/* ---------- weigh-in consistency ---------- */

/**
 * Calendar of weigh-in logging for the month containing `date`.
 * States: 'full' (both check-in and check-out, or a log on a rest day),
 * 'partial' (one of the two), 'none', 'rest', 'future'.
 */
export function weighInCalendar(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const today = dateKey();
  const days = [];

  const cursor = new Date(start);
  while (cursor <= end) {
    const key = dateKey(cursor);
    const day = dayFor(cursor);
    const w = weightsOn(cursor);
    const logged = (w.checkin ? 1 : 0) + (w.checkout ? 1 : 0) + (w.manual ? 1 : 0);
    let state;
    if (key > today) state = 'future';
    else if (day.rest) state = logged ? 'full' : 'rest';
    else if (w.checkin && w.checkout) state = 'full';
    else if (logged) state = 'partial';
    else state = 'none';
    days.push({ date: key, day, state, logged });
    cursor.setDate(cursor.getDate() + 1);
  }

  const counted = days.filter(d => d.state !== 'future');
  return {
    monthStart: start,
    days,
    logged: counted.filter(d => d.state === 'full' || d.state === 'partial').length,
    total: counted.length
  };
}

/* ---------- workout streak ---------- */

/**
 * Consecutive trained days. A scheduled rest day carries the streak over
 * instead of breaking it — Sunday off is the plan, not a lapse.
 */
export function workoutStreak() {
  const sessions = allSessions();
  const trained = new Set();
  for (const [key, s] of Object.entries(sessions)) {
    const [date] = key.split('|');
    if (Object.values(s.ex || {}).some(e => e.done)) trained.add(date);
  }
  if (!trained.size) return { current: 0, longest: 0 };

  const keys = [...trained].sort();
  let longest = 0, run = 0, current = 0;
  const cursor = new Date(keys[0] + 'T00:00:00');
  const today = new Date();

  while (dateKey(cursor) <= dateKey(today)) {
    const key = dateKey(cursor);
    if (trained.has(key)) { run++; longest = Math.max(longest, run); }
    else if (!dayFor(cursor).rest) run = 0;   /* rest days do not break it */
    cursor.setDate(cursor.getDate() + 1);
  }
  current = run;
  return { current, longest };
}


/* ---------- data quality ---------- */

/**
 * Surface gaps and suspect entries rather than letting them quietly skew the
 * analytics. Every finding names what to do about it; nothing is auto-corrected,
 * because guessing at a user's training log is worse than reporting a gap.
 */
export function dataQuality(days = 30) {
  const findings = [];
  const today = dateKey();
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days);
  const from = dateKey(cutoff);

  /* --- weigh-ins --- */
  const weights = allWeights().filter(w => w.date >= from);
  const byDay = new Set(weights.map(w => w.date));
  let expected = 0, missing = 0;
  const cursor = new Date(cutoff);
  while (dateKey(cursor) <= today) {
    expected++;
    if (!byDay.has(dateKey(cursor))) missing++;
    cursor.setDate(cursor.getDate() + 1);
  }
  if (expected && missing > expected * 0.34) {
    findings.push({
      kind: 'weight', severity: missing > expected * 0.6 ? 'high' : 'low',
      label: `${missing} days without a weigh-in`,
      detail: 'Trend accuracy improves quickly with more frequent weighing.',
      action: { label: 'Add past data', href: '#/backfill' }
    });
  }

  const odd = weights.filter(w => w.kg < 30 || w.kg > 300);
  if (odd.length) {
    findings.push({
      kind: 'weight', severity: 'high',
      label: `${odd.length} weigh-in${odd.length === 1 ? '' : 's'} outside a plausible range`,
      detail: `Check ${odd.slice(0, 3).map(w => `${w.date} (${w.kg})`).join(', ')} — a missing decimal point is the usual cause.`,
      action: { label: 'Review history', href: '#/analytics?tab=weight' }
    });
  }

  /* large single-day jumps suggest a typo rather than physiology */
  const daily = dailyWeights().filter(w => w.date >= from);
  const jumps = [];
  for (let i = 1; i < daily.length; i++) {
    const delta = Math.abs(daily[i].kg - daily[i - 1].kg);
    const gap = Math.max(1, (dateOf(daily[i].date) - dateOf(daily[i - 1].date)) / 86400000);
    if (delta / gap > 2.5) jumps.push(daily[i]);
  }
  if (jumps.length) {
    findings.push({
      kind: 'weight', severity: 'low',
      label: `${jumps.length} unusually large day-to-day change${jumps.length === 1 ? '' : 's'}`,
      detail: `Worth confirming ${jumps.slice(0, 3).map(w => w.date).join(', ')} was entered correctly.`,
      action: { label: 'Review history', href: '#/analytics?tab=weight' }
    });
  }

  /* --- sessions --- */
  let partial = 0, noSets = 0;
  for (const [key, session] of Object.entries(allSessions())) {
    const [date, dayId] = key.split('|');
    if (date < from) continue;
    const day = WEEK.find(d => d.id === dayId);
    if (!day) continue;
    const ids = exercisesOf(day);
    const entries = Object.values(session.ex || {});
    const done = entries.filter(e => e.done).length;
    if (done > 0 && done < ids.length) partial++;
    const logged = entries.flatMap(e => e.sets.filter(isWorkingSet));
    if (done > 0 && logged.every(x => !Number(x.weight))) noSets++;
  }
  if (partial) {
    findings.push({
      kind: 'workout', severity: 'low',
      label: `${partial} partly finished session${partial === 1 ? '' : 's'}`,
      detail: 'These count toward adherence at the fraction completed, not as whole workouts.',
      action: { label: 'Session history', href: '#/sessions' }
    });
  }
  if (noSets) {
    findings.push({
      kind: 'workout', severity: 'low',
      label: `${noSets} session${noSets === 1 ? '' : 's'} completed without weights`,
      detail: 'Volume, records and strength trends need a weight on each set.',
      action: { label: 'Session history', href: '#/sessions' }
    });
  }

  return {
    findings,
    clean: findings.length === 0,
    high: findings.filter(f => f.severity === 'high').length,
    windowDays: days
  };
}

/* ---------- data management ---------- */

export async function exportData() {
  /* Export is the only backup path, so a failing or slow photo store must never
     block it — the rest of the data still gets out, with photos omitted. */
  let photos = [];
  try {
    photos = await Promise.race([
      getAllPhotos(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('photo store timed out')), 5000))
    ]);
  } catch (err) {
    console.warn('Progress photos could not be read for export:', err);
  }
  return JSON.stringify({
    schemaVersion: SCHEMA_VERSION, version: 2, exportedAt: new Date().toISOString(),
    settings: getSettings(),
    sessions: allSessions(),
    prs: allPRs(),
    weights: allWeights(),
    days: allDays(),
    measurements: getMeasurements(),
    progressPhotos: photos
  }, null, 2);
}

/**
 * Parse and validate a backup without applying it.
 * Returns the inspection report plus the parsed payload, so the caller can show
 * a preview and only then commit.
 */
export function previewImport(json) {
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    return { report: { ok: false, records: {}, issues: [], fatal: ['That file is not valid JSON.'], photos: 0 }, data: null };
  }
  return { report: inspectBackup(data), data };
}

/**
 * Apply a previously previewed backup.
 * The current dataset is snapshotted first, so a regretted import is
 * recoverable rather than final.
 */
export async function importData(json) {
  const { report, data } = typeof json === 'string' ? previewImport(json) : { report: inspectBackup(json), data: json };
  if (!report.ok) throw new Error(report.fatal[0] || 'That backup could not be read.');

  await saveBackup('pre-import', {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    docs: Object.fromEntries(DOC_NAMES.map(n => [DOCS[n].key, read(DOCS[n].key, null)]).filter(([, v]) => v != null))
  }).catch(() => { /* a missing safety net must not block a valid import */ });

  for (const name of DOC_NAMES) {
    if (data[name] !== undefined) write(DOCS[name].key, data[name]);
  }
  if (Array.isArray(data.progressPhotos)) await importPhotos(data.progressPhotos);

  await flush();
  return report;
}

/** Scoped reset: 'workout' | 'weight' | 'habits' | 'nutrition' | 'all'. */
export function clearAll(what = 'all') {
  if (what === 'all' || what === 'workout' || what === 'sessions') { write(K.sessions, {}); write(K.prs, {}); }
  if (what === 'prs') write(K.prs, {});
  if (what === 'all' || what === 'weight') write(K.weights, []);

  if (what === 'habits' || what === 'nutrition') {
    /* these two share the day log, so clear only the half being reset */
    const all = allDays();
    for (const log of Object.values(all)) {
      if (what === 'habits') log.habits = {};
      if (what === 'nutrition') log.meals = {};
    }
    write(K.days, all);
  }
  if (what === 'all' || what === 'measurements') {
    write(K.measurements, []);
  }
  if (what === 'all') {
    write(K.days, {});
    write(K.settings, {});
    clearAllPhotos();
  }
}

/* ---------- custom milestones ---------- */
import { MILESTONES as DEFAULT_MILESTONES } from './data/plan.js';

export function getMilestones() {
  const settings = getSettings();
  return Array.isArray(settings.milestones) ? settings.milestones : DEFAULT_MILESTONES;
}

export function saveMilestones(list) {
  const sorted = list.map(Number).filter(n => !isNaN(n) && n > 0).sort((a, b) => b - a);
  saveSettings({ milestones: sorted });
  return getMilestones();
}

/* ---------- body measurements ---------- */
const allMeasurements = () => read(K.measurements, []);

export function getMeasurements() {
  return allMeasurements();
}

export function addMeasurement(data, date = new Date()) {
  const d = dateKey(date);
  const list = allMeasurements();
  const entry = {
    date: d,
    time: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
    ...data
  };
  const at = list.findIndex(e => e.date === d);
  if (at >= 0) {
    list[at] = Object.assign(list[at], entry);
  } else {
    list.push(entry);
  }
  list.sort((a, b) => a.date.localeCompare(b.date));
  write(K.measurements, list);
  return entry;
}

export function getMeasurementsStats() {
  const list = allMeasurements();
  const keys = ['waist', 'chest', 'shoulders', 'neck', 'biceps', 'forearms', 'thighs', 'calves'];
  const out = {};
  
  for (const key of keys) {
    const history = list.filter(e => e[key] != null);
    if (!history.length) {
      out[key] = null;
      continue;
    }
    const current = history[history.length - 1][key];
    const previous = history.length > 1 ? history[history.length - 2][key] : null;
    const change = previous != null ? current - previous : 0;
    
    // 30-day change
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() - 30);
    const cutStr30 = dateKey(cutoff30);
    const old30Entry = history.find(e => e.date >= cutStr30);
    const change30 = old30Entry && old30Entry !== history[history.length - 1] ? current - old30Entry[key] : null;
    
    // All-time change
    const first = history[0][key];
    const changeAll = current - first;
    
    out[key] = {
      current,
      previous,
      change: Math.round(change * 10) / 10,
      change30: change30 != null ? Math.round(change30 * 10) / 10 : null,
      changeAll: Math.round(changeAll * 10) / 10
    };
  }
  return out;
}

/* ---------- weight analytics helpers ---------- */
/**
 * Current rate of change in kg/week.
 * Kept as the historical name; the calculation now fits a recent window rather
 * than averaging the entire history, which reported a lifetime rate long after
 * the trend had changed.
 */
export function getWeightLossRate() {
  return trendRate(21);
}

export function getGoalProjection() {
  /* A projection built on a noisy two-week line is false precision, so it is
     withheld until the trend itself is trustworthy. */
  const quality = trendQuality();
  if (quality.level === 'INSUFFICIENT') return null;

  const rate = getWeightLossRate();
  if (rate == null || rate >= 0) return null;
  
  const goal = weightGoal();
  if (goal.current == null || goal.trendWeight == null || goal.trendWeight <= goal.target) return null;
  
  const kgToLose = goal.trendWeight - goal.target;
  const weeksNeeded = kgToLose / (-rate);
  
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + Math.round(weeksNeeded * 7));
  
  const options = { month: 'short', year: 'numeric' };
  if (weeksNeeded < 8) options.day = 'numeric';
  return {
    weeks: Math.round(weeksNeeded * 10) / 10,
    dateStr: targetDate.toLocaleDateString(undefined, options)
  };
}

/* ---------- workout streak calculations ---------- */
export function getWorkoutStreaks() {
  const sessions = allSessions();
  const sessionDates = new Set(Object.keys(sessions).map(k => k.split('|')[0]));
  const keys = [...sessionDates].sort();
  if (!keys.length) return { current: 0, longest: 0 };
  
  let longest = 0;
  let current = 0;
  let run = 0;
  
  const start = new Date(keys[0] + 'T12:00:00');
  const today = new Date();
  const cursor = new Date(start);
  
  while (dateKey(cursor) <= dateKey(today)) {
    const dk = dateKey(cursor);
    const day = dayFor(cursor);
    
    if (day.rest) {
      // rest day: does not break streak
    } else {
      const hasWorkout = keys.includes(dk) && sessions[`${dk}|${day.id}`]?.endedAt;
      if (hasWorkout) {
        run++;
        longest = Math.max(longest, run);
      } else {
        if (dk !== dateKey(today)) {
          run = 0;
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  current = run;
  
  return { current, longest };
}
