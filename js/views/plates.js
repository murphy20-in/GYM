/* plates.js — what to load on the bar.
 *
 * Answers the one question worth asking mid-session: for this total, what goes
 * on each side? Greedy from the heaviest plate down, which is how anyone loads
 * a bar in practice.
 */

import { el, sheet, toast } from '../ui.js';
import * as store from '../storage.js';

const DEFAULT_BAR = 20;
const DEFAULT_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

/* Plate colours follow common gym convention, but each chip also carries its
   weight as text — colour is never the only identifier. */
const PLATE_COLOUR = {
  25: '#c0392b', 20: '#2d6cdf', 15: '#d4a017', 10: '#2e8b57',
  5: '#e8e8e8', 2.5: '#1f1f1f', 1.25: '#8a8a8a'
};

/**
 * Closest loadable total at or below `target`, and the per-side plates.
 * Returns null when the bar alone already exceeds the target.
 */
export function solve(target, bar = DEFAULT_BAR, available = DEFAULT_PLATES) {
  const goal = Number(target);
  if (!isFinite(goal) || goal < bar) return null;

  let perSide = (goal - bar) / 2;
  const plates = [];
  for (const p of [...available].sort((a, b) => b - a)) {
    while (perSide >= p - 1e-9) { plates.push(p); perSide -= p; }
  }
  const loadedPerSide = plates.reduce((a, b) => a + b, 0);
  const total = bar + loadedPerSide * 2;
  return {
    bar,
    plates,
    perSide: Math.round(loadedPerSide * 100) / 100,
    total: Math.round(total * 100) / 100,
    remainder: Math.round((goal - total) * 100) / 100
  };
}

/** Open the calculator, seeded with the weight currently in the logger. */
export function plateCalculator(seed = 60) {
  const settings = store.getSettings();
  const unit = settings.units;
  const bar = Number(settings.barWeight) || DEFAULT_BAR;

  let target = Number(seed) || bar;

  const readout = el('div', { class: 'plate-readout' });
  const input = el('input', {
    type: 'number', inputmode: 'decimal', step: '2.5', min: String(bar), class: 'weigh-input',
    value: String(target), 'aria-label': `Target weight in ${unit}`
  });

  function paint() {
    const res = solve(target, bar);
    readout.replaceChildren();

    if (!res) {
      readout.appendChild(el('p', { class: 'muted', style: 'text-align:center',
        text: `That is below the bar itself (${bar} ${unit}).` }));
      return;
    }

    readout.appendChild(el('p', { class: 'eyebrow', style: 'text-align:center', text: 'Per side' }));

    readout.appendChild(res.plates.length
      ? el('div', { class: 'plate-stack' }, res.plates.map(p => el('span', {
          class: 'plate-chip',
          style: `background:${PLATE_COLOUR[p] || '#666'};color:${p === 5 || p === 1.25 ? '#111' : '#fff'}`,
          text: String(p)
        })))
      : el('p', { class: 'dim', style: 'text-align:center', text: 'Empty bar' }));

    readout.appendChild(el('div', { class: 'stat-row', style: 'margin-top:16px' }, [
      stat('Per side', `${res.perSide}`),
      stat(`Bar ${unit}`, `${res.bar}`),
      stat('Total', `${res.total}`)
    ]));

    if (res.remainder > 0.01) {
      readout.appendChild(el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:10px;text-align:center',
        text: `Closest loadable is ${res.total} ${unit} — ${res.remainder} ${unit} short of ${target}.` }));
    }
  }

  const nudge = d => { target = Math.max(bar, Math.round((target + d) * 100) / 100); input.value = String(target); paint(); };
  input.addEventListener('change', () => { target = Number(input.value) || bar; paint(); });

  const body = el('div', { class: 'stack' }, [
    el('div', { class: 'weigh-row' }, [
      el('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Down 2.5', text: '−', onclick: () => nudge(-2.5) }),
      el('div', { class: 'weigh-value' }, [input, el('span', { class: 'weigh-unit', text: unit })]),
      el('button', { class: 'btn btn-icon', type: 'button', 'aria-label': 'Up 2.5', text: '+', onclick: () => nudge(2.5) })
    ]),
    readout,
    el('label', { class: 'setting-row', style: 'border:0' }, [
      el('div', {}, [
        el('div', { class: 'lbl', text: 'Bar weight' }),
        el('div', { class: 'hint', text: 'Remembered for next time' })
      ]),
      el('input', {
        type: 'number', class: 'input', style: 'width:100px', min: '1', max: '60', step: '0.5',
        value: String(bar), 'aria-label': 'Bar weight',
        onchange: e => {
          const v = Number(e.target.value);
          if (v > 0) { store.saveSettings({ barWeight: v }); toast(`Bar set to ${v} ${unit}`); ref.close(); plateCalculator(target); }
        }
      })
    ])
  ]);

  paint();
  const ref = sheet('Plate calculator', body);
  return ref;
}

function stat(label, value) {
  return el('div', { class: 'stat' }, [el('b', { text: value }), el('span', { text: label })]);
}
