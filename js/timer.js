/* timer.js — rest timer.
 *
 * A single module-level timer survives view changes, and counts against a
 * timestamp rather than an interval tick, so it stays accurate if the phone
 * sleeps or the browser throttles background timers mid-set.
 */

import { el, icon, sheet, mmss, toast } from './ui.js';
import { getSettings, saveSettings } from './storage.js';

const PRESETS = [60, 90, 120, 180];

const state = {
  total: 90,
  endsAt: null,     /* epoch ms while running */
  remaining: 90,    /* seconds, when paused */
  running: false,
  finished: false
};

let fab = null;
let raf = 0;
const subs = new Set();

export const onTick = fn => { subs.add(fn); return () => subs.delete(fn); };

function secondsLeft() {
  if (!state.running) return state.remaining;
  return Math.max(0, Math.ceil((state.endsAt - Date.now()) / 1000));
}

function notify() {
  const left = secondsLeft();
  for (const fn of subs) fn(left, state);
  render();
}

/* ---------- alert ---------- */

/* WebAudio rather than an audio file: nothing to download, works offline. */
function beep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [0, 0.22, 0.44].forEach((offset, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 2 ? 1046 : 784;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.32, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch { /* audio is a nicety, never a blocker */ }
}

function finish() {
  state.running = false;
  state.finished = true;
  state.remaining = 0;
  beep();
  navigator.vibrate?.([180, 90, 180]);
  toast('Rest complete', 'timer');
  notify();
}

function loop() {
  if (!state.running) return;
  if (secondsLeft() <= 0) { finish(); return; }
  notify();
  raf = setTimeout(loop, 250);
}

/* ---------- controls ---------- */

export function setDuration(seconds) {
  state.total = Math.max(5, Math.min(900, seconds));
  state.remaining = state.total;
  state.finished = false;
  if (state.running) state.endsAt = Date.now() + state.remaining * 1000;
  notify();
}

export function adjust(delta) {
  const base = secondsLeft();
  const next = Math.max(5, Math.min(900, base + delta));
  state.remaining = next;
  state.total = Math.max(state.total, next);
  state.finished = false;
  if (state.running) state.endsAt = Date.now() + next * 1000;
  notify();
}

export function start(seconds) {
  if (seconds) { state.total = seconds; state.remaining = seconds; }
  if (state.remaining <= 0) state.remaining = state.total;
  state.finished = false;
  state.running = true;
  state.endsAt = Date.now() + state.remaining * 1000;
  clearTimeout(raf);
  loop();
}

export function pause() {
  if (!state.running) return;
  state.remaining = secondsLeft();
  state.running = false;
  clearTimeout(raf);
  notify();
}

export function reset() {
  state.running = false;
  state.finished = false;
  state.remaining = state.total;
  clearTimeout(raf);
  notify();
}

export const isRunning = () => state.running;

/** Kick off a rest period from the workout screen. */
export function restAfterSet() {
  const s = getSettings();
  if (!s.autoRest) return;
  start(s.restSeconds);
}

/* ---------- floating control ---------- */

function render() {
  if (!fab) return;
  const left = secondsLeft();
  fab.querySelector('.t').textContent = mmss(left);
  fab.classList.toggle('running', state.running);
  fab.classList.toggle('done', state.finished);
  fab.setAttribute('aria-label', state.running
    ? `Rest timer running, ${mmss(left)} remaining. Open timer.`
    : 'Open rest timer');
}

export function mountTimerFab() {
  if (fab) return fab;
  fab = el('button', {
    class: 'timer-fab', type: 'button', onclick: openTimerSheet,
    html: `${icon('timer')}<span class="t">${mmss(state.remaining)}</span>`
  });
  document.body.appendChild(fab);
  const s = getSettings();
  state.total = s.restSeconds;
  state.remaining = s.restSeconds;
  render();
  return fab;
}

/* ---------- timer sheet ---------- */

export function openTimerSheet() {
  const readout = el('div', { class: 'timer-readout', text: mmss(secondsLeft()) });
  const startBtn = el('button', { class: 'btn btn-primary btn-lg btn-block', type: 'button' });

  const presets = el('div', { class: 'chips', role: 'group', 'aria-label': 'Rest presets' },
    PRESETS.map(p => el('button', {
      class: 'chip', type: 'button', dataset: { secs: String(p) },
      'aria-pressed': String(state.total === p),
      text: p < 60 ? `${p} sec` : `${p / 60} min`,
      onclick: () => { setDuration(p); paint(); }
    })));

  const adjustRow = el('div', { class: 'row', style: 'gap:10px' }, [
    el('button', { class: 'btn grow', type: 'button', text: '−30 sec', onclick: () => { adjust(-30); paint(); } }),
    el('button', { class: 'btn grow', type: 'button', text: '+30 sec', onclick: () => { adjust(30); paint(); } })
  ]);

  const defaultRow = el('label', { class: 'setting-row', style: 'border:0;padding-top:4px' }, [
    el('div', {}, [
      el('div', { class: 'lbl', text: 'Use as my default' }),
      el('div', { class: 'hint', text: 'Applied when a set is completed in workout mode.' })
    ]),
    el('button', {
      class: 'btn', type: 'button', text: 'Save',
      onclick: () => { saveSettings({ restSeconds: state.total }); toast(`Default rest ${mmss(state.total)}`, 'timer'); }
    })
  ]);

  function paint() {
    readout.textContent = mmss(secondsLeft());
    readout.classList.toggle('done', state.finished);
    startBtn.textContent = state.running ? 'Pause' : (secondsLeft() === 0 ? 'Restart' : 'Start');
    for (const c of presets.children) c.setAttribute('aria-pressed', String(Number(c.dataset.secs) === state.total));
  }

  startBtn.addEventListener('click', () => {
    if (state.running) pause();
    else start(secondsLeft() > 0 ? secondsLeft() : state.total);
    paint();
  });

  const unsub = onTick(() => paint());
  const body = el('div', { class: 'timer-sheet' }, [
    readout,
    presets,
    adjustRow,
    startBtn,
    el('button', { class: 'btn btn-ghost btn-block', type: 'button', text: 'Reset', onclick: () => { reset(); paint(); } }),
    defaultRow
  ]);

  paint();
  sheet('Rest Timer', body, { onClose: unsub });
}
