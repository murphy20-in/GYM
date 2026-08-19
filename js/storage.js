/* storage.js — all persistence. localStorage only, no backend, no accounts.
 *
 * Shape:
 *   gym.v1.settings  { name, goal, experience, units, defaultSets, ... }
 *   gym.v1.sessions  { "2026-08-18|tue": { dayId, startedAt, endedAt, ex: { id: {sets:[…], done} } } }
 *   gym.v1.prs       { exerciseId: { best:{weight,reps,date}, latest:{weight,reps,date} } }
 *
 * A session is keyed by date *and* day id, so browsing Monday's workout on a
 * Tuesday logs against Monday without touching Tuesday's real session.
 */

const K = { settings: 'gym.v1.settings', sessions: 'gym.v1.sessions', prs: 'gym.v1.prs' };

const DEFAULTS = {
  name: 'Kaarthikeya',
  goal: 'Muscle Gain',
  experience: 'Intermediate',
  units: 'kg',
  defaultSets: 4,
  defaultReps: 8,
  restSeconds: 90,
  autoRest: true,
  showGhost: true
};

/* ---------- low level ---------- */

let memoryFallback = {};
let warned = false;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch (err) {
    return structuredClone(memoryFallback[key] ?? fallback);
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    /* private mode or a full quota — keep the session usable in memory */
    memoryFallback[key] = value;
    if (!warned) { warned = true; console.warn('Storage unavailable; this session will not persist.', err); }
  }
  emit();
}

/* ---------- change notification ---------- */

const listeners = new Set();
export const onChange = fn => { listeners.add(fn); return () => listeners.delete(fn); };
function emit() { for (const fn of listeners) fn(); }

/* ---------- settings ---------- */

export const getSettings = () => Object.assign({}, DEFAULTS, read(K.settings, {}));
export function saveSettings(patch) {
  write(K.settings, Object.assign(getSettings(), patch));
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
  e.sets[index] = Object.assign({}, e.sets[index], data);
  /* the exercise counts as done once every planned set is ticked */
  e.done = e.sets.slice(0, setCount).every(x => x.done);
  saveSession(dayId, date, s);
  updatePR(exId, e.sets, date);
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

export function resetSession(dayId, date = new Date()) {
  const all = allSessions();
  delete all[sessionKey(dayId, date)];
  write(K.sessions, all);
}

/* ---------- personal records ---------- */

const allPRs = () => read(K.prs, {});

function updatePR(exId, sets, date) {
  const logged = sets.filter(s => s.done && Number(s.weight) > 0);
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
    const doneSets = entries.flatMap(e => e.sets.filter(x => x.done));
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

/* ---------- data management ---------- */

export function exportData() {
  return JSON.stringify({
    version: 1, exportedAt: new Date().toISOString(),
    settings: getSettings(), sessions: allSessions(), prs: allPRs()
  }, null, 2);
}

export function importData(json) {
  const data = JSON.parse(json);
  if (!data || typeof data !== 'object') throw new Error('Not a valid backup file.');
  if (data.settings) write(K.settings, data.settings);
  if (data.sessions) write(K.sessions, data.sessions);
  if (data.prs) write(K.prs, data.prs);
  return true;
}

export function clearAll(what = 'all') {
  if (what === 'all' || what === 'sessions') write(K.sessions, {});
  if (what === 'all' || what === 'prs') write(K.prs, {});
  if (what === 'all') write(K.settings, {});
}
