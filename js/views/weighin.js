/* weighin.js — gym check-in / check-out weight capture.
 *
 * The first and last thing that happens at the gym, so it is a single sheet with
 * one big number, large steppers and one button. The session difference is shown
 * with an explicit caveat: over an hour it is water, food and glycogen, not fat.
 */

import { el, icon, toast, sheet } from '../ui.js';
import * as store from '../storage.js';

const COPY = {
  checkin: {
    title: 'Gym Check-In',
    prompt: "What's your weight?",
    action: 'SAVE WEIGHT'
  },
  checkout: {
    title: 'Gym Check-Out',
    prompt: 'End-of-workout weight',
    action: 'SAVE & FINISH'
  },
  manual: {
    title: 'Log Weight',
    prompt: "Today's weight",
    action: 'SAVE WEIGHT'
  }
};

/**
 * Open the weigh-in sheet.
 * @param {'checkin'|'checkout'|'manual'} kind
 */
export function weighInSheet(kind, opts = {}) {
  const copy = COPY[kind] || COPY.manual;
  const units = store.getSettings().units;
  const existing = store.weightsOn()[kind];
  const seed = existing?.kg ?? store.latestWeight()?.kg ?? 75;

  const input = el('input', {
    type: 'number', inputmode: 'decimal', step: '0.1', min: '20', max: '400',
    class: 'weigh-input', value: String(seed), 'aria-label': `Weight in ${units}`
  });

  const nudge = (delta) => {
    const next = Math.round((Number(input.value || seed) + delta) * 10) / 10;
    input.value = String(Math.min(400, Math.max(20, next)));
  };

  const body = el('div', { class: 'stack' }, [
    el('p', { class: 'muted', style: 'text-align:center', text: copy.prompt }),
    el('div', { class: 'weigh-row' }, [
      el('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Decrease 0.1', text: '−', onclick: () => nudge(-0.1) }),
      el('div', { class: 'weigh-value' }, [input, el('span', { class: 'weigh-unit', text: units })]),
      el('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Increase 0.1', text: '+', onclick: () => nudge(0.1) })
    ]),
    el('div', { class: 'row', style: 'gap:8px;justify-content:center' },
      [-1, -0.5, 0.5, 1].map(d => el('button', {
        class: 'chip', type: 'button', text: (d > 0 ? '+' : '') + d, onclick: () => nudge(d)
      }))),
    el('button', {
      class: 'btn btn-primary btn-lg btn-block', type: 'button', text: copy.action,
      onclick: save
    }),
    existing && el('p', { class: 'dim', style: 'font-size:12.5px;text-align:center',
      text: `Recorded at ${existing.time} — saving again replaces it.` })
  ]);

  const ref = sheet(copy.title, body);
  setTimeout(() => { input.focus(); input.select?.(); }, 60);

  function save() {
    try {
      const val = Number(input.value);
      if (val > seed * 4 && val.toString().length >= 3 && !input.value.includes('.')) {
        const suggested = val / 10;
        if (confirm(`Did you mean ${suggested} ${units}?`)) {
          input.value = String(suggested);
          return;
        }
      }
      const entry = store.addWeight(input.value, kind, new Date(), opts.dayId);
      toast(`${entry.kg} ${units} saved`, 'check');
      ref.close();
      opts.onSaved?.(entry);
    } catch (err) {
      toast('Enter a valid weight', 'close');
    }
  }
  return ref;
}

/**
 * The check-in vs check-out difference, always labelled for what it is.
 * Returns null when there is nothing to compare.
 */
export function sessionWeightNote(checkIn, checkOut) {
  if (checkIn == null || checkOut == null) return null;
  const delta = Math.round((checkOut - checkIn) * 10) / 10;
  const sign = delta > 0 ? '+' : '';
  return el('div', { class: 'session-delta' }, [
    el('p', { class: 'eyebrow', text: 'Session weight change' }),
    el('p', { class: 'delta-value', text: `${sign}${delta} kg` }),
    el('p', { class: 'dim', style: 'font-size:12.5px;line-height:1.45',
      text: 'Session weight changes are usually influenced by hydration, food, glycogen and fluid loss. Use your longer-term weight trend to evaluate actual weight-loss progress.' })
  ]);
}

/** Compact check-in / check-out pair for the dashboard and summary screens. */
export function checkPair(dayId, onChange) {
  const w = store.weightsOn();
  const units = store.getSettings().units;

  const slot = (kind, label) => {
    const entry = w[kind];
    return el('button', {
      class: `check-slot${entry ? ' filled' : ''}`, type: 'button',
      'aria-label': entry ? `${label}: ${entry.kg} ${units}. Change.` : `Record ${label}`,
      onclick: () => weighInSheet(kind, { dayId, onSaved: onChange })
    }, [
      el('span', { class: 'eyebrow', text: label }),
      el('strong', { text: entry ? `${entry.kg}` : '—' }),
      el('span', { class: 'dim', style: 'font-size:11px', text: entry ? `${units} · ${entry.time}` : 'not recorded' })
    ]);
  };

  return el('div', { class: 'check-pair' }, [
    slot('checkin', 'Check-in'),
    slot('checkout', 'Check-out')
  ]);
}
