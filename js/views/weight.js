/* weight.js — the weight journey: trend, goal progress, milestones, history. */

import { el, icon, relativeDate } from '../ui.js';
import { weightChart } from '../chart.js';
import { MILESTONES } from '../data/plan.js';
import * as store from '../storage.js';
import { weighInSheet, sessionWeightNote } from './weighin.js';

const RANGES = ['7D', '30D', '3M', '6M', '1Y', 'ALL'];
let activeRange = '30D';   /* remembered between visits */

export function view(params, app) {
  const container = el('div', { class: 'view stack-lg' });

  function paint() {
    const settings = store.getSettings();
    const units = settings.units;
    const goal = store.weightGoal();
    const stats = store.weightStats(activeRange);
    const all = store.getWeights();
    container.replaceChildren();

    /* ---------- headline ---------- */
    container.appendChild(el('section', { class: 'card accent-weight' }, [
      el('div', { class: 'weight-grid' }, [
        metric('Current', goal.current != null ? `${goal.current}` : '—', units),
        metric('Target', `${goal.target}`, units),
        metric('Remaining', goal.remaining != null ? `${goal.remaining}` : '—', units)
      ]),
      goal.current != null ? el('div', { style: 'margin-top:16px' }, [
        el('div', { class: 'row-between' }, [
          el('span', { class: 'dim', style: 'font-size:12px', text: `Start ${goal.start}` }),
          el('span', { class: 'dim', style: 'font-size:12px', text: `Target ${goal.target}` })
        ]),
        el('div', { class: 'bar', style: 'margin-top:6px' }, [el('i', { style: `width:${goal.pct}%` })]),
        el('p', { class: 'dim', style: 'font-size:12.5px;margin-top:8px',
          text: `${goal.pct}% of the way from your starting weight to target` })
      ]) : null,
      el('button', {
        class: 'btn btn-primary btn-block btn-lg', style: 'margin-top:16px', type: 'button',
        html: `${icon('check')}<span>LOG WEIGHT</span>`,
        onclick: () => weighInSheet('manual', { onSaved: paint })
      })
    ]));

    /* ---------- trend ---------- */
    const rangeChips = el('div', { class: 'chips', role: 'group', 'aria-label': 'Chart range' },
      RANGES.map(r => el('button', {
        class: 'chip', type: 'button', text: r, 'aria-pressed': String(r === activeRange),
        onclick: () => { activeRange = r; paint(); }
      })));

    const trendCard = el('section', { class: 'card' }, [
      el('div', { class: 'row-between' }, [
        el('p', { class: 'eyebrow', text: 'Weight trend' }),
        stats ? el('span', {
          class: `tag ${stats.change < 0 ? 'tag-accent' : ''}`.trim(),
          text: `${stats.change > 0 ? '+' : ''}${stats.change} ${units}`
        }) : null
      ]),
      rangeChips
    ]);

    if (stats) {
      const series = store.weightSeries(activeRange);
      trendCard.appendChild(weightChart(series, store.movingAverage(series), { target: goal.target, unit: units }));
      trendCard.appendChild(el('p', { class: 'dim', style: 'font-size:12px;text-align:center;margin-top:2px',
        text: 'Bold line is the 7-day trend. Dots are individual readings.' }));
      trendCard.appendChild(el('div', { class: 'stat-row stat-4', style: 'margin-top:14px' }, [
        stat('Current', stats.current), stat('Average', stats.average),
        stat('Lowest', stats.lowest), stat('Highest', stats.highest)
      ]));
    } else {
      trendCard.appendChild(el('div', { class: 'empty' }, [
        el('p', { text: 'No measurements in this range yet.' }),
        el('p', { style: 'font-size:13px', text: 'Record a weigh-in and your trend will build from there.' })
      ]));
    }
    container.appendChild(trendCard);

    /* ---------- today's session ---------- */
    const w = store.weightsOn();
    const note = sessionWeightNote(w.checkin?.kg ?? null, w.checkout?.kg ?? null);
    if (note) container.appendChild(el('section', { class: 'card' }, [note]));

    /* ---------- milestones ---------- */
    const current = goal.current;
    container.appendChild(el('section', { class: 'card' }, [
      el('p', { class: 'eyebrow', style: 'margin-bottom:4px', text: 'Milestones' }),
      el('p', { class: 'dim', style: 'font-size:12.5px;margin-bottom:10px',
        text: `Your target range is ${settings.targetMin}–${settings.targetMax} ${units}, with ${goal.target} ${units} as the primary target.` }),
      el('ul', { class: 'milestones' }, MILESTONES.map(m => {
        const reached = current != null && current <= m;
        const isTarget = m === goal.target;
        return el('li', { class: reached ? 'reached' : '' }, [
          el('span', { class: 'ms-mark', html: reached ? icon('check') : '' }),
          el('span', { class: 'grow', text: `${m} ${units}` }),
          isTarget ? el('span', { class: 'tag tag-accent', text: 'Primary target' })
            : (m >= settings.targetMin && m <= settings.targetMax)
              ? el('span', { class: 'tag', text: 'In range' })
              : null
        ]);
      }))
    ]));

    /* ---------- history ---------- */
    const recent = all.slice().reverse().slice(0, 30);
    container.appendChild(el('section', { class: 'card' }, [
      el('p', { class: 'eyebrow', style: 'margin-bottom:10px', text: 'History' }),
      recent.length
        ? el('div', {}, recent.map(e => el('div', { class: 'hist-row' }, [
            el('span', { class: 'dt', text: relativeDate(e.date) }),
            el('div', { class: 'row-between grow' }, [
              el('span', { style: 'font-weight:700', text: `${e.kg} ${units}` }),
              el('span', { class: 'dim', style: 'font-size:12px', text: `${labelKind(e.kind)} · ${e.time}` })
            ])
          ])))
        : el('p', { class: 'dim', style: 'font-size:13px', text: 'Nothing recorded yet.' })
    ]));
  }

  paint();
  return { title: 'Weight', eyebrow: 'Journey', back: '#/', node: container };
}

const labelKind = k => k === 'checkin' ? 'Check-in' : k === 'checkout' ? 'Check-out' : 'Logged';

function metric(label, value, unit) {
  return el('div', { class: 'weight-metric' }, [
    el('p', { class: 'eyebrow', text: label }),
    el('p', { class: 'wm-value' }, [el('strong', { text: value }), el('span', { text: unit })])
  ]);
}

function stat(label, value) {
  return el('div', { class: 'stat' }, [
    el('b', { text: String(value) }),
    el('span', { text: label })
  ]);
}
